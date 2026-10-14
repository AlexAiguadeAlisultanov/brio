import {
  sustituirComidaDeterminista,
  sustituirEjercicioDeterminista,
  validarSustitucionComida,
  validarSustitucionEjercicio,
  type SobreComida,
  type SobreEjercicio,
  type SustitucionComida,
  type SustitucionEjercicio,
} from '@brio/motor'
import { adaptarComidaRemoto, adaptarEjercicioRemoto, urlApi } from './cliente'

// Orquesta la sustitución: el motor local es siempre la red de seguridad. Si hay
// consentimiento del usuario y proxy configurado, se intenta la adaptación por IA, pero la
// propuesta se REVALIDA localmente con el mismo motor antes de aplicarla (defensa en
// profundidad: nunca se confía a ciegas en el servidor). Si algo falla, se usa el motor
// local. El `origen` alimenta el indicador de la interfaz.

export type Origen = 'motor' | 'llm' | 'offline'

export interface ResultadoComida {
  sustitucion: SustitucionComida
  origen: Origen
  motivoId?: string
}
export interface ResultadoEjercicio {
  sustitucion: SustitucionEjercicio
  origen: Origen
  motivoId?: string
}

export interface OpcionesAdaptar {
  consentimientoLlm: boolean
  idRechazado: string
  motivoUsuario?: string
}

export async function adaptarComida(sobre: SobreComida, op: OpcionesAdaptar): Promise<ResultadoComida> {
  const local = (origen: Origen): ResultadoComida => ({ sustitucion: sustituirComidaDeterminista(sobre), origen })

  // Sin consentimiento o sin proxy configurado: motor local, sin salir del dispositivo.
  if (!op.consentimientoLlm || !urlApi()) return local('motor')

  const remoto = await adaptarComidaRemoto(sobre, op.idRechazado, op.motivoUsuario)
  if (!remoto) return local('offline') // se intentó, pero no hubo respuesta útil

  // Revalidación local: la propuesta tiene que pasar el mismo sobre.
  const propuesta = { items: remoto.sustitucion.items.map((i) => ({ id: i.id, gramos: i.gramos })) }
  const val = validarSustitucionComida(sobre, propuesta)
  if (!val.ok || remoto.sustitucion.vacio) return local('motor')

  return { sustitucion: remoto.sustitucion, origen: 'llm', motivoId: remoto.motivoId }
}

export async function adaptarEjercicio(sobre: SobreEjercicio, op: OpcionesAdaptar): Promise<ResultadoEjercicio> {
  const local = (origen: Origen): ResultadoEjercicio => ({
    sustitucion: sustituirEjercicioDeterminista(sobre),
    origen,
  })

  if (!op.consentimientoLlm || !urlApi()) return local('motor')

  const remoto = await adaptarEjercicioRemoto(sobre, op.idRechazado, op.motivoUsuario)
  if (!remoto || remoto.sustitucion.vacio || !remoto.sustitucion.ejercicioId) return local('offline')

  const reps = remoto.sustitucion.reps ?? { min: 0, max: 0 }
  const propuesta = {
    ejercicioId: remoto.sustitucion.ejercicioId,
    series: remoto.sustitucion.series ?? 0,
    reps: Math.round((reps.min + reps.max) / 2),
  }
  const val = validarSustitucionEjercicio(sobre, propuesta)
  if (!val.ok) return local('motor')

  return { sustitucion: remoto.sustitucion, origen: 'llm', motivoId: remoto.motivoId }
}
