// Fuente de verdad de tipos para el motor, la app y el proxy.
// Todo lo que se mueve entre capas pasa por aquí: si un tipo cambia, cambia en un solo sitio.

export type Sexo = 'hombre' | 'mujer'
export type Objetivo = 'ganar_musculo' | 'perder_grasa' | 'mantenimiento' | 'fuerza'
export type NivelActividad = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy_activo'
export type Experiencia = 'principiante' | 'intermedio' | 'avanzado'
export type Equipo = 'barra' | 'mancuernas' | 'maquina' | 'polea' | 'peso_corporal' | 'bandas' | 'kettlebell'
export type GrupoMuscular =
  | 'pecho' | 'espalda' | 'cuadriceps' | 'isquios' | 'gluteos'
  | 'hombro' | 'biceps' | 'triceps' | 'gemelos' | 'abdomen'
export type Patron =
  | 'sentadilla' | 'bisagra' | 'empuje_horizontal' | 'traccion_horizontal'
  | 'empuje_vertical' | 'traccion_vertical' | 'core' | 'aislado'
export type ModalidadRiesgo = 'carga_axial' | 'valsalva' | 'isometrico_intenso' | 'supino' | 'impacto'
export type Alergeno =
  | 'gluten' | 'lactosa' | 'lacteos' | 'huevo' | 'frutos_secos' | 'cacahuete'
  | 'soja' | 'pescado' | 'marisco' | 'sesamo' | 'apio' | 'mostaza' | 'sulfitos' | 'altramuces'
export type PatronDietetico =
  | 'omnivoro' | 'vegetariano' | 'vegano' | 'sin_gluten' | 'sin_lactosa' | 'pescetariano' | 'halal'
export type Zona = 'rodilla' | 'hombro' | 'lumbar' | 'codo' | 'muneca' | 'cadera' | 'cuello' | 'tobillo'
export type Medicamento =
  | 'betabloqueante' | 'insulina' | 'antidiabetico_oral' | 'corticoide'
  | 'diuretico' | 'tiroideo' | 'anticoagulante'
export type Locale = 'es' | 'ca' | 'en'

export interface Rango { min: number; max: number }
export interface Macros { kcal: number; proteinaG: number; grasaG: number; carbosG: number; fibraG: number }

// Respuestas de un cribado tipo PAR-Q + SCOFF + condiciones declaradas.
export interface Cribado {
  // PAR-Q (true = responde que sí, posible riesgo)
  problemaCorazon: boolean
  dolorPecho: boolean
  mareoDesmayo: boolean
  problemaOseoArticular: boolean
  tensionAlta: boolean
  // SCOFF (true = positivo); >=2 positivos => señal de TCA
  scoffVomitar: boolean
  scoffPerderControl: boolean
  scoffPerdido6kg3meses: boolean
  scoffSeVeGordo: boolean
  scoffComidaDomina: boolean
  // Condiciones declaradas
  embarazoLactancia: boolean
  enfermedadRenalHepatica: boolean
  diabetes: boolean
  enfermedadCardiovascular: boolean
  medicamentos: Medicamento[]
}

export interface Perfil {
  sexo: Sexo
  edadAnios: number
  alturaCm: number
  pesoKg: number
  grasaPct?: number
  actividad: NivelActividad
  experiencia: Experiencia
  diasPorSemana: number
  duracionSesionMin: number
  equipo: Equipo[]
  lesiones: Zona[]
  cribado: Cribado
  patronDietetico: PatronDietetico[]
  alergias: Alergeno[]
  intolerancias: Alergeno[]
  noGustaIds: string[] // ids del catálogo, NO texto libre
  comidasPorDia: number // 3..6
}

// --- Seguridad ---

export type Bandera =
  | 'menor_edad'
  | 'antropometria_invalida'
  | 'tca'
  | 'embarazo_lactancia'
  | 'parq_rojo'
  | 'renal_hepatica'
  | 'edad_avanzada'
  | 'suelo_sobre_tdee'
  | 'energia_disponible_baja'
  | 'recorte_kcal'
  | 'cardiovascular'
  | 'tension_alta'
  | 'betabloqueante'
  | 'insulina_antidiabetico'
  | 'bmr_estimado'

export type AvisoId =
  | 'derivar_pediatra'
  | 'datos_invalidos'
  | 'recursos_tca'
  | 'embarazo_consultar'
  | 'lactancia_necesidades'
  | 'parq_consultar_medico'
  | 'sin_maximas'
  | 'renal_proteina_limitada'
  | 'edad_fuerza_submaxima'
  | 'bmr_menos_fiable'
  | 'hipoglucemia_timing'
  | 'rpe_fc_no_fiable'
  | 'energia_disponible'
  | 'suelo_calorico'
  | 'deficit_recortado'
  | 'superavit_recortado'
  | 'hidratacion_entreno'
  | 'derivar_profesional'

export interface InformeSeguridad {
  bloquea: boolean // true => no se generan cifras ni rutina de carga
  motivoBloqueo?: 'menor_edad' | 'antropometria_invalida' | 'tca' | 'embarazo_lactancia' | 'par_q_rojo'
  objetivoEfectivo: Objetivo // puede forzarse a 'mantenimiento'
  ocultarCifras: boolean // TCA: no mostrar kcal/déficit/encuadre de adelgazar
  derivar: boolean
  banderas: Bandera[] // lista de banderas levantadas
  avisos: AvisoId[] // ids de aviso traducibles por la app
  modalidadesVetadas: ModalidadRiesgo[]
  recorteKcal: boolean
  topeProteinaGkg?: number // límite duro de proteína por patología (renal/hepática)
  sinMaximas: boolean // true => nunca %1RM ni test de máximas
}

// --- Energía ---

export type MetodoBmr = 'mifflin' | 'katch'

export interface Energia {
  bmr: number
  tdee: number
  kcalObjetivo: number
  metodo: MetodoBmr
  estimado: boolean // true cuando el BMR no se apoya en grasa medida
  factorActividad: number
  gastoEjercicioDiaKcal: number
  masaMagraKg: number
  energiaDisponible: number // EA = (kcal - gastoEjercicio) / masa magra
  sueloKcal: number // suelo calórico de seguridad aplicable a este perfil
}

// --- Plan ---

export interface Prescripcion {
  reps: Rango
  series: Rango
  rir: Rango
  descansoSegundos: number
  pct1RM?: Rango
  usaMaximas: boolean
}

export interface AlimentoEnComida {
  id: string
  gramos: number
  macros: Macros
}

export interface ComidaPlan {
  id: string // id estable del hueco dentro del plan, p. ej. 'comida_1'
  momento: string // etiqueta del momento del día
  porcentaje: number // % del total diario asignado al hueco
  objetivo: Macros // macros objetivo del hueco
  alimentos: AlimentoEnComida[]
}

export interface EjercicioPlan {
  id: string // id del ejercicio dentro del plan, p. ej. 'd1_e1'
  ejercicioId: string // id del catálogo
  grupo: GrupoMuscular
  patron: Patron
  series: number
  reps: Rango
  rir: Rango
  pct1RM?: Rango
}

export interface SesionPlan {
  id: string
  dia: number
  nombre: string
  grupos: GrupoMuscular[]
  ejercicios: EjercicioPlan[]
}

export interface EntrenamientoPlan {
  split: string
  diasPorSemana: number
  prescripcion: Prescripcion
  volumenPorGrupo: Partial<Record<GrupoMuscular, number>>
  sesiones: SesionPlan[]
}

export type EstadoPlan = 'completo' | 'orientacion' | 'bloqueado'

export interface Plan {
  version: string
  generadoISO?: string
  objetivoSolicitado: Objetivo
  objetivoEfectivo: Objetivo
  estado: EstadoPlan
  bloqueado: boolean
  ocultarCifras: boolean
  derivar: boolean
  seguridad: InformeSeguridad
  energia?: Energia
  macros?: Macros
  fibraG?: number
  hidratacionMl?: number
  comidas?: ComidaPlan[]
  entrenamiento?: EntrenamientoPlan
  avisos: AvisoId[]
}

// --- Sobres (único contrato que ve el LLM) ---

export interface SobreComida {
  id: string
  tipo: 'comida'
  momento: string
  kcal: Rango
  proteinaG: Rango
  carbosG: Rango
  grasaG: Rango
  excluidos: Alergeno[]
  dieta: PatronDietetico[]
  noGustaIds: string[]
  locale: Locale
  candidatos: string[]
}

export interface SobreEjercicio {
  id: string
  tipo: 'ejercicio'
  grupo: GrupoMuscular
  patron: Patron
  series: Rango
  reps: Rango
  rir: Rango
  equipoDisponible: Equipo[]
  contraindicados: Zona[]
  modalidadesVetadas: ModalidadRiesgo[]
  locale: Locale
  candidatos: string[]
}

// --- Sustitución (respaldo determinista) ---

export interface ItemComida {
  id: string
  gramos: number
  macros: Macros
}

export interface DeltaComida {
  kcalPct: number // desviación relativa de kcal respecto al centro del rango
  proteinaG: number // desviación absoluta en gramos
  carbosG: number
  grasaG: number
}

export interface SustitucionComida {
  vacio: boolean
  items: ItemComida[]
  macros: Macros
  aproximado: boolean
  delta?: DeltaComida
  mensajeId?: string
  derivar?: boolean
}

export interface SustitucionEjercicio {
  vacio: boolean
  ejercicioId?: string
  series?: number
  reps?: Rango
  rir?: Rango
  aproximado: boolean
  mensajeId?: string
  derivar?: boolean
}

// --- Propuestas del LLM y su validación ---

export interface PropuestaComidaItem {
  id: string
  gramos: number
}

export interface PropuestaComida {
  items: PropuestaComidaItem[]
}

export interface PropuestaEjercicio {
  ejercicioId: string
  series: number
  reps: number
}

export type MotivoValidacion =
  | 'id_desconocido'
  | 'alergeno'
  | 'intolerancia'
  | 'dieta'
  | 'no_gusta'
  | 'fuera_rango_kcal'
  | 'fuera_rango_proteina'
  | 'fuera_rango_carbos'
  | 'fuera_rango_grasa'
  | 'grupo_distinto'
  | 'patron_distinto'
  | 'equipo_no_disponible'
  | 'zona_contraindicada'
  | 'modalidad_vetada'
  | 'fuera_rango_series'
  | 'fuera_rango_reps'
  | 'propuesta_vacia'

export interface ResultadoValidacion {
  ok: boolean
  motivos: MotivoValidacion[]
}

// --- Check-in ---

export interface RegistroProgreso {
  fechaISO: string
  pesoKg: number
}

export type Confianza = 'baja' | 'media' | 'alta'

export interface AjusteSemanal {
  confianza: Confianza
  ritmoKgSemana: number // tendencia real (negativo = perdiendo peso)
  deltaKcal: number // corrección sugerida sobre la kcal actual
  kcalActual: number
  kcalNueva: number
  mensajeId?: string
  avisos: AvisoId[]
}
