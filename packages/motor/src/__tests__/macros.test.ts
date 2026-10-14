import { describe, expect, it } from 'vitest'
import { baseProteina, calcularMacros, cuadra, fibraObjetivo } from '../macros'
import { energiaBase, limitarKcal } from '../seguridad'
import { perfilBase } from './_helpers'

describe('fibra', () => {
  it('14 g por 1000 kcal', () => {
    expect(fibraObjetivo(2000)).toBe(28)
    expect(fibraObjetivo(1500)).toBe(21)
  })
})

describe('cuadre energético', () => {
  it('cuadra dentro del ±2% en un plan normal', () => {
    const perfil = perfilBase({ grasaPct: 18 })
    const eb = energiaBase(perfil)
    const lim = limitarKcal(perfil, 'ganar_musculo', eb)
    const m = calcularMacros(perfil, lim.kcal, 'ganar_musculo')
    expect(cuadra(m, 0.02)).toBe(true)
  })

  it('carbohidratos nunca negativos', () => {
    const perfil = perfilBase({ pesoKg: 100, grasaPct: 30 })
    const m = calcularMacros(perfil, 900, 'perder_grasa')
    expect(m.carbosG).toBeGreaterThanOrEqual(0)
  })
})

describe('suelo de grasa en corte agresivo', () => {
  it('mantiene el suelo de grasa y recorta carbos', () => {
    const perfil = perfilBase({ pesoKg: 100, grasaPct: 30 })
    // kcal artificialmente bajo para forzar el recorte de carbos.
    const m = calcularMacros(perfil, 900, 'perder_grasa')
    const grasaMin = 0.5 * perfil.pesoKg
    expect(m.grasaG).toBeGreaterThanOrEqual(Math.round(grasaMin) - 1)
    expect(m.carbosG).toBe(0)
  })
})

describe('caso obeso: clamp sobre masa magra', () => {
  it('la proteína sale razonable al calcularse sobre la masa magra', () => {
    const perfil = perfilBase({ sexo: 'hombre', pesoKg: 120, grasaPct: 35 })
    const { base, usaMasaMagra } = baseProteina(perfil)
    expect(usaMasaMagra).toBe(true)
    // base = 120 * (1 - 0.35) = 78
    expect(base).toBeCloseTo(78, 5)
    const eb = energiaBase(perfil)
    const lim = limitarKcal(perfil, 'perder_grasa', eb)
    const m = calcularMacros(perfil, lim.kcal, 'perder_grasa')
    // Sobre masa magra (~172 g), no sobre peso corporal (que daría ~264 g).
    expect(m.proteinaG).toBeLessThan(2.2 * 120)
    expect(m.proteinaG).toBeGreaterThan(1.2 * base - 1)
    expect(m.proteinaG).toBeLessThanOrEqual(3.1 * base + 1)
  })
})

describe('tope de proteína por patología', () => {
  it('no supera 1.2 g/kg de la base con enfermedad renal/hepática', () => {
    const perfil = perfilBase({ pesoKg: 80 })
    const { base } = baseProteina(perfil)
    const m = calcularMacros(perfil, 2200, 'ganar_musculo', 1.2)
    expect(m.proteinaG).toBeLessThanOrEqual(Math.round(1.2 * base) + 1)
  })
})
