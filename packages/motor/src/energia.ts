import type { NivelActividad, Objetivo, Perfil, Sexo } from './tipos'

// Toda la aritmética energética del motor. Funciones puras y deterministas: ni azar ni
// reloj. Los valores siguen fórmulas estándar (Mifflin-St Jeor, Katch-McArdle, Deurenberg).

export const FACTORES_ACTIVIDAD: Record<NivelActividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
}

// Ajuste calórico por objetivo, como fracción del TDEE.
export const AJUSTE_OBJETIVO: Record<Objetivo, number> = {
  perder_grasa: -0.2,
  ganar_musculo: 0.1,
  mantenimiento: 0,
  fuerza: 0.05,
}

// MET aproximado del entrenamiento de fuerza.
const MET_FUERZA = 5

export function imc(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100
  if (alturaM <= 0) return 0
  return pesoKg / (alturaM * alturaM)
}

// Grasa corporal estimada por Deurenberg a partir de IMC, edad y sexo.
export function estimarGrasaDeurenberg(pesoKg: number, alturaCm: number, edadAnios: number, sexo: Sexo): number {
  const sexoM = sexo === 'hombre' ? 1 : 0
  return 1.2 * imc(pesoKg, alturaCm) + 0.23 * edadAnios - 10.8 * sexoM - 5.4
}

export function grasaPlausible(grasaPct: number | undefined): grasaPct is number {
  return typeof grasaPct === 'number' && Number.isFinite(grasaPct) && grasaPct >= 5 && grasaPct <= 60
}

// Masa magra. Usa la grasa medida si es plausible; si no, la estima por Deurenberg.
export function masaMagra(perfil: Perfil): number {
  const grasa = grasaPlausible(perfil.grasaPct)
    ? perfil.grasaPct
    : estimarGrasaDeurenberg(perfil.pesoKg, perfil.alturaCm, perfil.edadAnios, perfil.sexo)
  // La estimación puede salirse de rango con datos raros: la acotamos a un margen fisiológico.
  const grasaAcotada = Math.min(Math.max(grasa, 3), 70)
  return perfil.pesoKg * (1 - grasaAcotada / 100)
}

export interface ResultadoBmr {
  bmr: number
  metodo: 'mifflin' | 'katch'
  estimado: boolean
}

export function bmrMifflin(pesoKg: number, alturaCm: number, edadAnios: number, sexo: Sexo): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * edadAnios
  return sexo === 'hombre' ? base + 5 : base - 161
}

export function bmrKatchMcArdle(masaMagraKg: number): number {
  return 370 + 21.6 * masaMagraKg
}

// Usa Katch-McArdle solo si hay grasa medida plausible; si no, Mifflin y marca `estimado`.
export function calcularBmr(perfil: Perfil): ResultadoBmr {
  if (grasaPlausible(perfil.grasaPct)) {
    const lbm = perfil.pesoKg * (1 - perfil.grasaPct / 100)
    return { bmr: bmrKatchMcArdle(lbm), metodo: 'katch', estimado: false }
  }
  return {
    bmr: bmrMifflin(perfil.pesoKg, perfil.alturaCm, perfil.edadAnios, perfil.sexo),
    metodo: 'mifflin',
    estimado: true,
  }
}

export function factorActividad(actividad: NivelActividad): number {
  return FACTORES_ACTIVIDAD[actividad] ?? 1.2
}

export function calcularTDEE(bmr: number, actividad: NivelActividad): number {
  return bmr * factorActividad(actividad)
}

// Energía objetivo cruda, antes de pasar por los límites de seguridad.
export function kcalObjetivoCrudo(tdee: number, objetivo: Objetivo): number {
  const ajuste = AJUSTE_OBJETIVO[objetivo] ?? 0
  return tdee * (1 + ajuste)
}

// Gasto del entrenamiento prorrateado a día, para alimentar la energía disponible.
// kcal/sesión = MET * 3.5 * pesoKg / 200 * duracionMin; día = sesión * dias / 7.
export function gastoEjercicioKcal(perfil: Perfil): number {
  const dias = clampDias(perfil.diasPorSemana)
  const duracion = Number.isFinite(perfil.duracionSesionMin) ? Math.max(0, perfil.duracionSesionMin) : 0
  const peso = Number.isFinite(perfil.pesoKg) && perfil.pesoKg > 0 ? perfil.pesoKg : 70
  const porSesion = (MET_FUERZA * 3.5 * peso) / 200 * duracion
  return (porSesion * dias) / 7
}

function clampDias(dias: number): number {
  if (!Number.isFinite(dias)) return 0
  return Math.min(Math.max(Math.round(dias), 0), 7)
}
