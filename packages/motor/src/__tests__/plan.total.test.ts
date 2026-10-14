import { describe, expect, it } from 'vitest'
import { alimentoPorId } from '../datos/alimentos'
import { ejercicioPorId } from '../datos/ejercicios'
import { volumenSemanal } from '../entrenamiento'
import { generarPlan, VERSION_MOTOR } from '../index'
import { cuadra } from '../macros'
import { alimentoViolaDura, ejercicioViolaDura } from '../sustitucion'
import type { GrupoMuscular } from '../tipos'
import { elegir, mulberry32, OBJETIVOS, perfilAleatorio } from './_helpers'

describe('fuzz total: generarPlan nunca lanza y siempre devuelve un plan coherente', () => {
  it('3000 perfiles aleatorios con campos extremos', () => {
    const rng = mulberry32(0x0ddba11)
    for (let i = 0; i < 3000; i++) {
      const perfil = perfilAleatorio(rng)
      const objetivo = elegir(rng, OBJETIVOS)

      let plan
      try {
        plan = generarPlan(perfil, objetivo, { ahoraISO: '2026-01-01T00:00:00.000Z' })
      } catch (e) {
        throw new Error(`generarPlan lanzó en el caso ${i}: ${String(e)}`)
      }

      expect(plan.version).toBe(VERSION_MOTOR)
      expect(['completo', 'orientacion', 'bloqueado']).toContain(plan.estado)
      expect(Array.isArray(plan.avisos)).toBe(true)

      if (plan.bloqueado) {
        expect(plan.estado).toBe('bloqueado')
        expect(plan.energia).toBeUndefined()
        expect(plan.macros).toBeUndefined()
        continue
      }

      // Cifras: kcal nunca por debajo del suelo y macros que cuadran.
      if (plan.energia) {
        expect(plan.energia.kcalObjetivo).toBeGreaterThanOrEqual(plan.energia.sueloKcal - 1)
        expect(plan.macros).toBeDefined()
        expect(cuadra(plan.macros!, 0.02), `macros no cuadran en el caso ${i}`).toBe(true)
        expect(plan.macros!.carbosG).toBeGreaterThanOrEqual(0)
      }

      // Rutina: volumen en rango y sin exclusiones duras violadas.
      if (plan.entrenamiento) {
        for (const [grupo, series] of Object.entries(plan.entrenamiento.volumenPorGrupo)) {
          const v = volumenSemanal(grupo as GrupoMuscular, perfil.experiencia)
          expect(series).toBeGreaterThanOrEqual(v.mev)
          expect(series).toBeLessThanOrEqual(v.mrv)
        }
        for (const s of plan.entrenamiento.sesiones) {
          for (const e of s.ejercicios) {
            const cat = ejercicioPorId(e.ejercicioId)!
            expect(cat).toBeDefined()
            expect(
              ejercicioViolaDura(cat, perfil.equipo, perfil.lesiones, plan.seguridad.modalidadesVetadas),
              `ejercicio ${e.ejercicioId} viola exclusión en el caso ${i}`,
            ).toBe(false)
          }
        }
      }

      // Comidas: ningún alimento viola alérgeno/intolerancia/dieta.
      if (plan.comidas) {
        const excluidos = [...perfil.alergias, ...perfil.intolerancias]
        for (const c of plan.comidas) {
          for (const item of c.alimentos) {
            const al = alimentoPorId(item.id)!
            expect(al).toBeDefined()
            expect(
              alimentoViolaDura(al, excluidos, perfil.patronDietetico),
              `alimento ${item.id} viola exclusión en el caso ${i}`,
            ).toBe(false)
          }
        }
      }
    }
  })
})
