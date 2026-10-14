import { estimarGrasaDeurenberg, grasaPlausible } from './energia'
import type { Macros, Objetivo, Perfil } from './tipos'

// Reparto de macronutrientes en orden fijo e invariable: proteína -> grasa (suelo de
// seguridad) -> carbohidratos con la energía restante. Determinista y redondeado a entero.

// Proteína objetivo (g por kg de la base elegida) según el objetivo. Valores dentro de los
// rangos de la especificación; se toma uno fijo para que la salida sea determinista.
const PROTEINA_GKG: Record<Objetivo, number> = {
  fuerza: 2.0,
  ganar_musculo: 2.0,
  perder_grasa: 2.2,
  mantenimiento: 1.7,
}

const CLAMP_PROTEINA = { min: 1.2, max: 3.1 } as const
const UMBRAL_GRASA_ALTA = { hombre: 25, mujer: 32 } as const

export interface BaseProteina {
  base: number // kg sobre los que se calcula la proteína
  usaMasaMagra: boolean
}

// Decide sobre qué peso se calcula la proteína: masa magra si la grasa es alta (medida o
// estimada), peso ajustado si no hay grasa medida, peso corporal en el resto de casos.
export function baseProteina(perfil: Perfil): BaseProteina {
  const umbral = UMBRAL_GRASA_ALTA[perfil.sexo] ?? UMBRAL_GRASA_ALTA.mujer
  if (grasaPlausible(perfil.grasaPct)) {
    const alto = perfil.grasaPct > umbral
    const lbm = perfil.pesoKg * (1 - perfil.grasaPct / 100)
    return alto ? { base: lbm, usaMasaMagra: true } : { base: perfil.pesoKg, usaMasaMagra: false }
  }
  // Sin grasa medida: peso ajustado a partir de la grasa estimada por Deurenberg.
  const grasaEst = Math.min(Math.max(estimarGrasaDeurenberg(perfil.pesoKg, perfil.alturaCm, perfil.edadAnios, perfil.sexo), 3), 70)
  const alto = grasaEst > umbral
  const lbmEst = perfil.pesoKg * (1 - grasaEst / 100)
  return alto ? { base: lbmEst, usaMasaMagra: true } : { base: perfil.pesoKg, usaMasaMagra: false }
}

export function fibraObjetivo(kcal: number): number {
  return Math.round((14 * kcal) / 1000)
}

// Hidratación base por día de entreno: 35 ml/kg + 500 ml por hora de sesión.
export function hidratacionMl(perfil: Perfil): number {
  const peso = perfil.pesoKg > 0 ? perfil.pesoKg : 70
  const horas = Math.max(0, perfil.duracionSesionMin) / 60
  return Math.round(35 * peso + 500 * horas)
}

export function calcularMacros(
  perfil: Perfil,
  kcalObjetivo: number,
  objetivoEfectivo: Objetivo,
  topeProteinaGkg?: number,
): Macros {
  const kcal = Math.round(kcalObjetivo)
  const { base } = baseProteina(perfil)

  // Proteína: objetivo por g/kg, con tope por patología y clamp duro final.
  let gkg = PROTEINA_GKG[objetivoEfectivo] ?? PROTEINA_GKG.mantenimiento
  if (typeof topeProteinaGkg === 'number') gkg = Math.min(gkg, topeProteinaGkg)
  let proteinaG = gkg * base
  const protMin = CLAMP_PROTEINA.min * base
  const protMax = CLAMP_PROTEINA.max * base
  proteinaG = Math.min(Math.max(proteinaG, protMin), protMax)

  // Grasa como suelo de seguridad; puede bajar hasta 0.5 g/kg para dejar sitio a los carbos.
  const grasaMin = 0.5 * perfil.pesoKg
  let grasaG = Math.max(grasaMin, (0.2 * kcal) / 9)

  // Carbohidratos con la energía restante, nunca negativos. Si no cuadra, baja la grasa hasta
  // su mínimo y, solo si aún no cabe, recorta la proteína hasta su suelo (1.2 g/kg).
  if (4 * proteinaG + 9 * grasaG > kcal) {
    const grasaParaCarbosCero = (kcal - 4 * proteinaG) / 9
    grasaG = Math.max(grasaMin, grasaParaCarbosCero)
    if (4 * proteinaG + 9 * grasaG > kcal) {
      grasaG = grasaMin
      const protParaCarbosCero = (kcal - 9 * grasaG) / 4
      proteinaG = Math.max(protMin, Math.min(proteinaG, protParaCarbosCero))
    }
  }

  const carbosG = Math.max(0, (kcal - 4 * proteinaG - 9 * grasaG) / 4)

  return {
    kcal,
    proteinaG: Math.round(proteinaG),
    grasaG: Math.round(grasaG),
    carbosG: Math.round(carbosG),
    fibraG: fibraObjetivo(kcal),
  }
}

// Comprueba el cuadre energético 4*prot + 9*grasa + 4*carbs ~= kcal con tolerancia relativa.
export function cuadra(m: Macros, tolerancia = 0.02): boolean {
  if (m.kcal <= 0) return true
  const calculado = 4 * m.proteinaG + 9 * m.grasaG + 4 * m.carbosG
  return Math.abs(calculado - m.kcal) <= m.kcal * tolerancia + 10
}
