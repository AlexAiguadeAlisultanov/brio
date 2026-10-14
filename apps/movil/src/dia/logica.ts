import {
  ajustarPorFeedback,
  progresar,
  sustituirComidaDeterminista,
  sustituirEjercicioDeterminista,
  type EjercicioPlan,
  type Experiencia,
  type ItemComida,
  type Macros,
  type Plan,
  type Rango,
  type SesionPlan,
  type SobreComida,
  type SobreEjercicio,
} from '@brio/motor'

// Lógica del día a día, pura y sin React. Todo número sale del motor: aquí solo se suma lo
// ya registrado, se elige qué sesión toca y se preparan las alternativas de sustitución
// reutilizando el respaldo determinista del motor. Vive aparte para poder probarla sin montar
// la interfaz.

// Tipos del motor que no se exportan por su nombre; se derivan de las firmas públicas.
type EstadoEjercicio = Parameters<typeof progresar>[0]
export type ResultadoProgresion = ReturnType<typeof progresar>
export type Feedback = 'facil' | 'ok' | 'dificil'

export const MACROS_CERO: Macros = { kcal: 0, proteinaG: 0, grasaG: 0, carbosG: 0, fibraG: 0 }

const centro = (r: Rango): number => (r.min + r.max) / 2

// Fecha local en formato YYYY-MM-DD (no UTC: el día del usuario es el de su reloj).
export function fechaISO(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

// Día de la semana con el lunes como 0 y el domingo como 6.
export function diaSemanaLunes0(d: Date = new Date()): number {
  return (d.getDay() + 6) % 7
}

// --- Anillos del día ---

interface ConMacros {
  macros: Partial<Macros>
}

export function sumarConsumo(registros: ConMacros[]): Macros {
  return registros.reduce<Macros>(
    (acc, r) => ({
      kcal: acc.kcal + (r.macros.kcal ?? 0),
      proteinaG: acc.proteinaG + (r.macros.proteinaG ?? 0),
      grasaG: acc.grasaG + (r.macros.grasaG ?? 0),
      carbosG: acc.carbosG + (r.macros.carbosG ?? 0),
      fibraG: acc.fibraG + (r.macros.fibraG ?? 0),
    }),
    { ...MACROS_CERO },
  )
}

export interface ObjetivoDia {
  kcal: number
  proteinaG: number
  carbosG: number
  grasaG: number
}

// Objetivo del día para los anillos. Null cuando el plan esconde o bloquea las cifras: en ese
// caso la pantalla no dibuja anillos de kcal, muestra un mensaje y deriva.
export function objetivoDelDia(plan: Plan): ObjetivoDia | null {
  if (plan.bloqueado || plan.ocultarCifras) return null
  if (!plan.energia || !plan.macros) return null
  return {
    kcal: plan.energia.kcalObjetivo,
    proteinaG: plan.macros.proteinaG,
    carbosG: plan.macros.carbosG,
    grasaG: plan.macros.grasaG,
  }
}

// Razón de llenado de un anillo, acotada a 0..1 para el trazo; el texto puede pasarse del 100%.
export function razonAnillo(valor: number, objetivo: number): number {
  if (objetivo <= 0) return 0
  const r = valor / objetivo
  return r < 0 ? 0 : r > 1 ? 1 : r
}

export function anilloCerrado(valor: number, objetivo: number): boolean {
  return objetivo > 0 && valor >= objetivo
}

// --- Sesión de hoy ---

export type SesionDeHoy = { descanso: true } | { descanso: false; sesion: SesionPlan }

// Reparte las sesiones del plan en los primeros días de la semana (lunes en adelante) y deja
// el resto como descanso. El calendario fino de la semana llega en la Fase 2B; aquí basta con
// saber qué toca hoy de forma estable.
export function sesionDeHoy(plan: Plan, dia: number): SesionDeHoy {
  const sesiones = plan.entrenamiento?.sesiones ?? []
  if (sesiones.length === 0) return { descanso: true }
  if (dia < 0 || dia >= sesiones.length) return { descanso: true }
  const sesion = sesiones[dia]
  if (!sesion) return { descanso: true }
  return { descanso: false, sesion }
}

export interface Avance {
  hechas: number
  total: number
}

// Avance de la sesión: series marcadas frente a las series prescritas.
export function avanceSesion(ejercicios: EjercicioPlan[], seriesHechas: { completada: boolean }[]): Avance {
  const total = ejercicios.reduce((n, e) => n + e.series, 0)
  const hechas = seriesHechas.filter((s) => s.completada).length
  return { hechas: Math.min(hechas, total), total }
}

// --- Progresión a partir del registro ---

export interface SerieParcial {
  pesoKg?: number
  reps?: number
  completada: boolean
}

// Reconstruye el estado del ejercicio a partir de las series hechas (la de más carga manda).
// Sin ninguna serie con peso registrada no hay base para progresar: devuelve null.
export function estadoEjercicio(ejPlan: EjercicioPlan, series: SerieParcial[]): EstadoEjercicio | null {
  const utiles = series.filter((s) => s.completada && s.pesoKg != null && s.pesoKg > 0)
  if (utiles.length === 0) return null
  const mejor = utiles.reduce((a, b) => ((b.pesoKg ?? 0) > (a.pesoKg ?? 0) ? b : a))
  return {
    ejercicioId: ejPlan.ejercicioId,
    grupo: ejPlan.grupo,
    pesoKg: mejor.pesoKg ?? 0,
    repsConseguidas: mejor.reps ?? ejPlan.reps.min,
    repsObjetivo: ejPlan.reps,
    rirObjetivo: Math.round(centro(ejPlan.rir)),
    estancamientos: 0,
  }
}

// Objetivo de carga y reps para la próxima vez. El feedback de la última sesión manda: "fácil"
// o "duro" ajustan el estímulo; con "en su punto" (o sin feedback) se progresa normal.
export function siguienteObjetivo(
  ejPlan: EjercicioPlan,
  series: SerieParcial[],
  feedback: Feedback | undefined,
  experiencia: Experiencia,
): ResultadoProgresion | null {
  const estado = estadoEjercicio(ejPlan, series)
  if (!estado) return null
  if (feedback === 'facil' || feedback === 'dificil') return ajustarPorFeedback(estado, feedback)
  return progresar(estado, experiencia)
}

// --- Deltas frente al objetivo de la comida ---

export interface DeltaObjetivo {
  kcal: number
  kcalPct: number
  proteinaG: number
  carbosG: number
  grasaG: number
}

export function deltaFrenteObjetivo(macros: Macros, objetivo: ObjetivoDia): DeltaObjetivo {
  return {
    kcal: macros.kcal - objetivo.kcal,
    kcalPct: objetivo.kcal > 0 ? (macros.kcal - objetivo.kcal) / objetivo.kcal : 0,
    proteinaG: macros.proteinaG - objetivo.proteinaG,
    carbosG: macros.carbosG - objetivo.carbosG,
    grasaG: macros.grasaG - objetivo.grasaG,
  }
}

// --- Alternativas de comida ---

export interface AlternativaComida {
  id: string
  items: ItemComida[]
  macros: Macros
  delta: DeltaObjetivo
  aproximado: boolean
}

export interface AlternativasComida {
  vacio: boolean
  derivar?: boolean
  mensajeId?: string
  opciones: AlternativaComida[]
}

// Construye varias alternativas de comida reutilizando el respaldo determinista del motor: una
// por candidato (el motor escala la porción y marca si es aproximada). Si el conjunto queda
// vacío tras las exclusiones duras, lo propaga tal cual: el hueco se mantiene y se deriva.
export function alternativasComida(sobre: SobreComida, objetivo: ObjetivoDia, maxN = 5): AlternativasComida {
  const base = sustituirComidaDeterminista(sobre)
  if (base.vacio) {
    const salida: AlternativasComida = { vacio: true, opciones: [] }
    if (base.derivar != null) salida.derivar = base.derivar
    if (base.mensajeId != null) salida.mensajeId = base.mensajeId
    return salida
  }

  const opciones: AlternativaComida[] = []
  const vistos = new Set<string>()
  const candidatos = sobre.candidatos.length > 0 ? sobre.candidatos : []
  for (const id of candidatos) {
    if (opciones.length >= maxN) break
    if (vistos.has(id)) continue
    const r = sustituirComidaDeterminista({ ...sobre, candidatos: [id] })
    if (r.vacio || r.items.length === 0) continue
    vistos.add(id)
    opciones.push({ id, items: r.items, macros: r.macros, delta: deltaFrenteObjetivo(r.macros, objetivo), aproximado: r.aproximado })
  }

  // Si el sobre no traía candidatos ordenados, al menos ofrecemos la mejor opción determinista.
  if (opciones.length === 0) {
    opciones.push({
      id: base.items[0]?.id ?? 'desconocido',
      items: base.items,
      macros: base.macros,
      delta: deltaFrenteObjetivo(base.macros, objetivo),
      aproximado: base.aproximado,
    })
  }

  return { vacio: false, opciones }
}

// --- Alternativas de ejercicio ---

export interface AlternativaEjercicio {
  ejercicioId: string
  series: number
  reps: Rango
  rir: Rango
  aproximado: boolean
}

export interface AlternativasEjercicio {
  vacio: boolean
  derivar?: boolean
  mensajeId?: string
  opciones: AlternativaEjercicio[]
}

export function alternativasEjercicio(sobre: SobreEjercicio, maxN = 5): AlternativasEjercicio {
  const base = sustituirEjercicioDeterminista(sobre)
  if (base.vacio) {
    const salida: AlternativasEjercicio = { vacio: true, opciones: [] }
    if (base.derivar != null) salida.derivar = base.derivar
    if (base.mensajeId != null) salida.mensajeId = base.mensajeId
    return salida
  }

  const opciones: AlternativaEjercicio[] = []
  const vistos = new Set<string>()
  for (const id of sobre.candidatos) {
    if (opciones.length >= maxN) break
    if (vistos.has(id)) continue
    const r = sustituirEjercicioDeterminista({ ...sobre, candidatos: [id] })
    if (r.vacio || !r.ejercicioId) continue
    vistos.add(r.ejercicioId)
    opciones.push({
      ejercicioId: r.ejercicioId,
      series: r.series ?? sobre.series.min,
      reps: r.reps ?? sobre.reps,
      rir: r.rir ?? sobre.rir,
      aproximado: r.aproximado,
    })
  }

  if (opciones.length === 0 && base.ejercicioId) {
    opciones.push({
      ejercicioId: base.ejercicioId,
      series: base.series ?? sobre.series.min,
      reps: base.reps ?? sobre.reps,
      rir: base.rir ?? sobre.rir,
      aproximado: base.aproximado,
    })
  }

  return { vacio: false, opciones }
}
