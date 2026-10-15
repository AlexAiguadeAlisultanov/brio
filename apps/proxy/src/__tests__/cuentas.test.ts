import { beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

process.env.DB_PATH = ':memory:'
process.env.TOKEN_SECRETO = 'secreto-de-prueba'
process.env.LIMITE_API = '100000'
process.env.LIMITE_AUTH = '100000'

// No necesitamos el LLM ni el circuito reales aquí.
vi.mock('../anthropic', () => ({
  hayClave: vi.fn(() => false),
  elegirConLlm: vi.fn(async () => null),
  MODELO_LLM: 'modelo-de-prueba',
  MOTIVOS: [],
}))
vi.mock('../circuito', () => ({
  hayCupo: vi.fn(() => true),
  registrarLlamada: vi.fn(),
  estadoCircuito: vi.fn(() => ({ usadas: 0, tope: 500, abierto: false })),
}))

import { crearApp } from '../app'

const app = crearApp()
const creds = { email: 'Ana@Brio.Test', password: 'contrasena-larga' }

describe('registro y acceso', () => {
  let token = ''

  it('registro crea la cuenta y devuelve token + usuario', async () => {
    const res = await request(app).post('/api/registro').send(creds)
    expect(res.status).toBe(201)
    expect(typeof res.body.token).toBe('string')
    // El email se normaliza a minúsculas.
    expect(res.body.usuario.email).toBe('ana@brio.test')
    expect(res.body.usuario.premium).toBe(false)
    expect(res.body.usuario.premiumHasta).toBeNull()
    token = res.body.token
  })

  it('registro rechaza password corta', async () => {
    const res = await request(app).post('/api/registro').send({ email: 'otro@brio.test', password: 'corta' })
    expect(res.status).toBe(400)
  })

  it('registro con email ya usado responde 409', async () => {
    const res = await request(app).post('/api/registro').send(creds)
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('email_en_uso')
  })

  it('acceso correcto devuelve token', async () => {
    const res = await request(app).post('/api/acceso').send(creds)
    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.usuario.email).toBe('ana@brio.test')
  })

  it('acceso con password mala da 401 con mensaje genérico', async () => {
    const res = await request(app).post('/api/acceso').send({ email: creds.email, password: 'otra-cosa-mala' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('credenciales_invalidas')
  })

  it('acceso con email inexistente da el MISMO 401 genérico (no revela si existe)', async () => {
    const res = await request(app).post('/api/acceso').send({ email: 'nadie@brio.test', password: 'contrasena-larga' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('credenciales_invalidas')
  })

  it('/api/yo con token devuelve el usuario', async () => {
    const res = await request(app).get('/api/yo').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('ana@brio.test')
    expect(res.body.premium).toBe(false)
  })

  it('/api/yo sin token da 401', async () => {
    const res = await request(app).get('/api/yo')
    expect(res.status).toBe(401)
  })

  it('/api/yo con token basura da 401', async () => {
    const res = await request(app).get('/api/yo').set('Authorization', 'Bearer no-existe')
    expect(res.status).toBe(401)
  })

  it('salir invalida el token', async () => {
    const salida = await request(app).post('/api/salir').set('Authorization', `Bearer ${token}`)
    expect(salida.status).toBe(200)
    const despues = await request(app).get('/api/yo').set('Authorization', `Bearer ${token}`)
    expect(despues.status).toBe(401)
  })
})
