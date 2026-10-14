// Peso: validación y serie suavizada, comprobadas junto al motor para que gráfico y titular
// miren los mismos datos. La tendencia del titular sale de `tendenciaPeso`; la serie es la línea.

import { describe, expect, it } from 'vitest'
import { tendenciaPeso, type RegistroProgreso } from '@brio/motor'

import { PESO_MAX_KG, PESO_MIN_KG, pesoPlausible, serieTendencia } from '../peso'

// Genera un histórico diario a partir de una lista de pesos, empezando en una fecha fija.
function historico(pesos: number[], desde = '2026-01-01'): RegistroProgreso[] {
  const base = Date.parse(`${desde}T00:00:00Z`)
  return pesos.map((pesoKg, i) => ({ fechaISO: new Date(base + i * 86_400_000).toISOString().slice(0, 10), pesoKg }))
}

describe('validación de peso', () => {
  it('acepta pesos fisiológicos y rechaza lo imposible', () => {
    expect(pesoPlausible(80)).toBe(true)
    expect(pesoPlausible(PESO_MIN_KG)).toBe(true)
    expect(pesoPlausible(PESO_MAX_KG)).toBe(true)
    expect(pesoPlausible(0)).toBe(false)
    expect(pesoPlausible(5)).toBe(false)
    expect(pesoPlausible(999)).toBe(false)
    expect(pesoPlausible(Number.NaN)).toBe(false)
  })
})

describe('serie de tendencia suavizada', () => {
  it('baja cuando el peso baja, y coincide con el signo del ritmo del motor', () => {
    // Doce semanas perdiendo peso poco a poco, con algo de ruido diario.
    const pesos = Array.from({ length: 84 }, (_, i) => 85 - i * 0.07 + (i % 2 === 0 ? 0.3 : -0.3))
    const hist = historico(pesos)

    const serie = serieTendencia(hist)
    expect(serie.length).toBe(hist.length)
    expect(serie[serie.length - 1]!.pesoKg).toBeLessThan(serie[0]!.pesoKg)

    const tend = tendenciaPeso(hist)
    expect(tend.valido).toBe(true)
    expect(tend.ritmoKgSemana).toBeLessThan(0)
  })

  it('suaviza: la serie oscila menos que los pesos sueltos', () => {
    // Peso estable con mucho ruido diario arriba y abajo.
    const pesos = Array.from({ length: 30 }, (_, i) => 80 + (i % 2 === 0 ? 1.5 : -1.5))
    const hist = historico(pesos)
    const serie = serieTendencia(hist)

    const rango = (xs: number[]) => Math.max(...xs) - Math.min(...xs)
    const rangoCrudo = rango(pesos)
    const rangoSerie = rango(serie.map((p) => p.pesoKg))
    expect(rangoSerie).toBeLessThan(rangoCrudo)
  })

  it('descarta un peso imposible, igual que el motor lo deja fuera de la tendencia', () => {
    const hist = historico([80, 80.2, 999, 79.8, 79.6])
    const serie = serieTendencia(hist)
    // El 999 no aparece como punto de la serie.
    expect(serie.some((p) => p.pesoKg > PESO_MAX_KG)).toBe(false)
    // Y el motor tampoco lo cuenta: la tendencia es válida con el resto.
    expect(tendenciaPeso(hist).valido).toBe(true)
  })

  it('con un solo peso no hay línea de tendencia aún', () => {
    expect(serieTendencia(historico([80]))).toHaveLength(1)
    expect(serieTendencia([])).toHaveLength(0)
  })
})
