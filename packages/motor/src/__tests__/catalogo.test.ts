import { describe, expect, it } from 'vitest'
import { ALIMENTOS, alimentoPorId } from '../datos/alimentos'
import { EJERCICIOS } from '../datos/ejercicios'
import { alimentosValidos, sustituirComidaDeterminista } from '../sustitucion'
import type { PatronDietetico, Rango, SobreComida } from '../tipos'
import { ALERGENOS, DIETAS, mulberry32, subconjunto } from './_helpers'

describe('sanidad del catálogo', () => {
  it('ids únicos y volumen razonable', () => {
    const idsAl = new Set(ALIMENTOS.map((a) => a.id))
    expect(idsAl.size).toBe(ALIMENTOS.length)
    expect(ALIMENTOS.length).toBeGreaterThanOrEqual(50)
    const idsEj = new Set(EJERCICIOS.map((e) => e.id))
    expect(idsEj.size).toBe(EJERCICIOS.length)
    expect(EJERCICIOS.length).toBeGreaterThanOrEqual(50)
  })

  it('nombres en los tres idiomas', () => {
    for (const a of ALIMENTOS) {
      expect(a.nombre.es.length).toBeGreaterThan(0)
      expect(a.nombre.ca.length).toBeGreaterThan(0)
      expect(a.nombre.en.length).toBeGreaterThan(0)
    }
  })

  it('hay proteína vegana sin gluten viable', () => {
    const veganos = alimentosValidos([], ['vegano', 'sin_gluten'], [])
    expect(veganos.some((a) => a.categoria === 'proteina' && a.proteinaG >= 8)).toBe(true)
  })

  it('cubre todos los patrones de ejercicio', () => {
    const patrones = new Set(EJERCICIOS.map((e) => e.patron))
    for (const p of ['sentadilla', 'bisagra', 'empuje_horizontal', 'traccion_horizontal', 'empuje_vertical', 'traccion_vertical', 'core', 'aislado']) {
      expect(patrones.has(p as never)).toBe(true)
    }
  })
})

function banda(v: number, f: number, anchoMin: number): Rango {
  const min = Math.max(0, Math.round(v * (1 - f)))
  return { min, max: Math.max(Math.round(v * (1 + f)), min + anchoMin) }
}

describe('fuzz adversarial de exclusiones', () => {
  it('o hay candidato válido o el estado vacío: nunca una violación', () => {
    const rng = mulberry32(0xbeef1234)
    for (let i = 0; i < 2000; i++) {
      // Combinaciones duras: varias alergias/intolerancias + dieta + algunos noGusta.
      const excluidos = subconjunto(rng, ALERGENOS, 0.3)
      const dietaBruta = subconjunto(rng, DIETAS, 0.35)
      const dieta: PatronDietetico[] = dietaBruta.length > 0 ? dietaBruta : ['omnivoro']
      const noGusta = subconjunto(rng, ALIMENTOS.map((a) => a.id), 0.2)

      const candidatos = alimentosValidos(excluidos, dieta, noGusta).map((a) => a.id)
      const sobre: SobreComida = {
        id: `c${i}`,
        tipo: 'comida',
        momento: 'comida',
        kcal: banda(500, 0.08, 20),
        proteinaG: banda(35, 0.2, 5),
        carbosG: banda(55, 0.3, 10),
        grasaG: banda(15, 0.35, 5),
        excluidos,
        dieta,
        noGustaIds: noGusta,
        locale: 'es',
        candidatos,
      }
      const res = sustituirComidaDeterminista(sobre)

      // El estado vacío aparece exactamente cuando no queda NINGÚN alimento duro-válido
      // (los noGusta se recuperan como último recurso, no cuentan como vacío).
      const durosValidos = alimentosValidos(excluidos, dieta, [])
      expect(res.vacio).toBe(durosValidos.length === 0)

      // Pase lo que pase, nunca un item prohibido.
      for (const item of res.items) {
        const al = alimentoPorId(item.id)!
        for (const a of al.alergenos) expect(excluidos).not.toContain(a)
        for (const d of dieta) expect(al.dietas).toContain(d)
      }
    }
  })
})
