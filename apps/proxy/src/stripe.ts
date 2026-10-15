import Stripe from 'stripe'

// Cliente de Stripe. La clave vive SOLO en el servidor (STRIPE_SECRET_KEY), nunca en la app
// ni en el repositorio. Si no hay clave, el backend responde 503 {sinPago:true} con elegancia
// y la demo sigue funcionando sin cobros. En modo pruebas se usan las claves de test (sk_test_).

let cliente: Stripe | null = null

export function hayStripe(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

// Devuelve el cliente, creándolo de forma perezosa. null si no hay clave configurada.
export function obtenerStripe(): Stripe | null {
  const clave = process.env.STRIPE_SECRET_KEY
  if (!clave) return null
  if (!cliente) cliente = new Stripe(clave)
  return cliente
}

export const MONEDA = (process.env.MONEDA ?? 'eur').toLowerCase()
export const PRECIO_CENTIMOS = Number(process.env.PRECIO_CENTIMOS ?? 499)
// Un pase de un solo pago da este número de días de premium.
export const DIAS_PASE = 30
