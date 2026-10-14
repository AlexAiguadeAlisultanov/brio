import type { AjusteSemanal, AvisoId, Confianza, Objetivo, Plan, RegistroProgreso } from './tipos'

// Revisión semanal: estima la tendencia real de peso suavizando el ruido, la compara con el
// ritmo objetivo y corrige la energía en pasos de 100-200 kcal respetando siempre los suelos.
// Determinista: el tiempo entra por las fechas del histórico, nunca por el reloj.

const PESO_MIN = 30
const PESO_MAX = 300
const SALTO_DIARIO_MAX = 2 // kg/día por encima de lo cual el dato se considera imposible
const TOLERANCIA_RITMO = 0.15 // kg/semana de margen antes de corregir

// Ritmo objetivo de peso (kg/semana) por objetivo.
const RITMO_OBJETIVO: Record<Objetivo, number> = {
  perder_grasa: -0.5,
  ganar_musculo: 0.25,
  fuerza: 0.1,
  mantenimiento: 0,
}

export interface Tendencia {
  ritmoKgSemana: number
  dias: number
  puntos: number
  valido: boolean
  mediaReciente: number
}

interface PuntoPeso {
  t: number // días desde el primer registro aceptado
  peso: number
}

// Descarta pesos fuera de rango fisiológico y saltos diarios imposibles antes de calcular nada.
function sanear(hist: RegistroProgreso[]): Array<{ fecha: number; peso: number }> {
  const parseados = hist
    .map((r) => ({ fecha: Date.parse(r.fechaISO), peso: r.pesoKg }))
    .filter((r) => Number.isFinite(r.fecha) && Number.isFinite(r.peso) && r.peso >= PESO_MIN && r.peso <= PESO_MAX)
    .sort((a, b) => a.fecha - b.fecha)

  const aceptados: Array<{ fecha: number; peso: number }> = []
  for (const r of parseados) {
    const prev = aceptados[aceptados.length - 1]
    if (prev) {
      const dias = (r.fecha - prev.fecha) / 86_400_000
      if (dias > 0 && Math.abs(r.peso - prev.peso) / dias > SALTO_DIARIO_MAX) continue
    }
    aceptados.push(r)
  }
  return aceptados
}

export function tendenciaPeso(hist: RegistroProgreso[]): Tendencia {
  const aceptados = sanear(hist)
  if (aceptados.length < 2) {
    const media = aceptados[0]?.peso ?? 0
    return { ritmoKgSemana: 0, dias: 0, puntos: aceptados.length, valido: false, mediaReciente: media }
  }

  const base = aceptados[0]!.fecha
  const puntos: PuntoPeso[] = aceptados.map((r) => ({ t: (r.fecha - base) / 86_400_000, peso: r.peso }))
  const dias = puntos[puntos.length - 1]!.t

  // Regresión lineal por mínimos cuadrados: pendiente en kg/día -> kg/semana.
  const n = puntos.length
  const sumT = puntos.reduce((s, p) => s + p.t, 0)
  const sumP = puntos.reduce((s, p) => s + p.peso, 0)
  const sumTP = puntos.reduce((s, p) => s + p.t * p.peso, 0)
  const sumTT = puntos.reduce((s, p) => s + p.t * p.t, 0)
  const denom = n * sumTT - sumT * sumT
  const pendiente = denom !== 0 ? (n * sumTP - sumT * sumP) / denom : 0

  // Media reciente suavizada: últimos hasta 7 puntos.
  const recientes = puntos.slice(-7)
  const mediaReciente = recientes.reduce((s, p) => s + p.peso, 0) / recientes.length

  return {
    ritmoKgSemana: pendiente * 7,
    dias,
    puntos: n,
    valido: dias > 0,
    mediaReciente,
  }
}

function confianzaDe(dias: number, puntos: number): Confianza {
  if (dias >= 28 && puntos >= 8) return 'alta'
  if (dias >= 14 && puntos >= 4) return 'media'
  return 'baja'
}

export function aplicarCheckIn(plan: Plan, historico: RegistroProgreso[]): AjusteSemanal {
  const avisos: AvisoId[] = []
  const tend = tendenciaPeso(historico)
  const confianza = confianzaDe(tend.dias, tend.puntos)
  const kcalActual = plan.energia?.kcalObjetivo ?? 0

  // Sin cifras que tocar (plan bloqueado, oculto o sin energía): no se ajusta nada.
  if (!plan.energia || plan.ocultarCifras || plan.bloqueado || kcalActual <= 0) {
    return {
      confianza: 'baja',
      ritmoKgSemana: tend.ritmoKgSemana,
      deltaKcal: 0,
      kcalActual,
      kcalNueva: kcalActual,
      avisos,
    }
  }

  const objetivoRitmo = RITMO_OBJETIVO[plan.objetivoEfectivo] ?? 0
  const diff = tend.ritmoKgSemana - objetivoRitmo

  // Con menos de ~2 semanas de datos, confianza baja y ajuste conservador (no se recorta).
  let delta = 0
  if (confianza !== 'baja' && Math.abs(diff) >= TOLERANCIA_RITMO) {
    const paso = confianza === 'alta' ? 200 : 150
    delta = diff > 0 ? -paso : paso
  }

  const suelo = plan.energia.sueloKcal
  const techo = plan.energia.tdee * 1.2
  let kcalNueva = Math.round(kcalActual + delta)
  if (kcalNueva < suelo) {
    kcalNueva = Math.round(suelo)
    if (!avisos.includes('suelo_calorico')) avisos.push('suelo_calorico')
  }
  if (kcalNueva > techo) kcalNueva = Math.round(techo)

  return {
    confianza,
    ritmoKgSemana: tend.ritmoKgSemana,
    deltaKcal: kcalNueva - kcalActual,
    kcalActual,
    kcalNueva,
    avisos,
  }
}
