import { describe, expect, it } from 'vitest'
import { ejercicioPorId } from '../datos/ejercicios'
import {
  cargaTrabajo,
  construirEntrenamiento,
  elegirSplit,
  estimar1RM,
  objetivoVolumen,
  prescripcion,
  volumenSemanal,
} from '../entrenamiento'
import { evaluarSeguridad } from '../seguridad'
import type { GrupoMuscular } from '../tipos'
import { perfilBase } from './_helpers'

describe('split por días', () => {
  it('asigna el número de sesiones correcto', () => {
    expect(elegirSplit(1).sesiones).toHaveLength(1)
    expect(elegirSplit(2).sesiones).toHaveLength(2)
    expect(elegirSplit(3).sesiones).toHaveLength(3)
    expect(elegirSplit(4).sesiones).toHaveLength(4)
    expect(elegirSplit(5).sesiones).toHaveLength(5)
    expect(elegirSplit(6).sesiones).toHaveLength(6)
  })
  it('4 días es torso/pierna x2', () => {
    expect(elegirSplit(4).nombre).toBe('torso_pierna')
  })
})

describe('frecuencia por grupo', () => {
  it('alcanza >=2x en los grupos principales cuando los días lo permiten', () => {
    const principales: GrupoMuscular[] = ['pecho', 'espalda', 'cuadriceps']
    for (let dias = 2; dias <= 6; dias++) {
      const perfil = perfilBase({ diasPorSemana: dias, experiencia: 'intermedio' })
      const informe = evaluarSeguridad(perfil, 'ganar_musculo')
      const ent = construirEntrenamiento(perfil, informe)
      for (const g of principales) {
        const freq = ent.sesiones.filter((s) => s.ejercicios.some((e) => e.grupo === g)).length
        expect(freq, `grupo ${g} con ${dias} días`).toBeGreaterThanOrEqual(2)
      }
    }
  })
})

describe('volumen dentro de [MEV, MRV]', () => {
  it('cada grupo entrenado queda en rango', () => {
    const perfil = perfilBase({ experiencia: 'avanzado' })
    const informe = evaluarSeguridad(perfil, 'ganar_musculo')
    const ent = construirEntrenamiento(perfil, informe)
    for (const [grupo, series] of Object.entries(ent.volumenPorGrupo)) {
      const v = volumenSemanal(grupo as GrupoMuscular, 'avanzado')
      expect(series).toBeGreaterThanOrEqual(v.mev)
      expect(series).toBeLessThanOrEqual(v.mrv)
    }
  })
  it('objetivoVolumen siempre queda en [MEV, MRV]', () => {
    for (const g of ['pecho', 'espalda', 'biceps'] as GrupoMuscular[]) {
      for (const exp of ['principiante', 'intermedio', 'avanzado'] as const) {
        const v = volumenSemanal(g, exp)
        const o = objetivoVolumen(g, exp)
        expect(o).toBeGreaterThanOrEqual(v.mev)
        expect(o).toBeLessThanOrEqual(v.mrv)
      }
    }
  })
})

describe('prescripción por objetivo', () => {
  it('fuerza coincide con la tabla', () => {
    const p = prescripcion('fuerza', 'intermedio', false)
    expect(p.reps).toEqual({ min: 3, max: 6 })
    expect(p.series).toEqual({ min: 3, max: 6 })
    expect(p.rir).toEqual({ min: 1, max: 3 })
    expect(p.descansoSegundos).toBe(180)
    expect(p.pct1RM).toEqual({ min: 0.8, max: 0.9 })
  })
  it('hipertrofia coincide con la tabla', () => {
    const p = prescripcion('ganar_musculo', 'avanzado', false)
    expect(p.reps).toEqual({ min: 6, max: 12 })
    expect(p.rir).toEqual({ min: 1, max: 2 })
  })
})

describe('principiante no recibe %1RM', () => {
  it('prescripción sin máximas', () => {
    const p = prescripcion('fuerza', 'principiante', false)
    expect(p.usaMaximas).toBe(false)
    expect(p.pct1RM).toBeUndefined()
  })
  it('edad >=65 (sinMaximas) no recibe %1RM aunque sea avanzado', () => {
    const p = prescripcion('fuerza', 'avanzado', true)
    expect(p.pct1RM).toBeUndefined()
  })
  it('ningún ejercicio de un principiante lleva pct1RM', () => {
    const perfil = perfilBase({ experiencia: 'principiante' })
    const informe = evaluarSeguridad(perfil, 'fuerza')
    const ent = construirEntrenamiento(perfil, informe)
    for (const s of ent.sesiones) for (const e of s.ejercicios) expect(e.pct1RM).toBeUndefined()
  })
})

describe('modalidades vetadas no aparecen', () => {
  it('con patología cardiovascular ningún ejercicio carga una modalidad vetada', () => {
    const perfil = perfilBase({ cribado: { ...perfilBase().cribado, enfermedadCardiovascular: true } })
    const informe = evaluarSeguridad(perfil, 'fuerza')
    const ent = construirEntrenamiento(perfil, informe)
    for (const s of ent.sesiones) {
      for (const e of s.ejercicios) {
        const cat = ejercicioPorId(e.ejercicioId)!
        for (const m of cat.modalidades) expect(informe.modalidadesVetadas).not.toContain(m)
      }
    }
  })
})

describe('Epley y carga de trabajo', () => {
  it('estima el 1RM', () => {
    expect(estimar1RM(100, 10)).toBeCloseTo(133.333, 3)
  })
  it('carga de trabajo = 1RM * pct', () => {
    expect(cargaTrabajo(100, 0.8)).toBeCloseTo(80, 6)
  })
})
