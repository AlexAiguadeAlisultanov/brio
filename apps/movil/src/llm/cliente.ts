import Constants from 'expo-constants'
import type { SobreComida, SobreEjercicio, SustitucionComida, SustitucionEjercicio } from '@brio/motor'

// Cliente del proxy. Habla con /api/adaptar con un timeout corto. Nunca lanza: si el proxy
// no responde, tarda o devuelve fallback, resuelve a null y la app usa su motor local.

const TIMEOUT_MS = 4000

export function urlApi(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string }
  return extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? ''
}

export interface RespuestaAdaptar<T> {
  sustitucion: T
  motivoId: string
}

async function pedir(ruta: string, cuerpo: unknown): Promise<unknown | null> {
  const base = urlApi()
  if (!base) return null
  const control = new AbortController()
  const t = setTimeout(() => control.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${base}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: control.signal,
    })
    if (!res.ok) return null
    const json = (await res.json()) as { fallback?: boolean }
    if (json?.fallback) return null
    return json
  } catch {
    // Timeout, sin red, error de parseo: que decida el respaldo local.
    return null
  } finally {
    clearTimeout(t)
  }
}

export async function adaptarComidaRemoto(
  sobre: SobreComida,
  idRechazado: string,
  motivoUsuario?: string,
): Promise<RespuestaAdaptar<SustitucionComida> | null> {
  const r = (await pedir('/api/adaptar', { sobre, idRechazado, motivoUsuario })) as {
    fuente?: string
    motivoId?: string
    sustitucion?: SustitucionComida
  } | null
  if (!r?.sustitucion || !r.motivoId) return null
  return { sustitucion: r.sustitucion, motivoId: r.motivoId }
}

export async function adaptarEjercicioRemoto(
  sobre: SobreEjercicio,
  idRechazado: string,
  motivoUsuario?: string,
): Promise<RespuestaAdaptar<SustitucionEjercicio> | null> {
  const r = (await pedir('/api/adaptar', { sobre, idRechazado, motivoUsuario })) as {
    fuente?: string
    motivoId?: string
    sustitucion?: SustitucionEjercicio
  } | null
  if (!r?.sustitucion || !r.motivoId) return null
  return { sustitucion: r.sustitucion, motivoId: r.motivoId }
}

export async function proxyDisponible(): Promise<boolean> {
  const base = urlApi()
  if (!base) return false
  const control = new AbortController()
  const t = setTimeout(() => control.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${base}/api/salud`, { signal: control.signal })
    if (!res.ok) return false
    const json = (await res.json()) as { llm?: boolean }
    return Boolean(json?.llm)
  } catch {
    return false
  } finally {
    clearTimeout(t)
  }
}
