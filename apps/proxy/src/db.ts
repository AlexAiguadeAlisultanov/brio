import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import type { DatabaseSync as TDatabaseSync } from 'node:sqlite'

// node:sqlite es un builtin reciente de Node 24. Lo cargamos con createRequire en vez de un
// import estático porque la lista de builtins de Vite (que usa Vitest) aún no lo reconoce y
// trataría de empaquetarlo. El tipo sí se importa (import type, se borra al compilar).
const requerir = createRequire(import.meta.url)
const { DatabaseSync } = requerir('node:sqlite') as typeof import('node:sqlite')

// Capa de datos del backend. Usa node:sqlite (incluido en Node 24, sin dependencias
// nativas). La base se abre de forma perezosa en el primer uso, leyendo DB_PATH en ese
// momento, para que los tests puedan apuntarla a ':memory:' antes de la primera consulta.
//
// OJO EN PRODUCCIÓN: el disco de Render es efímero y se borra en cada despliegue, así que
// una base SQLite en fichero pierde las cuentas al redesplegar. Para producción conviene
// una base persistente (Turso, Postgres). Para la demo, SQLite en fichero es suficiente.
// Esto está documentado en .env.example y en el README del proxy.

export interface Usuario {
  id: string
  email: string
  hash: string
  sal: string
  creado_en: string
  premium: number
  premium_hasta: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

let base: TDatabaseSync | null = null

// Devuelve la conexión única, creándola (y creando su carpeta y sus tablas) la primera vez.
function db(): TDatabaseSync {
  if (base) return base

  const ruta = process.env.DB_PATH ?? './datos/brio.db'
  // ':memory:' y similares no tienen carpeta que crear.
  if (!ruta.startsWith(':')) {
    mkdirSync(dirname(ruta), { recursive: true })
  }

  const conexion = new DatabaseSync(ruta)
  conexion.exec('PRAGMA journal_mode = WAL')
  conexion.exec('PRAGMA foreign_keys = ON')
  conexion.exec(`
    CREATE TABLE IF NOT EXISTS usuario (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      hash TEXT NOT NULL,
      sal TEXT NOT NULL,
      creado_en TEXT NOT NULL,
      premium INTEGER NOT NULL DEFAULT 0,
      premium_hasta TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT
    );
    CREATE TABLE IF NOT EXISTS sesion (
      token TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL,
      creado_en TEXT NOT NULL,
      expira_en TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sesion_usuario ON sesion(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_usuario_customer ON usuario(stripe_customer_id);
  `)

  base = conexion
  return base
}

// --- Usuarios --------------------------------------------------------------

export function crearUsuario(datos: { email: string; hash: string; sal: string }): Usuario {
  const id = randomUUID()
  const creadoEn = new Date().toISOString()
  db()
    .prepare(
      'INSERT INTO usuario (id, email, hash, sal, creado_en, premium) VALUES (?, ?, ?, ?, ?, 0)',
    )
    .run(id, datos.email, datos.hash, datos.sal, creadoEn)
  return obtenerUsuarioPorId(id)!
}

export function obtenerUsuarioPorEmail(email: string): Usuario | null {
  return (db().prepare('SELECT * FROM usuario WHERE email = ?').get(email) as Usuario | undefined) ?? null
}

export function obtenerUsuarioPorId(id: string): Usuario | null {
  return (db().prepare('SELECT * FROM usuario WHERE id = ?').get(id) as Usuario | undefined) ?? null
}

export function obtenerUsuarioPorCustomer(customerId: string): Usuario | null {
  return (
    (db().prepare('SELECT * FROM usuario WHERE stripe_customer_id = ?').get(customerId) as
      | Usuario
      | undefined) ?? null
  )
}

export function guardarCustomer(usuarioId: string, customerId: string): void {
  db().prepare('UPDATE usuario SET stripe_customer_id = ? WHERE id = ?').run(customerId, usuarioId)
}

export function guardarSuscripcion(usuarioId: string, subscriptionId: string | null): void {
  db().prepare('UPDATE usuario SET stripe_subscription_id = ? WHERE id = ?').run(subscriptionId, usuarioId)
}

// Enciende o apaga el premium. premiumHasta en ISO (o null = sin caducidad conocida).
export function fijarPremium(usuarioId: string, premium: boolean, premiumHasta: string | null): void {
  db()
    .prepare('UPDATE usuario SET premium = ?, premium_hasta = ? WHERE id = ?')
    .run(premium ? 1 : 0, premiumHasta, usuarioId)
}

// Regla única de entitlement: es premium si la marca está puesta y, si hay fecha de
// caducidad, aún no ha pasado. Una suscripción activa guarda el fin del periodo como tope;
// un pase guarda ahora+30 días. Centralizarlo evita decidirlo en dos sitios distintos.
export function usuarioEsPremium(u: Usuario, ahora: Date = new Date()): boolean {
  if (!u.premium) return false
  if (!u.premium_hasta) return true
  const limite = new Date(u.premium_hasta)
  if (Number.isNaN(limite.getTime())) return false
  return limite.getTime() > ahora.getTime()
}

// --- Sesiones --------------------------------------------------------------

// Vida de una sesión en días. Un token caducado se trata como ausente.
const DIAS_SESION = Number(process.env.DIAS_SESION ?? 30)

// Crea una sesión y devuelve el token EN CLARO (lo único que ve el cliente). En la base solo
// se guarda su hash: si alguien leyera la tabla sesion no podría suplantar a nadie.
export function crearSesion(usuarioId: string): string {
  const enClaro = randomBytes(32).toString('hex')
  const creadoEn = new Date()
  const expira = new Date(creadoEn.getTime() + DIAS_SESION * 24 * 60 * 60 * 1000)
  db()
    .prepare('INSERT INTO sesion (token, usuario_id, creado_en, expira_en) VALUES (?, ?, ?, ?)')
    .run(hashToken(enClaro), usuarioId, creadoEn.toISOString(), expira.toISOString())
  return enClaro
}

// Resuelve un token en claro al usuario de su sesión, si existe y no ha caducado. Borra de
// paso las sesiones ya vencidas de ese usuario para que la tabla no crezca sin fin.
export function usuarioPorToken(enClaro: string): Usuario | null {
  const fila = db()
    .prepare('SELECT usuario_id, expira_en FROM sesion WHERE token = ?')
    .get(hashToken(enClaro)) as { usuario_id: string; expira_en: string } | undefined
  if (!fila) return null
  if (new Date(fila.expira_en).getTime() <= Date.now()) {
    borrarSesion(enClaro)
    return null
  }
  return obtenerUsuarioPorId(fila.usuario_id)
}

export function borrarSesion(enClaro: string): void {
  db().prepare('DELETE FROM sesion WHERE token = ?').run(hashToken(enClaro))
}

// Hash del token para guardarlo en reposo. Con TOKEN_SECRETO es un HMAC (un robo de la base
// no basta para fabricar tokens válidos); sin él, un SHA-256 simple. El token en claro nunca
// se guarda.
function hashToken(enClaro: string): string {
  const secreto = process.env.TOKEN_SECRETO ?? 'brio-sin-secreto'
  return createHmac('sha256', secreto).update(enClaro).digest('hex')
}

// Solo para tests: cierra y olvida la conexión para poder empezar de cero.
export function _reiniciarBaseParaTests(): void {
  if (base) {
    base.close()
    base = null
  }
}
