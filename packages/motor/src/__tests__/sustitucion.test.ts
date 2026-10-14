import { describe, expect, it } from 'vitest'
import { alimentoPorId } from '../datos/alimentos'
import { ejercicioPorId, EJERCICIOS } from '../datos/ejercicios'
import {
  alimentosValidos,
  sustituirComidaDeterminista,
  sustituirEjercicioDeterminista,
  validarSustitucionComida,
  validarSustitucionEjercicio,
} from '../sustitucion'
import type { Equipo, ModalidadRiesgo, Rango, SobreComida, SobreEjercicio, Zona } from '../tipos'
import { ALERGENOS, DIETAS, elegir, EQUIPOS, entero, mulberry32, subconjunto, ZONAS } from './_helpers'

function banda(v: number, f: number, anchoMin: number): Rango {
  const min = Math.max(0, Math.round(v * (1 - f)))
  const max = Math.max(Math.round(v * (1 + f)), min + anchoMin)
  return { min, max }
}

function dentro(v: number, r: Rango): boolean {
  return v >= r.min && v <= r.max
}

function sobreComidaAleatorio(rng: () => number, id: number): SobreComida {
  const excluidos = subconjunto(rng, ALERGENOS, 0.15)
  const dietaBruta = subconjunto(rng, DIETAS, 0.2)
  const dieta = dietaBruta.length > 0 ? dietaBruta : (['omnivoro'] as const).slice()
  const validos = alimentosValidos(excluidos, dieta, [])
  return {
    id: `s${id}`,
    tipo: 'comida',
    momento: 'comida',
    kcal: banda(entero(rng, 300, 900), 0.08, 20),
    proteinaG: banda(entero(rng, 15, 60), 0.2, 5),
    carbosG: banda(entero(rng, 20, 100), 0.3, 10),
    grasaG: banda(entero(rng, 5, 30), 0.35, 5),
    excluidos,
    dieta,
    noGustaIds: [],
    locale: 'es',
    candidatos: validos.map((a) => a.id),
  }
}

describe('propiedad: la sustitución de comida nunca viola exclusiones duras', () => {
  it('2500 combinaciones aleatorias con semilla fija', () => {
    const rng = mulberry32(0x1234abcd)
    for (let i = 0; i < 2500; i++) {
      const sobre = sobreComidaAleatorio(rng, i)
      const res = sustituirComidaDeterminista(sobre)

      if (res.vacio) {
        expect(res.items).toHaveLength(0)
        expect(res.mensajeId).toBe('sin_candidatos')
        continue
      }

      // Ninguna salida contiene jamás un item que viole una exclusión dura.
      for (const item of res.items) {
        const al = alimentoPorId(item.id)!
        expect(al).toBeDefined()
        for (const a of al.alergenos) expect(sobre.excluidos).not.toContain(a)
        for (const d of sobre.dieta) expect(al.dietas).toContain(d)
      }

      // O está dentro de rango (kcal ±8% y los tres macros), o está marcado como aproximado.
      const enRango =
        dentro(res.macros.kcal, sobre.kcal) &&
        dentro(res.macros.proteinaG, sobre.proteinaG) &&
        dentro(res.macros.carbosG, sobre.carbosG) &&
        dentro(res.macros.grasaG, sobre.grasaG)
      if (!res.aproximado) {
        expect(enRango, `caso ${i} debería estar en rango`).toBe(true)
      } else {
        expect(res.delta).toBeDefined()
      }
    }
  })
})

describe('estado de conjunto vacío', () => {
  it('sin candidatos válidos mantiene el hueco y deriva', () => {
    // Dieta vegana con un candidato cárnico: tras el filtro duro no queda nada.
    const sobre: SobreComida = {
      id: 'vacio',
      tipo: 'comida',
      momento: 'comida',
      kcal: { min: 300, max: 400 },
      proteinaG: { min: 20, max: 40 },
      carbosG: { min: 20, max: 60 },
      grasaG: { min: 5, max: 20 },
      excluidos: [],
      dieta: ['vegano'],
      noGustaIds: [],
      locale: 'es',
      candidatos: ['pechuga_pollo', 'salmon'],
    }
    const res = sustituirComidaDeterminista(sobre)
    expect(res.vacio).toBe(true)
    expect(res.derivar).toBe(true)
    expect(res.items).toHaveLength(0)
  })
})

function sobreEjercicioAleatorio(rng: () => number): SobreEjercicio {
  const equipoDisponible = (() => {
    const e = subconjunto(rng, EQUIPOS, 0.5)
    return e.length > 0 ? e : (['peso_corporal'] as Equipo[])
  })()
  const contraindicados = subconjunto(rng, ZONAS, 0.2) as Zona[]
  const modalidadesVetadas = subconjunto(rng, ['carga_axial', 'valsalva', 'isometrico_intenso', 'supino', 'impacto'] as const, 0.2) as ModalidadRiesgo[]
  const grupo = elegir(rng, ['pecho', 'espalda', 'cuadriceps', 'hombro', 'biceps', 'triceps'] as const)
  const candidatos = EJERCICIOS.filter((e) => e.grupo === grupo).map((e) => e.id)
  return {
    id: 'se',
    tipo: 'ejercicio',
    grupo,
    patron: 'empuje_horizontal',
    series: { min: 2, max: 4 },
    reps: { min: 6, max: 12 },
    rir: { min: 1, max: 3 },
    equipoDisponible,
    contraindicados,
    modalidadesVetadas,
    locale: 'es',
    candidatos,
  }
}

describe('propiedad: la sustitución de ejercicio nunca viola exclusiones duras', () => {
  it('1500 combinaciones aleatorias con semilla fija', () => {
    const rng = mulberry32(0x55aa00ff)
    for (let i = 0; i < 1500; i++) {
      const sobre = sobreEjercicioAleatorio(rng)
      const res = sustituirEjercicioDeterminista(sobre)
      if (res.vacio) {
        expect(res.ejercicioId).toBeUndefined()
        continue
      }
      const ej = ejercicioPorId(res.ejercicioId!)!
      expect(ej.equipo.some((e) => sobre.equipoDisponible.includes(e))).toBe(true)
      for (const z of ej.contraindica) expect(sobre.contraindicados).not.toContain(z)
      for (const m of ej.modalidades) expect(sobre.modalidadesVetadas).not.toContain(m)
    }
  })
})

describe('validadores de propuestas del LLM', () => {
  it('rechaza una comida con alérgeno excluido', () => {
    const sobre: SobreComida = {
      id: 's',
      tipo: 'comida',
      momento: 'comida',
      kcal: { min: 200, max: 500 },
      proteinaG: { min: 10, max: 60 },
      carbosG: { min: 0, max: 60 },
      grasaG: { min: 0, max: 40 },
      excluidos: ['pescado'],
      dieta: ['omnivoro'],
      noGustaIds: [],
      locale: 'es',
      candidatos: [],
    }
    const res = validarSustitucionComida(sobre, { items: [{ id: 'salmon', gramos: 150 }] })
    expect(res.ok).toBe(false)
    expect(res.motivos).toContain('alergeno')
  })

  it('rechaza un ejercicio con equipo no disponible', () => {
    const sobre: SobreEjercicio = {
      id: 'e',
      tipo: 'ejercicio',
      grupo: 'pecho',
      patron: 'empuje_horizontal',
      series: { min: 2, max: 4 },
      reps: { min: 6, max: 12 },
      rir: { min: 1, max: 3 },
      equipoDisponible: ['peso_corporal'],
      contraindicados: [],
      modalidadesVetadas: [],
      locale: 'es',
      candidatos: [],
    }
    const res = validarSustitucionEjercicio(sobre, { ejercicioId: 'press_banca_barra', series: 3, reps: 8 })
    expect(res.ok).toBe(false)
    expect(res.motivos).toContain('equipo_no_disponible')
  })

  it('acepta una propuesta coherente', () => {
    const sobre: SobreEjercicio = {
      id: 'e',
      tipo: 'ejercicio',
      grupo: 'pecho',
      patron: 'empuje_horizontal',
      series: { min: 2, max: 4 },
      reps: { min: 6, max: 12 },
      rir: { min: 1, max: 3 },
      equipoDisponible: ['peso_corporal'],
      contraindicados: [],
      modalidadesVetadas: [],
      locale: 'es',
      candidatos: [],
    }
    const res = validarSustitucionEjercicio(sobre, { ejercicioId: 'flexiones', series: 3, reps: 10 })
    expect(res.ok).toBe(true)
  })
})
