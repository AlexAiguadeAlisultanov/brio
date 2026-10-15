import { Router } from 'express'
import { z } from 'zod'
import { requiereAuth, hashearPassword, verificarPassword } from '../auth'
import {
  borrarSesion,
  crearSesion,
  crearUsuario,
  obtenerUsuarioPorEmail,
  usuarioEsPremium,
  type Usuario,
} from '../db'

// Cuentas y sesión por token. Registro, acceso, quién soy y salir. Las contraseñas se
// derivan con scrypt (ver auth.ts) y nunca viajan ni se registran en claro.

export const rutaCuentas = Router()

const Credenciales = z.object({
  // Normalizamos el email a minúsculas y sin espacios para que el UNIQUE sea de verdad único.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(320),
  password: z.string().min(8, 'minimo_8').max(200),
})

// Vista pública de un usuario: nunca incluye hash, sal ni ids de Stripe.
function vistaUsuario(u: Usuario): { email: string; premium: boolean; premiumHasta: string | null } {
  return { email: u.email, premium: usuarioEsPremium(u), premiumHasta: u.premium_hasta }
}

// Lee el token (en claro) de la cabecera Authorization para poder invalidarlo al salir.
function tokenDeCabecera(cabecera: string | undefined): string | null {
  if (!cabecera) return null
  const [tipo, valor] = cabecera.split(' ')
  if (tipo?.toLowerCase() !== 'bearer' || !valor) return null
  return valor.trim() || null
}

rutaCuentas.post('/api/registro', async (req, res) => {
  const parseo = Credenciales.safeParse(req.body)
  if (!parseo.success) {
    res.status(400).json({ error: 'datos_invalidos' })
    return
  }
  const { email, password } = parseo.data

  if (await obtenerUsuarioPorEmail(email)) {
    res.status(409).json({ error: 'email_en_uso' })
    return
  }

  const { hash, sal } = await hashearPassword(password)
  const usuario = await crearUsuario({ email, hash, sal })
  const token = await crearSesion(usuario.id)
  res.status(201).json({ token, usuario: vistaUsuario(usuario) })
})

rutaCuentas.post('/api/acceso', async (req, res) => {
  const parseo = Credenciales.safeParse(req.body)
  if (!parseo.success) {
    // Mensaje genérico: no revelamos ni formato ni si el email existe.
    res.status(401).json({ error: 'credenciales_invalidas' })
    return
  }
  const { email, password } = parseo.data

  const usuario = await obtenerUsuarioPorEmail(email)
  // Si el email no existe, igualmente derivamos una contraseña contra una sal falsa para no
  // dar pistas por el tiempo de respuesta, y devolvemos el mismo error genérico.
  if (!usuario) {
    await hashearPassword(password)
    res.status(401).json({ error: 'credenciales_invalidas' })
    return
  }

  const correcta = await verificarPassword(password, usuario.hash, usuario.sal)
  if (!correcta) {
    res.status(401).json({ error: 'credenciales_invalidas' })
    return
  }

  const token = await crearSesion(usuario.id)
  res.json({ token, usuario: vistaUsuario(usuario) })
})

rutaCuentas.get('/api/yo', requiereAuth, (req, res) => {
  res.json(vistaUsuario(req.usuario!))
})

rutaCuentas.post('/api/salir', requiereAuth, async (req, res) => {
  const token = tokenDeCabecera(req.get('authorization'))
  if (token) await borrarSesion(token)
  res.json({ ok: true })
})
