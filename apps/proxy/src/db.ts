import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createClient, type Client, type Row } from '@libsql/client'

// Capa de datos del backend. Usa libSQL (@libsql/client), que habla el mismo SQLite que antes
// pero también con Turso, una base persistente en la nube. La conexión es asíncrona, así que
// todas las funciones de acceso devuelven Promise. La base se abre de forma perezosa en el
// primer uso, leyendo el entorno en ese momento, para que los tests puedan apuntarla a
// ':memory:' antes de la primera consulta.
//
// Qué base se usa, por orden:
//   1. BRIO_DB_URL (+ BRIO_DB_TOKEN)  -> Turso. Es lo que hay que usar en producción: el disco
//      de Render es efímero y se borra en cada despliegue, así que un fichero pierde las
//      cuentas y suscripciones al redesplegar.
//   2. DB_PATH                         -> fichero local (por defecto ./datos/brio.db). Sirve para
//      desarrollo y para la demo sin Turso. DB_PATH=':memory:' da una base en memoria (tests).
// Está documentado en .env.example y en el README del proxy.

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

// Esquema. Cada sentencia por separado para poder lanzarlas juntas con batch(), que funciona
// igual contra un fichero local y contra Turso.
const ESQUEMA = [
  `CREATE TABLE IF NOT EXISTS usuario (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hash TEXT NOT NULL,
    sal TEXT NOT NULL,
    creado_en TEXT NOT NULL,
    premium INTEGER NOT NULL DEFAULT 0,
    premium_hasta TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sesion (
    token TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    creado_en TEXT NOT NULL,
    expira_en TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_sesion_usuario ON sesion(usuario_id)',
  'CREATE INDEX IF NOT EXISTS idx_usuario_customer ON usuario(stripe_customer_id)',
]

// Guardamos la PROMESA del cliente, no el cliente: así dos peticiones simultáneas en el
// arranque comparten una única apertura y creación de tablas en vez de competir.
let conexion: Promise<Client> | null = null

// Decide a qué base conectar según el entorno (ver arriba). Crea la carpeta del fichero local.
function configuracionBase(): { url: string; authToken?: string; local: boolean; enMemoria: boolean } {
  const remota = process.env.BRIO_DB_URL?.trim()
  if (remota) {
    return { url: remota, authToken: process.env.BRIO_DB_TOKEN?.trim() || undefined, local: false, enMemoria: false }
  }

  const ruta = process.env.DB_PATH ?? './datos/brio.db'
  // ':memory:' y similares no tienen carpeta que crear ni se escriben a disco.
  if (ruta.startsWith(':')) return { url: ruta, local: true, enMemoria: true }

  mkdirSync(dirname(ruta), { recursive: true })
  return { url: `file:${ruta}`, local: true, enMemoria: false }
}

async function abrirBase(): Promise<Client> {
  const { url, authToken, local, enMemoria } = configuracionBase()
  const cliente = createClient({ url, authToken })

  // Estos PRAGMA son de conexión y solo tienen sentido en SQLite local. Turso ya fuerza las
  // claves foráneas y gestiona su propio almacenamiento.
  if (local) {
    if (!enMemoria) await cliente.execute('PRAGMA journal_mode = WAL')
    await cliente.execute('PRAGMA foreign_keys = ON')
  }
  await cliente.batch(ESQUEMA, 'write')
  return cliente
}

// Devuelve la conexión única, creándola (y creando sus tablas) la primera vez. Si la apertura
// falla (p. ej. Turso caído al arrancar), se olvida la promesa para reintentar en la siguiente
// petición en vez de dejar el servidor roto para siempre.
function db(): Promise<Client> {
  if (!conexion) {
    conexion = abrirBase().catch((error: unknown) => {
      conexion = null
      throw error
    })
  }
  return conexion
}

// Convierte una fila de libSQL en un Usuario tipado, campo a campo.
function aUsuario(fila: Row): Usuario {
  const texto = (v: unknown): string | null => (v === null || v === undefined ? null : String(v))
  return {
    id: String(fila.id),
    email: String(fila.email),
    hash: String(fila.hash),
    sal: String(fila.sal),
    creado_en: String(fila.creado_en),
    premium: Number(fila.premium),
    premium_hasta: texto(fila.premium_hasta),
    stripe_customer_id: texto(fila.stripe_customer_id),
    stripe_subscription_id: texto(fila.stripe_subscription_id),
  }
}

// --- Usuarios --------------------------------------------------------------

export async function crearUsuario(datos: { email: string; hash: string; sal: string }): Promise<Usuario> {
  const id = randomUUID()
  const creadoEn = new Date().toISOString()
  const base = await db()
  await base.execute({
    sql: 'INSERT INTO usuario (id, email, hash, sal, creado_en, premium) VALUES (?, ?, ?, ?, ?, 0)',
    args: [id, datos.email, datos.hash, datos.sal, creadoEn],
  })
  return (await obtenerUsuarioPorId(id))!
}

export async function obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const base = await db()
  const res = await base.execute({ sql: 'SELECT * FROM usuario WHERE email = ?', args: [email] })
  return res.rows[0] ? aUsuario(res.rows[0]) : null
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  const base = await db()
  const res = await base.execute({ sql: 'SELECT * FROM usuario WHERE id = ?', args: [id] })
  return res.rows[0] ? aUsuario(res.rows[0]) : null
}

export async function obtenerUsuarioPorCustomer(customerId: string): Promise<Usuario | null> {
  const base = await db()
  const res = await base.execute({
    sql: 'SELECT * FROM usuario WHERE stripe_customer_id = ?',
    args: [customerId],
  })
  return res.rows[0] ? aUsuario(res.rows[0]) : null
}

export async function guardarCustomer(usuarioId: string, customerId: string): Promise<void> {
  const base = await db()
  await base.execute({
    sql: 'UPDATE usuario SET stripe_customer_id = ? WHERE id = ?',
    args: [customerId, usuarioId],
  })
}

export async function guardarSuscripcion(usuarioId: string, subscriptionId: string | null): Promise<void> {
  const base = await db()
  await base.execute({
    sql: 'UPDATE usuario SET stripe_subscription_id = ? WHERE id = ?',
    args: [subscriptionId, usuarioId],
  })
}

// Enciende o apaga el premium. premiumHasta en ISO (o null = sin caducidad conocida).
export async function fijarPremium(
  usuarioId: string,
  premium: boolean,
  premiumHasta: string | null,
): Promise<void> {
  const base = await db()
  await base.execute({
    sql: 'UPDATE usuario SET premium = ?, premium_hasta = ? WHERE id = ?',
    args: [premium ? 1 : 0, premiumHasta, usuarioId],
  })
}

// Regla única de entitlement: es premium si la marca está puesta y, si hay fecha de
// caducidad, aún no ha pasado. Una suscripción activa guarda el fin del periodo como tope;
// un pase guarda ahora+30 días. Centralizarlo evita decidirlo en dos sitios distintos.
// Es lógica pura (no toca la base), por eso sigue siendo síncrona.
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
export async function crearSesion(usuarioId: string): Promise<string> {
  const enClaro = randomBytes(32).toString('hex')
  const creadoEn = new Date()
  const expira = new Date(creadoEn.getTime() + DIAS_SESION * 24 * 60 * 60 * 1000)
  const base = await db()
  await base.execute({
    sql: 'INSERT INTO sesion (token, usuario_id, creado_en, expira_en) VALUES (?, ?, ?, ?)',
    args: [hashToken(enClaro), usuarioId, creadoEn.toISOString(), expira.toISOString()],
  })
  return enClaro
}

// Resuelve un token en claro al usuario de su sesión, si existe y no ha caducado. Borra de
// paso las sesiones ya vencidas de ese usuario para que la tabla no crezca sin fin.
export async function usuarioPorToken(enClaro: string): Promise<Usuario | null> {
  const base = await db()
  const res = await base.execute({
    sql: 'SELECT usuario_id, expira_en FROM sesion WHERE token = ?',
    args: [hashToken(enClaro)],
  })
  const fila = res.rows[0]
  if (!fila) return null
  if (new Date(String(fila.expira_en)).getTime() <= Date.now()) {
    await borrarSesion(enClaro)
    return null
  }
  return obtenerUsuarioPorId(String(fila.usuario_id))
}

export async function borrarSesion(enClaro: string): Promise<void> {
  const base = await db()
  await base.execute({ sql: 'DELETE FROM sesion WHERE token = ?', args: [hashToken(enClaro)] })
}

// Hash del token para guardarlo en reposo. Con TOKEN_SECRETO es un HMAC (un robo de la base
// no basta para fabricar tokens válidos); sin él, un SHA-256 simple. El token en claro nunca
// se guarda.
function hashToken(enClaro: string): string {
  const secreto = process.env.TOKEN_SECRETO ?? 'brio-sin-secreto'
  return createHmac('sha256', secreto).update(enClaro).digest('hex')
}

// Solo para tests: cierra y olvida la conexión para poder empezar de cero.
export async function _reiniciarBaseParaTests(): Promise<void> {
  const actual = conexion
  conexion = null
  if (actual) {
    try {
      ;(await actual).close()
    } catch {
      // Si la apertura había fallado no hay nada que cerrar.
    }
  }
}
