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
