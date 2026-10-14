import type { RegistroProgreso } from '@brio/motor'

// Peso: validación de entrada y serie de tendencia suavizada para el gráfico. El titular (ritmo
// de kg por semana, confianza) sale del motor con `tendenciaPeso`; esta serie es solo la línea
// que se dibuja, suavizada para no pintar los pesos sueltos del día a día. Los límites y el
// descarte de saltos imposibles son los mismos que usa el motor, así que gráfico y titular
// hablan siempre de los mismos datos.

export const PESO_MIN_KG = 30
export const PESO_MAX_KG = 300
const SALTO_DIARIO_MAX = 2 // kg/día por encima de lo cual el dato se considera imposible

// ¿Es un peso que tiene sentido guardar? Rechaza lo imposible antes de que llegue a la base.
export function pesoPlausible(kg: number): boolean {
  return Number.isFinite(kg) && kg >= PESO_MIN_KG && kg <= PESO_MAX_KG
}

export interface PuntoTendencia {
  fechaISO: string
  pesoKg: number
}

// Deja fuera pesos fuera de rango y saltos diarios imposibles, igual que el saneado del motor.
function aceptar(hist: RegistroProgreso[]): RegistroProgreso[] {
  const ordenado = hist
    .filter((r) => pesoPlausible(r.pesoKg) && !Number.isNaN(Date.parse(r.fechaISO)))
    .slice()
    .sort((a, b) => a.fechaISO.localeCompare(b.fechaISO))

  const aceptados: RegistroProgreso[] = []
  for (const registro of ordenado) {
    const previo = aceptados[aceptados.length - 1]
    if (previo) {
      const dias = (Date.parse(registro.fechaISO) - Date.parse(previo.fechaISO)) / 86_400_000
      if (dias > 0 && Math.abs(registro.pesoKg - previo.pesoKg) / dias > SALTO_DIARIO_MAX) continue
    }
    aceptados.push(registro)
  }
  return aceptados
}

// Media móvil exponencial sobre los pesos aceptados. Suaviza el ruido sin inventar nada: cada
// punto pesa el anterior para que la línea no bote con una comida salada o una mala noche.
export function serieTendencia(hist: RegistroProgreso[], alfa = 0.3): PuntoTendencia[] {
  const aceptados = aceptar(hist)
  const serie: PuntoTendencia[] = []
  let media = 0
  aceptados.forEach((registro, i) => {
    media = i === 0 ? registro.pesoKg : alfa * registro.pesoKg + (1 - alfa) * media
    serie.push({ fechaISO: registro.fechaISO, pesoKg: Math.round(media * 10) / 10 })
  })
  return serie
}
