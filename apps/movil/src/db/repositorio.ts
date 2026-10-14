import type { AjusteSemanal, Locale, Macros, Objetivo, Perfil, Plan, RegistroProgreso } from '@brio/motor'

// Contrato de la capa de datos. Las pantallas hablan siempre con esta interfaz y nunca
// escriben SQL a mano: así da igual que por debajo haya SQLite (dispositivo) o un repositorio
// en memoria (web), y la lógica de pantalla no cambia.

export type DurezaRestriccion = 'dura' | 'blanda'
export type Unidades = 'metrico' | 'imperial'

export interface NuevaRestriccion {
  tipo: string
  valor: string
  dureza: DurezaRestriccion
  origen: string
}

export interface RestriccionGuardada extends NuevaRestriccion {
  id: number
}

export interface AjustesApp {
  locale: Locale
  unidades: Unidades
  avisoAceptado: boolean
  rachaDias: number
  consentimientoLlm: boolean
}

export const AJUSTES_APP_POR_DEFECTO: AjustesApp = {
  locale: 'es',
  unidades: 'metrico',
  avisoAceptado: false,
  rachaDias: 0,
  consentimientoLlm: false,
}

export interface PlanGuardado {
  id: number
  versionMotor: string
  objetivo: Objetivo
  plan: Plan
  activo: boolean
  generadoEn: string
}

export interface NuevaSesion {
  planId?: number
  sesionPlanId?: string
  fecha: string
  completada?: boolean
  nota?: string
}

// Sensación con la que se cierra la sesión. Alimenta la progresión del motor en la siguiente.
export type FeedbackSesion = 'facil' | 'ok' | 'dificil'

export interface SesionGuardada {
  id: number
  planId?: number
  sesionPlanId?: string
  fecha: string
  completada: boolean
  feedback?: FeedbackSesion
  nota?: string
}

export interface SerieGuardada {
  id: number
  sesionId: number
  ejercicioId: string
  numeroSerie: number
  pesoKg?: number
  reps?: number
  rir?: number
  completada: boolean
  fecha: string
}

export interface ComidaGuardada {
  id: number
  comidaPlanId?: string
  alimentoId: string
  gramos: number
  macros: Partial<Macros>
  fecha: string
}

export interface NuevaSerie {
  sesionId: number
  ejercicioId: string
  numeroSerie: number
  pesoKg?: number
  reps?: number
  rir?: number
  completada?: boolean
  fecha: string
}

export interface NuevaComida {
  comidaPlanId?: string
  alimentoId: string
  gramos: number
  macros?: Partial<Macros>
  fecha: string
}

// Un progreso lleva lo que pide el motor (fecha + peso) más datos opcionales de la app.
export interface NuevoProgreso extends RegistroProgreso {
  cinturaCm?: number
  nota?: string
}

export interface Repositorio {
  // --- Perfil y objetivo (fila única) ---
  guardarPerfil(perfil: Perfil): Promise<void>
  cargarPerfil(): Promise<Perfil | null>
  hayPerfilMinimo(): Promise<boolean>
  guardarObjetivo(objetivo: Objetivo): Promise<void>
  cargarObjetivo(): Promise<Objetivo | null>

  // --- Restricciones ---
  guardarRestriccion(restriccion: NuevaRestriccion): Promise<number>
  restricciones(): Promise<RestriccionGuardada[]>
  restriccionesDuras(): Promise<RestriccionGuardada[]>
  borrarRestriccion(id: number): Promise<void>

  // --- Plan ---
  guardarPlan(plan: Plan): Promise<number>
  planActivo(): Promise<Plan | null>
  historialPlanes(): Promise<PlanGuardado[]>

  // --- Registros diarios ---
  registrarSesion(sesion: NuevaSesion): Promise<number>
  registrarSerie(serie: NuevaSerie): Promise<number>
  registrarComida(comida: NuevaComida): Promise<number>

  // --- Lectura del día (para los anillos, el avance del entreno y el estado de las comidas) ---
  comidasDeFecha(fechaISO: string): Promise<ComidaGuardada[]>
  // Quita lo registrado de un hueco en un día (desmarcar una comida). Idempotente.
  borrarComidasDeHueco(fechaISO: string, comidaPlanId: string): Promise<void>
  seriesDeFecha(fechaISO: string): Promise<SerieGuardada[]>
  // Sesión registrada de un día para una sesión del plan (si ya se empezó). Null si aún no.
  sesionDelDia(fechaISO: string, sesionPlanId: string): Promise<SesionGuardada | null>
  // Series de una sesión concreta, para reconstruir el estado de la última sesión del ejercicio.
  seriesDeSesion(sesionId: number): Promise<SerieGuardada[]>
  // Última sesión completada de esa sesión del plan antes de una fecha; alimenta la progresión.
  ultimaSesionCompletada(sesionPlanId: string, antesDeFechaISO: string): Promise<SesionGuardada | null>
  // Quita una serie registrada (al desmarcarla). Idempotente.
  borrarSerie(id: number): Promise<void>
  // Guarda la sensación de la sesión y la marca como completada. Alimenta la progresión.
  guardarFeedbackSesion(sesionId: number, feedback: FeedbackSesion): Promise<void>

  // --- Agua del día (se va sumando a lo largo del día) ---
  aguaDeFecha(fechaISO: string): Promise<number>
  // Suma (o resta, con delta negativo) ml al total del día y devuelve el total resultante.
  registrarAgua(fechaISO: string, deltaMl: number): Promise<number>

  // --- Progreso corporal ---
  registrarProgreso(progreso: NuevoProgreso): Promise<void>
  progresoEntre(desdeISO: string, hastaISO: string): Promise<RegistroProgreso[]>

  // --- Ajustes semanales del motor ---
  guardarAjuste(ajuste: AjusteSemanal, planId?: number): Promise<number>

  // --- Ajustes de la app ---
  ajustesApp(): Promise<AjustesApp>
  guardarAjustesApp(parcial: Partial<AjustesApp>): Promise<void>

  // --- RGPD: borrar todos mis datos ---
  borrarTodosMisDatos(): Promise<void>
}
