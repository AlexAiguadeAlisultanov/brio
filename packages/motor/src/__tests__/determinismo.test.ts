import { describe, expect, it } from 'vitest'
import { generarPlan } from '../index'
import { elegir, mulberry32, OBJETIVOS, perfilAleatorio } from './_helpers'

// Hash estable y determinista del plan: misma entrada, misma salida byte a byte.
function hash(obj: unknown): string {
  const json = JSON.stringify(obj)
  let h = 0
  for (let i = 0; i < json.length; i++) {
    h = (Math.imul(31, h) + json.charCodeAt(i)) | 0
  }
  return `${h}:${json.length}`
}

describe('determinismo', () => {
  it('la misma entrada produce la misma salida', () => {
    const rng = mulberry32(0xdecaf)
    for (let i = 0; i < 500; i++) {
      const perfil = perfilAleatorio(rng)
      const objetivo = elegir(rng, OBJETIVOS)
      const ctx = { ahoraISO: '2026-02-02T10:00:00.000Z' }
      const a = generarPlan(perfil, objetivo, ctx)
      const b = generarPlan(perfil, objetivo, ctx)
      expect(JSON.stringify(a)).toBe(JSON.stringify(b))
      expect(hash(a)).toBe(hash(b))
    }
  })

  it('no depende del reloj: sin ctx también es estable', () => {
    const perfil = perfilAleatorio(mulberry32(7))
    const a = generarPlan(perfil, 'ganar_musculo')
    const b = generarPlan(perfil, 'ganar_musculo')
    expect(hash(a)).toBe(hash(b))
  })
})
