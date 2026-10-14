import { describe, expect, it } from 'vitest'
import { construirComidas, porcentajesPorComida } from '../comidas'
import { alimentoPorId } from '../datos/alimentos'
import type { Macros } from '../tipos'
import { perfilBase } from './_helpers'

const TOTAL: Macros = { kcal: 2400, proteinaG: 180, grasaG: 70, carbosG: 250, fibraG: 34 }

describe('porcentajes por comida', () => {
  it('suman 100 para 3..6 huecos', () => {
    for (let n = 3; n <= 6; n++) {
      const pct = porcentajesPorComida(n)
      expect(pct).toHaveLength(n)
      expect(pct.reduce((a, b) => a + b, 0)).toBe(100)
    }
  })
  it('valores conocidos para 3 y 4', () => {
    expect(porcentajesPorComida(3)).toEqual([30, 40, 30])
    expect(porcentajesPorComida(4)).toEqual([25, 35, 25, 15])
  })
})

describe('reparto de macros', () => {
  it('la suma de los huecos reconstruye el total', () => {
    for (let n = 3; n <= 6; n++) {
      const perfil = perfilBase({ comidasPorDia: n })
      const comidas = construirComidas(perfil, TOTAL)
      const suma = comidas.reduce(
        (acc, c) => ({
          kcal: acc.kcal + c.objetivo.kcal,
          proteinaG: acc.proteinaG + c.objetivo.proteinaG,
          grasaG: acc.grasaG + c.objetivo.grasaG,
          carbosG: acc.carbosG + c.objetivo.carbosG,
          fibraG: acc.fibraG + c.objetivo.fibraG,
        }),
        { kcal: 0, proteinaG: 0, grasaG: 0, carbosG: 0, fibraG: 0 },
      )
      expect(suma).toEqual(TOTAL)
    }
  })
})

describe('cada hueco respeta dieta y exclusiones', () => {
  it('vegano con alergia a frutos secos y soja: todos los alimentos son válidos', () => {
    const perfil = perfilBase({
      patronDietetico: ['vegano', 'sin_gluten'],
      alergias: ['frutos_secos'],
      intolerancias: ['soja'],
    })
    const comidas = construirComidas(perfil, TOTAL)
    const excluidos = [...perfil.alergias, ...perfil.intolerancias]
    for (const c of comidas) {
      for (const item of c.alimentos) {
        const al = alimentoPorId(item.id)!
        expect(al).toBeDefined()
        // Cumple todas las dietas declaradas.
        for (const d of perfil.patronDietetico) expect(al.dietas).toContain(d)
        // Sin alérgenos excluidos.
        for (const a of al.alergenos) expect(excluidos).not.toContain(a)
      }
    }
  })
})
