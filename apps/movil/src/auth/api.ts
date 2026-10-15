import { urlApi } from '../llm/cliente'
import { ErrorApi } from './errores'

// Cliente de cuentas y pago contra el backend. Envía el token en la cabecera Authorization.
// Nunca guarda la contraseña; solo maneja el token que devuelve el servidor.

export interface Usuario {
  email: string
  premium: boolean
  premiumHasta: string | null
}

export { ErrorApi }

const TIMEOUT_MS = 10000

async function pedir<T>(ruta: string, opciones: { metodo?: string; token?: string; cuerpo?: unknown } = {}): Promise<T> {
  const base = urlApi()
  if (!base) throw new ErrorApi('sin_servidor', 0)
  const control = new AbortController()
  const t = setTimeout(() => control.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${base}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {}),
      },
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
      signal: control.signal,
    })
    const texto = await res.text()
    const json = texto ? (JSON.parse(texto) as Record<string, unknown>) : {}
    if (!res.ok) {
      throw new ErrorApi((json.error as string) ?? (json.motivo as string) ?? 'error', res.status)
    }
    return json as T
  } catch (e) {
    if (e instanceof ErrorApi) throw e
    throw new ErrorApi('sin_conexion', 0)
  } finally {
    clearTimeout(t)
  }
}

export function registrar(email: string, password: string): Promise<{ token: string; usuario: Usuario }> {
  return pedir('/api/registro', { metodo: 'POST', cuerpo: { email, password } })
}

export function acceder(email: string, password: string): Promise<{ token: string; usuario: Usuario }> {
  return pedir('/api/acceso', { metodo: 'POST', cuerpo: { email, password } })
}

export function yo(token: string): Promise<Usuario> {
  return pedir('/api/yo', { token })
}

export function salir(token: string): Promise<unknown> {
  return pedir('/api/salir', { metodo: 'POST', token })
}

// Pide una sesión de pago. Devuelve la URL de Stripe Checkout, o null si el pago no está
// configurado en el servidor (la app lo trata como "premium no disponible ahora mismo").
export async function crearCheckout(token: string, modo: 'suscripcion' | 'pase'): Promise<string | null> {
  try {
    const r = await pedir<{ url?: string }>('/api/pago/checkout', { metodo: 'POST', token, cuerpo: { modo } })
    return r.url ?? null
  } catch (e) {
    if (e instanceof ErrorApi && e.estado === 503) return null // sinPago
    throw e
  }
}
