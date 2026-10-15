import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// Base en memoria y límites altos para que el rate-limit no estorbe en los tests.
process.env.DB_PATH = ':memory:'
process.env.TOKEN_SECRETO = 'secreto-de-prueba'
process.env.LIMITE_API = '100000'
process.env.LIMITE_AUTH = '100000'

// Mockeamos el cliente del LLM y el circuito: los tests no tocan la red ni necesitan clave.
vi.mock('../anthropic', () => ({
  hayClave: vi.fn(() => true),
  elegirConLlm: vi.fn(async () => null),
  MODELO_LLM: 'modelo-de-prueba',
  MOTIVOS: ['equivalente', 'mas_ligero', 'mas_proteina', 'variedad', 'preferencia', 'sin_material', 'evita_lesion'],
}))
vi.mock('../circuito', () => ({
  hayCupo: vi.fn(() => true),
  registrarLlamada: vi.fn(),
  estadoCircuito: vi.fn(() => ({ usadas: 0, tope: 500, abierto: false })),
}))

import { alimentosValidos } from '@brio/motor'
import { crearApp } from '../app'
import { elegirConLlm, hayClave } from '../anthropic'
import { hayCupo } from '../circuito'
import { crearSesion, crearUsuario, fijarPremium } from '../db'

const app = crearApp()

// Crea un usuario (opcionalmente premium) directamente en la base y devuelve su token.
function tokenDe(premium: boolean, email = `u${Math.random()}@brio.test`): string {
  const usuario = crearUsuario({ email, hash: 'x'.repeat(128), sal: 'ab' })
  if (premium) fijarPremium(usuario.id, true, null)
  return crearSesion(usuario.id)
}

// Un candidato real del catálogo, con suficiente densidad para que escale dentro de rango.
const candidato =
  alimentosValidos([], ['omnivoro'], []).find((a) => a.categoria === 'carbohidrato' || a.categoria === 'proteina') ??
  alimentosValidos([], ['omnivoro'], [])[0]!

function sobreComida(candidatos: string[]) {
  return {
    id: 'comida_prueba',
    tipo: 'comida' as const,
    momento: 'comida',
    kcal: { min: 100, max: 1200 },
    proteinaG: { min: 0, max: 150 },
    carbosG: { min: 0, max: 250 },
    grasaG: { min: 0, max: 150 },
    excluidos: [],
    dieta: ['omnivoro'],
    noGustaIds: [],
    locale: 'es',
    candidatos,
  }
}

let tokenPremium: string

beforeEach(() => {
  vi.mocked(hayClave).mockReturnValue(true)
  vi.mocked(hayCupo).mockReturnValue(true)
  vi.mocked(elegirConLlm).mockResolvedValue(null)
  tokenPremium = tokenDe(true)
})

function pedirAdaptar(token: string | null, cuerpo: unknown) {
  const r = request(app).post('/api/adaptar')
  if (token) r.set('Authorization', `Bearer ${token}`)
  return r.send(cuerpo as object)
}

describe('GET /api/salud', () => {
  it('dice si hay clave y el estado del circuito', async () => {
    const res = await request(app).get('/api/salud')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.llm).toBe(true)
    expect(res.body).toHaveProperty('pago')
  })

  it('refleja que no hay clave', async () => {
    vi.mocked(hayClave).mockReturnValue(false)
    const res = await request(app).get('/api/salud')
    expect(res.body.llm).toBe(false)
    expect(res.body.modelo).toBeNull()
  })
})

describe('POST /api/adaptar (protegida)', () => {
  it('sin token responde 401', async () => {
    const res = await pedirAdaptar(null, { sobre: sobreComida([candidato.id]) })
    expect(res.status).toBe(401)
    expect(elegirConLlm).not.toHaveBeenCalled()
  })

  it('con sesión pero sin premium responde 403 {necesitaPremium:true}', async () => {
    const res = await pedirAdaptar(tokenDe(false), { sobre: sobreComida([candidato.id]) })
    expect(res.status).toBe(403)
    expect(res.body.necesitaPremium).toBe(true)
    expect(elegirConLlm).not.toHaveBeenCalled()
  })

  it('premium: rechaza un cuerpo mal formado antes de tocar el SDK', async () => {
    const res = await pedirAdaptar(tokenPremium, { cualquier: 'cosa' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('cuerpo_invalido')
    expect(elegirConLlm).not.toHaveBeenCalled()
  })

  it('premium sin clave responde 503 y pide usar el respaldo local', async () => {
    vi.mocked(hayClave).mockReturnValue(false)
    const res = await pedirAdaptar(tokenPremium, { sobre: sobreComida([candidato.id]) })
    expect(res.status).toBe(503)
    expect(res.body.fallback).toBe(true)
    expect(res.body.motivo).toBe('sin_clave')
  })

  it('premium sin cupo diario responde 503 fallback', async () => {
    vi.mocked(hayCupo).mockReturnValue(false)
    const res = await pedirAdaptar(tokenPremium, { sobre: sobreComida([candidato.id]) })
    expect(res.status).toBe(503)
    expect(res.body.motivo).toBe('sin_cupo')
  })

  it('premium: si el LLM no elige, responde 422 fallback', async () => {
    vi.mocked(elegirConLlm).mockResolvedValue(null)
    const res = await pedirAdaptar(tokenPremium, { sobre: sobreComida([candidato.id]) })
    expect(res.status).toBe(422)
    expect(res.body.motivo).toBe('sin_eleccion')
  })

  it('premium, camino feliz: el motor valida la elección del LLM y responde la sustitución', async () => {
    vi.mocked(elegirConLlm).mockResolvedValue({ eleccionId: candidato.id, motivoId: 'equivalente' })
    const res = await pedirAdaptar(tokenPremium, { sobre: sobreComida([candidato.id]) })
    expect(res.status).toBe(200)
    expect(res.body.fuente).toBe('llm')
    expect(res.body.sustitucion.vacio).toBe(false)
    expect(res.body.sustitucion.items.length).toBeGreaterThan(0)
  })
})
