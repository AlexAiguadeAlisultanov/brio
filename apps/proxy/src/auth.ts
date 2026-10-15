import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { usuarioEsPremium, usuarioPorToken, type Usuario } from './db'

// Autenticación por token (sirve igual para la app móvil y para la web) y entitlement de
// premium. Las contraseñas se guardan como scrypt con sal por usuario; la comparación es en
// tiempo constante. Nunca se guarda ni se registra la contraseña en claro.

const COSTE_SCRYPT = 16384 // N: coste de CPU/memoria de scrypt (2^14), el recomendado por defecto.
const LARGO_CLAVE = 64

// Deriva la clave de forma asíncrona para no bloquear el bucle de eventos.
function derivar(password: string, sal: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, sal, LARGO_CLAVE, { N: COSTE_SCRYPT }, (err, clave) => {
      if (err) reject(err)
      else resolve(clave)
    })
  })
}

// Genera {hash, sal} en hexadecimal para una contraseña nueva.
export async function hashearPassword(password: string): Promise<{ hash: string; sal: string }> {
  const sal = randomBytes(16)
  const clave = await derivar(password, sal)
  return { hash: clave.toString('hex'), sal: sal.toString('hex') }
}

// Comprueba una contraseña contra el hash guardado, en tiempo constante.
export async function verificarPassword(password: string, hashHex: string, salHex: string): Promise<boolean> {
  const sal = Buffer.from(salHex, 'hex')
  const esperado = Buffer.from(hashHex, 'hex')
  const calculado = await derivar(password, sal)
  if (calculado.length !== esperado.length) return false
  return timingSafeEqual(calculado, esperado)
}

// Añadimos el usuario resuelto a la petición para los handlers de más abajo.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: Usuario
    }
  }
}

// Lee el token de la cabecera Authorization: Bearer <token>.
function leerToken(req: Request): string | null {
  const cabecera = req.get('authorization')
  if (!cabecera) return null
  const [tipo, valor] = cabecera.split(' ')
  if (tipo?.toLowerCase() !== 'bearer' || !valor) return null
  return valor.trim() || null
}

// Exige sesión válida: resuelve el token a un usuario o responde 401.
export function requiereAuth(req: Request, res: Response, next: NextFunction): void {
  const token = leerToken(req)
  const usuario = token ? usuarioPorToken(token) : null
  if (!usuario) {
    res.status(401).json({ error: 'no_autenticado' })
    return
  }
  req.usuario = usuario
  next()
}

// Exige premium vigente. Debe ir DESPUÉS de requiereAuth. Responde 403 {necesitaPremium:true}
// si no es premium o se le pasó la fecha.
export function requierePremium(req: Request, res: Response, next: NextFunction): void {
  const usuario = req.usuario
  if (!usuario || !usuarioEsPremium(usuario)) {
    res.status(403).json({ necesitaPremium: true })
    return
  }
  next()
}
