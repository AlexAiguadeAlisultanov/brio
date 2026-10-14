// Racha indulgente y calendario de adherencia. Función pura con "hoy" como parámetro.

import { describe, expect, it } from 'vitest'

import { calcularAdherencia } from '../adherencia'

const HOY = '2026-03-15'

// Resta días a HOY para armar los casos con fechas reales.
function dias(...n: number[]): string[] {
  const base = Date.parse(`${HOY}T00:00:00Z`)
  return n.map((d) => new Date(base - d * 86_400_000).toISOString().slice(0, 10))
}

describe('racha indulgente', () => {
  it('cuenta los días seguidos terminando hoy', () => {
    const activos = dias(0, 1, 2, 3, 4)
    const a = calcularAdherencia(activos, [], HOY)
    expect(a.rachaActual).toBe(5)
    expect(a.hoyActivo).toBe(true)
  })

  it('un hueco suelto no rompe la racha', () => {
    // Activo hoy, ayer, (hueco -2), -3, -4.
    const activos = dias(0, 1, 3, 4)
    const a = calcularAdherencia(activos, [], HOY)
    expect(a.rachaActual).toBe(4)
  })

  it('dos huecos seguidos cierran la racha', () => {
    // Activo hoy, luego dos días en blanco.
    const activos = dias(0, 3, 4)
    const a = calcularAdherencia(activos, [], HOY)
    expect(a.rachaActual).toBe(1)
  })

  it('hoy sin registrar todavía no rompe lo de ayer', () => {
    const activos = dias(1, 2, 3)
    const a = calcularAdherencia(activos, [], HOY)
    expect(a.hoyActivo).toBe(false)
    expect(a.rachaActual).toBe(3)
  })

  it('un día congelado hace de puente sin sumar ni romper', () => {
    // Activo hoy, día -1 congelado, activo -2.
    const activos = dias(0, 2)
    const congelados = dias(1)
    const a = calcularAdherencia(activos, congelados, HOY)
    expect(a.rachaActual).toBe(2)
  })
})

describe('rejilla del calendario', () => {
  it('devuelve la ventana pedida, del más antiguo al más reciente, acabando hoy', () => {
    const a = calcularAdherencia(dias(0, 1), dias(5), HOY, 10)
    expect(a.dias).toHaveLength(10)
    expect(a.dias[a.dias.length - 1]!.fechaISO).toBe(HOY)
    expect(a.dias[0]!.fechaISO < a.dias[9]!.fechaISO).toBe(true)
    expect(a.dias.find((d) => d.fechaISO === HOY)!.estado).toBe('activo')
    expect(a.dias.find((d) => d.fechaISO === dias(5)[0])!.estado).toBe('congelado')
  })
})
