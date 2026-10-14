import { describe, expect, it } from 'vitest'
import { aplicarCheckIn, tendenciaPeso } from '../checkin'
import { generarPlan } from '../index'
import type { RegistroProgreso } from '../tipos'
import { perfilBase } from './_helpers'

function fecha(dia: number): string {
  return new Date(Date.UTC(2026, 0, 1 + dia)).toISOString()
}

describe('tendencia de peso', () => {
  it('descarta pesos imposibles por rango', () => {
    const hist: RegistroProgreso[] = [
      { fechaISO: fecha(0), pesoKg: 80 },
      { fechaISO: fecha(7), pesoKg: 500 }, // imposible
      { fechaISO: fecha(14), pesoKg: 80.5 },
      { fechaISO: fecha(21), pesoKg: 79.5 },
    ]
    expect(tendenciaPeso(hist).puntos).toBe(3)
  })

  it('descarta saltos diarios imposibles', () => {
    const hist: RegistroProgreso[] = [
      { fechaISO: fecha(0), pesoKg: 80 },
      { fechaISO: fecha(1), pesoKg: 130 }, // +50 kg en un día
      { fechaISO: fecha(2), pesoKg: 80.2 },
    ]
    expect(tendenciaPeso(hist).puntos).toBe(2)
  })
})

describe('ajuste del check-in', () => {
  it('con >=2 semanas corrige 100-200 kcal respetando el suelo', () => {
    const plan = generarPlan(perfilBase({ pesoKg: 80 }), 'perder_grasa')
    expect(plan.energia).toBeDefined()
    // Cuatro semanas estancado: no baja de peso aunque el objetivo es perder.
    const hist: RegistroProgreso[] = []
    for (let i = 0; i < 9; i++) hist.push({ fechaISO: fecha(i * 4), pesoKg: 80 + (i % 2 === 0 ? -0.1 : 0.1) })

    const ajuste = aplicarCheckIn(plan, hist)
    expect(ajuste.confianza).toBe('alta')
    expect(ajuste.deltaKcal).toBeLessThan(0)
    expect(Math.abs(ajuste.deltaKcal)).toBeGreaterThanOrEqual(100)
    expect(Math.abs(ajuste.deltaKcal)).toBeLessThanOrEqual(200)
    expect(ajuste.kcalNueva).toBeGreaterThanOrEqual(plan.energia!.sueloKcal)
  })

  it('con menos de 2 semanas la confianza es baja y no recorta', () => {
    const plan = generarPlan(perfilBase({ pesoKg: 80 }), 'perder_grasa')
    const hist: RegistroProgreso[] = [
      { fechaISO: fecha(0), pesoKg: 80 },
      { fechaISO: fecha(3), pesoKg: 79.9 },
      { fechaISO: fecha(6), pesoKg: 79.8 },
    ]
    const ajuste = aplicarCheckIn(plan, hist)
    expect(ajuste.confianza).toBe('baja')
    expect(ajuste.deltaKcal).toBe(0)
    expect(ajuste.kcalNueva).toBe(ajuste.kcalActual)
  })

  it('nunca recorta por debajo del suelo', () => {
    const plan = generarPlan(perfilBase({ sexo: 'mujer', pesoKg: 55, alturaCm: 162, actividad: 'sedentario' }), 'perder_grasa')
    const hist: RegistroProgreso[] = []
    for (let i = 0; i < 10; i++) hist.push({ fechaISO: fecha(i * 3), pesoKg: 55 })
    const ajuste = aplicarCheckIn(plan, hist)
    if (plan.energia) expect(ajuste.kcalNueva).toBeGreaterThanOrEqual(plan.energia.sueloKcal)
  })
})
