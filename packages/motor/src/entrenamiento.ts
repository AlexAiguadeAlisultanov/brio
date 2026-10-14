import { EJERCICIOS, type Ejercicio } from './datos/ejercicios'
import { ejercicioViolaDura } from './sustitucion'
import type {
  EjercicioPlan,
  EntrenamientoPlan,
  Experiencia,
  GrupoMuscular,
  InformeSeguridad,
  ModalidadRiesgo,
  Objetivo,
  Perfil,
  Prescripcion,
  SesionPlan,
} from './tipos'

// Diseño de la rutina: split por días, prescripción por objetivo, volumen por grupo dentro
// de [MEV, MRV] y selección de ejercicios respetando equipo, lesiones y modalidades vetadas.

const TORSO: GrupoMuscular[] = ['pecho', 'espalda', 'hombro', 'triceps', 'biceps', 'abdomen']
const PIERNA: GrupoMuscular[] = ['cuadriceps', 'isquios', 'gluteos', 'gemelos', 'abdomen']
const PUSH: GrupoMuscular[] = ['pecho', 'hombro', 'triceps']
const PULL: GrupoMuscular[] = ['espalda', 'biceps']
const LEGS: GrupoMuscular[] = ['cuadriceps', 'isquios', 'gluteos', 'gemelos', 'abdomen']
const FULL: GrupoMuscular[] = ['pecho', 'espalda', 'cuadriceps', 'isquios', 'gluteos', 'hombro', 'biceps', 'triceps', 'gemelos', 'abdomen']

interface SesionTpl {
  nombre: string
  grupos: GrupoMuscular[]
}

export interface Split {
  nombre: string
  sesiones: SesionTpl[]
}

export function clampDiasEntreno(dias: number): number {
  if (!Number.isFinite(dias)) return 0
  return Math.min(Math.max(Math.round(dias), 0), 6)
}

// 1-2 full body; 3 A/B/A (dos variantes de cuerpo completo); 4 torso/pierna x2;
// 5 torso/pierna + PPL; 6 PPL x2. Garantiza frecuencia >=2x cuando los días lo permiten.
export function elegirSplit(dias: number): Split {
  const d = clampDiasEntreno(dias)
  switch (d) {
    case 0:
      return { nombre: 'descanso', sesiones: [] }
    case 1:
      return { nombre: 'full_body', sesiones: [{ nombre: 'Cuerpo completo', grupos: FULL }] }
    case 2:
      return {
        nombre: 'full_body',
        sesiones: [
          { nombre: 'Cuerpo completo A', grupos: FULL },
          { nombre: 'Cuerpo completo B', grupos: FULL },
        ],
      }
    case 3:
      return {
        nombre: 'full_body_aba',
        sesiones: [
          { nombre: 'Cuerpo completo A', grupos: FULL },
          { nombre: 'Cuerpo completo B', grupos: FULL },
          { nombre: 'Cuerpo completo A', grupos: FULL },
        ],
      }
    case 4:
      return {
        nombre: 'torso_pierna',
        sesiones: [
          { nombre: 'Torso', grupos: TORSO },
          { nombre: 'Pierna', grupos: PIERNA },
          { nombre: 'Torso', grupos: TORSO },
          { nombre: 'Pierna', grupos: PIERNA },
        ],
      }
    case 5:
      return {
        nombre: 'torso_pierna_ppl',
        sesiones: [
          { nombre: 'Torso', grupos: TORSO },
          { nombre: 'Pierna', grupos: PIERNA },
          { nombre: 'Empuje', grupos: PUSH },
          { nombre: 'Tirón', grupos: PULL },
          { nombre: 'Pierna', grupos: LEGS },
        ],
      }
    default:
      return {
        nombre: 'ppl',
        sesiones: [
          { nombre: 'Empuje', grupos: PUSH },
          { nombre: 'Tirón', grupos: PULL },
          { nombre: 'Pierna', grupos: LEGS },
          { nombre: 'Empuje', grupos: PUSH },
          { nombre: 'Tirón', grupos: PULL },
          { nombre: 'Pierna', grupos: LEGS },
        ],
      }
  }
}

interface BaseObjetivo {
  reps: { min: number; max: number }
  series: { min: number; max: number }
  rir: { min: number; max: number }
  descansoSegundos: number
  pct1RM: { min: number; max: number }
}

const TABLA_OBJETIVO: Record<Objetivo, BaseObjetivo> = {
  fuerza: { reps: { min: 3, max: 6 }, series: { min: 3, max: 6 }, rir: { min: 1, max: 3 }, descansoSegundos: 180, pct1RM: { min: 0.8, max: 0.9 } },
  ganar_musculo: { reps: { min: 6, max: 12 }, series: { min: 3, max: 4 }, rir: { min: 1, max: 2 }, descansoSegundos: 105, pct1RM: { min: 0.67, max: 0.8 } },
  perder_grasa: { reps: { min: 8, max: 12 }, series: { min: 3, max: 4 }, rir: { min: 1, max: 2 }, descansoSegundos: 90, pct1RM: { min: 0.67, max: 0.8 } },
  mantenimiento: { reps: { min: 8, max: 12 }, series: { min: 3, max: 4 }, rir: { min: 2, max: 3 }, descansoSegundos: 90, pct1RM: { min: 0.65, max: 0.75 } },
}

// %1RM solo para intermedio/avanzado y nunca cuando la seguridad pide "sin máximas"
// (principiantes y edad >=65 entrenan por RIR/RPE con carga autoseleccionada).
export function prescripcion(objetivo: Objetivo, experiencia: Experiencia, sinMaximas: boolean): Prescripcion {
  const base = TABLA_OBJETIVO[objetivo] ?? TABLA_OBJETIVO.mantenimiento
  const usaMaximas = (experiencia === 'intermedio' || experiencia === 'avanzado') && !sinMaximas
  return {
    reps: { ...base.reps },
    series: { ...base.series },
    rir: { ...base.rir },
    descansoSegundos: base.descansoSegundos,
    pct1RM: usaMaximas ? { ...base.pct1RM } : undefined,
    usaMaximas,
  }
}

export interface VolumenGrupo {
  mev: number
  mav: number
  mrv: number
}

const TABLA_VOLUMEN: Record<GrupoMuscular, VolumenGrupo> = {
  pecho: { mev: 8, mav: 14, mrv: 22 },
  espalda: { mev: 10, mav: 16, mrv: 25 },
  cuadriceps: { mev: 8, mav: 14, mrv: 20 },
  isquios: { mev: 6, mav: 12, mrv: 18 },
  gluteos: { mev: 6, mav: 12, mrv: 20 },
  hombro: { mev: 8, mav: 16, mrv: 26 },
  biceps: { mev: 8, mav: 14, mrv: 20 },
  triceps: { mev: 8, mav: 14, mrv: 20 },
  gemelos: { mev: 8, mav: 14, mrv: 20 },
  abdomen: { mev: 6, mav: 12, mrv: 20 },
}

export function volumenSemanal(grupo: GrupoMuscular, _experiencia: Experiencia): VolumenGrupo {
  return TABLA_VOLUMEN[grupo]
}

// Volumen objetivo dentro de [MEV, MRV], escalado por experiencia.
export function objetivoVolumen(grupo: GrupoMuscular, experiencia: Experiencia): number {
  const v = TABLA_VOLUMEN[grupo]
  let objetivo: number
  if (experiencia === 'principiante') objetivo = v.mev
  else if (experiencia === 'intermedio') objetivo = v.mav
  else objetivo = Math.round((v.mav + v.mrv) / 2)
  return Math.min(Math.max(objetivo, v.mev), v.mrv)
}

const ORDEN_NIVEL: Record<Experiencia, number> = { principiante: 0, intermedio: 1, avanzado: 2 }

// Ejercicios válidos para un grupo: filtra por equipo disponible, zonas lesionadas y
// modalidades vetadas (filtros duros, nunca se relajan). El nivel se usa como preferencia:
// si al filtrarlo no queda ninguno, se mantienen los duros-válidos para no dejar el grupo
// sin cubrir. El orden es determinista.
export function seleccionarEjercicios(
  grupo: GrupoMuscular,
  perfil: Perfil,
  modalidadesVetadas: ModalidadRiesgo[],
): Ejercicio[] {
  const durosValidos = EJERCICIOS.filter(
    (e) => e.grupo === grupo && !ejercicioViolaDura(e, perfil.equipo, perfil.lesiones, modalidadesVetadas),
  )
  const maxNivel = ORDEN_NIVEL[perfil.experiencia] ?? 0
  const porNivel = durosValidos.filter((e) => ORDEN_NIVEL[e.nivel] <= maxNivel)
  const base = porNivel.length > 0 ? porNivel : durosValidos
  return [...base].sort((a, b) => {
    const compuesto = (e: Ejercicio) => (e.patron === 'aislado' ? 1 : 0)
    return compuesto(a) - compuesto(b) || ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel] || a.id.localeCompare(b.id)
  })
}

export function estimar1RM(peso: number, reps: number): number {
  return peso * (1 + reps / 30)
}

export function cargaTrabajo(rm1: number, pct: number): number {
  return rm1 * pct
}

interface Colocacion {
  sesionIdx: number
  ejercicio: Ejercicio
}

export function construirEntrenamiento(perfil: Perfil, informe: InformeSeguridad): EntrenamientoPlan {
  const dias = clampDiasEntreno(perfil.diasPorSemana)
  const presc = prescripcion(informe.objetivoEfectivo, perfil.experiencia, informe.sinMaximas)
  const split = elegirSplit(dias)
  const vetadas = informe.modalidadesVetadas

  const sesiones: SesionPlan[] = split.sesiones.map((s, i) => ({
    id: `d${i + 1}`,
    dia: i + 1,
    nombre: s.nombre,
    grupos: s.grupos,
    ejercicios: [],
  }))

  // Frecuencia planificada por grupo (número de sesiones que lo incluyen).
  const freq: Partial<Record<GrupoMuscular, number>> = {}
  for (const s of split.sesiones) for (const g of s.grupos) freq[g] = (freq[g] ?? 0) + 1

  // Colocaciones por grupo: qué ejercicio concreto va en qué sesión.
  const colocaciones = new Map<GrupoMuscular, Colocacion[]>()
  for (let i = 0; i < split.sesiones.length; i++) {
    const tpl = split.sesiones[i]!
    for (const g of tpl.grupos) {
      const cands = seleccionarEjercicios(g, perfil, vetadas)
      if (cands.length === 0) continue
      const f = freq[g] ?? 1
      const numEj = objetivoVolumen(g, perfil.experiencia) / f >= 6 && cands.length >= 2 ? 2 : 1
      const lista = colocaciones.get(g) ?? []
      for (let k = 0; k < Math.min(numEj, cands.length); k++) {
        lista.push({ sesionIdx: i, ejercicio: cands[k]! })
      }
      colocaciones.set(g, lista)
    }
  }

  const volumenPorGrupo: Partial<Record<GrupoMuscular, number>> = {}

  for (const [grupo, lista] of colocaciones) {
    if (lista.length === 0) continue
    const v = TABLA_VOLUMEN[grupo]
    const objetivo = objetivoVolumen(grupo, perfil.experiencia)

    // Reordena las colocaciones en ronda-robin por sesión: primero el ejercicio inicial de
    // cada sesión, luego el segundo, etc. Así, al quedarnos con las primeras, el volumen se
    // reparte entre sesiones y la frecuencia por grupo se mantiene alta.
    const porSesion = new Map<number, number>()
    const conRonda = lista.map((c) => {
      const ronda = porSesion.get(c.sesionIdx) ?? 0
      porSesion.set(c.sesionIdx, ronda + 1)
      return { c, ronda }
    })
    conRonda.sort((a, b) => a.ronda - b.ronda || a.c.sesionIdx - b.c.sesionIdx)
    const ordenada = conRonda.map((x) => x.c)

    // Reparte el volumen objetivo entre las colocaciones, usando las suficientes para no
    // pasar de ~8 series por ejercicio, y asigna series enteras que suman exactamente el objetivo.
    const slots = Math.min(ordenada.length, Math.max(1, Math.ceil(objetivo / 8)))
    const usadas = ordenada.slice(0, slots)
    const base = Math.floor(objetivo / slots)
    const extra = objetivo - base * slots

    let asignado = 0
    for (let i = 0; i < usadas.length; i++) {
      const col = usadas[i]!
      const series = base + (i < extra ? 1 : 0)
      asignado += series
      const sesion = sesiones[col.sesionIdx]!
      const n = sesion.ejercicios.length + 1
      const plan: EjercicioPlan = {
        id: `${sesion.id}_e${n}`,
        ejercicioId: col.ejercicio.id,
        grupo,
        patron: col.ejercicio.patron,
        series,
        reps: { ...presc.reps },
        rir: { ...presc.rir },
      }
      if (presc.pct1RM) plan.pct1RM = { ...presc.pct1RM }
      sesion.ejercicios.push(plan)
    }
    volumenPorGrupo[grupo] = Math.min(Math.max(asignado, v.mev), v.mrv)
  }

  return {
    split: split.nombre,
    diasPorSemana: dias,
    prescripcion: presc,
    volumenPorGrupo,
    sesiones,
  }
}
