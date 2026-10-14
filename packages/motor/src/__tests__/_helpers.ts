import type {
  Alergeno,
  Cribado,
  Equipo,
  Experiencia,
  NivelActividad,
  Objetivo,
  Patron,
  PatronDietetico,
  Perfil,
  Sexo,
  Zona,
} from '../tipos'

// PRNG con semilla fija (mulberry32). El motor nunca usa azar; los tests de propiedad sí
// necesitan generar combinaciones, pero de forma reproducible, jamás con Math.random.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function elegir<T>(rng: () => number, lista: readonly T[]): T {
  return lista[Math.floor(rng() * lista.length)] ?? lista[0]!
}

export function subconjunto<T>(rng: () => number, lista: readonly T[], probabilidad = 0.3): T[] {
  return lista.filter(() => rng() < probabilidad)
}

export function entero(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

const SEXOS: Sexo[] = ['hombre', 'mujer']
const OBJETIVOS: Objetivo[] = ['ganar_musculo', 'perder_grasa', 'mantenimiento', 'fuerza']
const ACTIVIDADES: NivelActividad[] = ['sedentario', 'ligero', 'moderado', 'activo', 'muy_activo']
const EXPERIENCIAS: Experiencia[] = ['principiante', 'intermedio', 'avanzado']
const EQUIPOS: Equipo[] = ['barra', 'mancuernas', 'maquina', 'polea', 'peso_corporal', 'bandas', 'kettlebell']
const ZONAS: Zona[] = ['rodilla', 'hombro', 'lumbar', 'codo', 'muneca', 'cadera', 'cuello', 'tobillo']
const ALERGENOS: Alergeno[] = ['gluten', 'lactosa', 'lacteos', 'huevo', 'frutos_secos', 'cacahuete', 'soja', 'pescado', 'marisco', 'sesamo', 'apio', 'mostaza', 'sulfitos', 'altramuces']
const DIETAS: PatronDietetico[] = ['omnivoro', 'vegetariano', 'vegano', 'sin_gluten', 'sin_lactosa', 'pescetariano', 'halal']
export const PATRONES: Patron[] = ['sentadilla', 'bisagra', 'empuje_horizontal', 'traccion_horizontal', 'empuje_vertical', 'traccion_vertical', 'core', 'aislado']

export { OBJETIVOS }

export function cribadoLimpio(): Cribado {
  return {
    problemaCorazon: false,
    dolorPecho: false,
    mareoDesmayo: false,
    problemaOseoArticular: false,
    tensionAlta: false,
    scoffVomitar: false,
    scoffPerderControl: false,
    scoffPerdido6kg3meses: false,
    scoffSeVeGordo: false,
    scoffComidaDomina: false,
    embarazoLactancia: false,
    enfermedadRenalHepatica: false,
    diabetes: false,
    enfermedadCardiovascular: false,
    medicamentos: [],
  }
}

// Perfil válido por defecto. Los tests lo parcheen con lo que necesiten.
export function perfilBase(sobre: Partial<Perfil> = {}): Perfil {
  return {
    sexo: 'hombre',
    edadAnios: 30,
    alturaCm: 178,
    pesoKg: 80,
    actividad: 'moderado',
    experiencia: 'intermedio',
    diasPorSemana: 4,
    duracionSesionMin: 60,
    equipo: ['barra', 'mancuernas', 'maquina', 'polea', 'peso_corporal'],
    lesiones: [],
    cribado: cribadoLimpio(),
    patronDietetico: ['omnivoro'],
    alergias: [],
    intolerancias: [],
    noGustaIds: [],
    comidasPorDia: 4,
    ...sobre,
  }
}

// Perfil aleatorio reproducible, con extremos y combinaciones raras para el fuzz.
export function perfilAleatorio(rng: () => number): Perfil {
  const cribado = cribadoLimpio()
  cribado.scoffVomitar = rng() < 0.08
  cribado.scoffPerderControl = rng() < 0.08
  cribado.scoffPerdido6kg3meses = rng() < 0.08
  cribado.scoffSeVeGordo = rng() < 0.08
  cribado.scoffComidaDomina = rng() < 0.08
  cribado.dolorPecho = rng() < 0.05
  cribado.problemaCorazon = rng() < 0.05
  cribado.mareoDesmayo = rng() < 0.05
  cribado.tensionAlta = rng() < 0.06
  cribado.enfermedadCardiovascular = rng() < 0.05
  cribado.enfermedadRenalHepatica = rng() < 0.05
  cribado.embarazoLactancia = rng() < 0.05
  cribado.medicamentos = subconjunto(rng, ['betabloqueante', 'insulina', 'antidiabetico_oral'] as const, 0.08)

  // Rangos que a veces caen fuera de lo válido, para disparar bloqueos.
  const edad = entero(rng, 12, 105)
  const altura = entero(rng, 110, 230)
  const peso = entero(rng, 25, 320)

  return {
    sexo: elegir(rng, SEXOS),
    edadAnios: edad,
    alturaCm: altura,
    pesoKg: peso,
    grasaPct: rng() < 0.5 ? entero(rng, 3, 65) : undefined,
    actividad: elegir(rng, ACTIVIDADES),
    experiencia: elegir(rng, EXPERIENCIAS),
    diasPorSemana: entero(rng, 0, 7),
    duracionSesionMin: entero(rng, 0, 120),
    equipo: (() => {
      const e = subconjunto(rng, EQUIPOS, 0.5)
      return e.length > 0 ? e : ['peso_corporal']
    })(),
    lesiones: subconjunto(rng, ZONAS, 0.15),
    cribado,
    patronDietetico: (() => {
      const d = subconjunto(rng, DIETAS, 0.2)
      return d.length > 0 ? d : ['omnivoro']
    })(),
    alergias: subconjunto(rng, ALERGENOS, 0.1),
    intolerancias: subconjunto(rng, ALERGENOS, 0.1),
    noGustaIds: [],
    comidasPorDia: entero(rng, 2, 7),
  }
}

export { ALERGENOS, DIETAS, EQUIPOS, ZONAS }
