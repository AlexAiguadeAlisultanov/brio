import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

process.env.DB_PATH = ':memory:'
process.env.TOKEN_SECRETO = 'secreto-de-prueba'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_prueba'
process.env.LIMITE_API = '100000'
process.env.LIMITE_AUTH = '100000'

// Stripe entero mockeado: ni la red ni claves reales. fakeStripe se declara con vi.hoisted
// para poder referenciarlo dentro del factory de vi.mock (que se eleva al principio).
const { fakeStripe } = vi.hoisted(() => ({
  fakeStripe: {
    customers: { create: vi.fn(async () => ({ id: 'cus_test' })) },
    checkout: { sessions: { create: vi.fn(async (_params: Record<string, unknown>) => ({ url: 'https://stripe.test/checkout' })) } },
    webhooks: { constructEvent: vi.fn() },
  },
}))

vi.mock('../stripe', () => ({
  hayStripe: vi.fn(() => true),
  obtenerStripe: vi.fn(() => fakeStripe),
  MONEDA: 'eur',
  PRECIO_CENTIMOS: 499,
  DIAS_PASE: 30,
}))
vi.mock('../anthropic', () => ({
  hayClave: vi.fn(() => false),
  elegirConLlm: vi.fn(async () => null),
  MODELO_LLM: 'm',
  MOTIVOS: [],
}))
vi.mock('../circuito', () => ({
  hayCupo: vi.fn(() => true),
  registrarLlamada: vi.fn(),
  estadoCircuito: vi.fn(() => ({ usadas: 0, tope: 500, abierto: false })),
}))

import { crearApp } from '../app'
import { hayStripe, obtenerStripe } from '../stripe'
import { crearSesion, crearUsuario, obtenerUsuarioPorId, usuarioEsPremium } from '../db'

const app = crearApp()

async function usuarioConToken(): Promise<{ id: string; token: string }> {
  const u = await crearUsuario({ email: `p${Math.random()}@brio.test`, hash: 'x'.repeat(128), sal: 'ab' })
  return { id: u.id, token: await crearSesion(u.id) }
}

beforeEach(() => {
  vi.mocked(hayStripe).mockReturnValue(true)
  vi.mocked(obtenerStripe).mockReturnValue(fakeStripe as never)
  fakeStripe.checkout.sessions.create.mockClear()
  fakeStripe.customers.create.mockClear()
})

describe('POST /api/pago/checkout', () => {
  it('sin token da 401', async () => {
    const res = await request(app).post('/api/pago/checkout').send({ modo: 'suscripcion' })
    expect(res.status).toBe(401)
  })

  it('sin STRIPE_SECRET_KEY responde 503 {sinPago:true}', async () => {
    vi.mocked(hayStripe).mockReturnValue(false)
    vi.mocked(obtenerStripe).mockReturnValue(null)
    const { token } = await usuarioConToken()
    const res = await request(app)
      .post('/api/pago/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ modo: 'suscripcion' })
    expect(res.status).toBe(503)
    expect(res.body.sinPago).toBe(true)
  })

  it('modo inválido da 400', async () => {
    const { token } = await usuarioConToken()
    const res = await request(app)
      .post('/api/pago/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ modo: 'regalo' })
    expect(res.status).toBe(400)
  })

  it('suscripción crea sesión con tarjeta y devuelve url', async () => {
    const { token } = await usuarioConToken()
    const res = await request(app)
      .post('/api/pago/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ modo: 'suscripcion' })
    expect(res.status).toBe(200)
    expect(res.body.url).toBe('https://stripe.test/checkout')
    const params = fakeStripe.checkout.sessions.create.mock.calls[0]![0]
    expect(params.mode).toBe('subscription')
    // Los métodos de pago los gestiona el Dashboard de Stripe: no se pasa payment_method_types.
    expect(params.payment_method_types).toBeUndefined()
  })

  it('pase crea sesión de pago único con tarjeta y bizum', async () => {
    const { token } = await usuarioConToken()
    const res = await request(app)
      .post('/api/pago/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ modo: 'pase' })
    expect(res.status).toBe(200)
    const params = fakeStripe.checkout.sessions.create.mock.calls[0]![0]
    expect(params.mode).toBe('payment')
    // Bizum se ofrece automáticamente si está activado en el Dashboard; no se fija aquí.
    expect(params.payment_method_types).toBeUndefined()
  })
})

describe('POST /api/pago/webhook', () => {
  it('firma inválida da 400', async () => {
    fakeStripe.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('firma mala')
    })
    const res = await request(app)
      .post('/api/pago/webhook')
      .set('stripe-signature', 'mala')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'))
    expect(res.status).toBe(400)
  })

  it('checkout.session.completed de un pase da premium 30 días', async () => {
    const { id } = await usuarioConToken()
    fakeStripe.webhooks.constructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'payment',
          payment_status: 'paid',
          customer: 'cus_pase',
          subscription: null,
          metadata: { usuarioId: id, modo: 'pase' },
        },
      },
    } as never)
    const res = await request(app)
      .post('/api/pago/webhook')
      .set('stripe-signature', 'buena')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'))
    expect(res.status).toBe(200)
    expect(res.body.recibido).toBe(true)
    const u = (await obtenerUsuarioPorId(id))!
    expect(usuarioEsPremium(u)).toBe(true)
    expect(u.premium_hasta).not.toBeNull()
  })

  it('subscription.deleted quita el premium', async () => {
    const { id } = await usuarioConToken()
    // Primero lo ponemos premium con una suscripción activa.
    fakeStripe.webhooks.constructEvent.mockReturnValueOnce({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', status: 'active', customer: 'cus_sub', current_period_end: Math.floor(Date.now() / 1000) + 3600, metadata: { usuarioId: id } } },
    } as never)
    await request(app).post('/api/pago/webhook').set('stripe-signature', 'ok').set('Content-Type', 'application/json').send(Buffer.from('{}'))
    expect(usuarioEsPremium((await obtenerUsuarioPorId(id))!)).toBe(true)

    // Ahora la borramos.
    fakeStripe.webhooks.constructEvent.mockReturnValueOnce({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1', status: 'canceled', customer: 'cus_sub', metadata: { usuarioId: id } } },
    } as never)
    await request(app).post('/api/pago/webhook').set('stripe-signature', 'ok').set('Content-Type', 'application/json').send(Buffer.from('{}'))
    expect(usuarioEsPremium((await obtenerUsuarioPorId(id))!)).toBe(false)
  })

  it('sin STRIPE_WEBHOOK_SECRET o sin stripe responde 503', async () => {
    vi.mocked(obtenerStripe).mockReturnValue(null)
    const res = await request(app)
      .post('/api/pago/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'))
    expect(res.status).toBe(503)
  })
})
