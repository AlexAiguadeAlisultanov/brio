import { Router } from 'express'
import { z } from 'zod'
import {
  sustituirComidaDeterminista,
  sustituirEjercicioDeterminista,
  validarSustitucionComida,
  validarSustitucionEjercicio,
  type SobreComida,
  type SobreEjercicio,
} from '@brio/motor'
import { elegirConLlm, hayClave } from '../anthropic'
import { hayCupo, registrarLlamada } from '../circuito'

// POST /api/adaptar: el LLM elige un candidato ya válido del sobre; el motor calcula la
// porción y REVALIDA contra el mismo sobre. Si algo no cuadra, no hay clave, no hay cupo o
// el modelo falla, responde {fallback:true} para que la app use su respaldo determinista
// local. Nunca devuelve algo que viole una exclusión del sobre.

export const rutaAdaptar = Router()

const Rango = z.object({ min: z.number(), max: z.number() })

const SobreComidaZ = z.object({
  id: z.string(),
  tipo: z.literal('comida'),
  momento: z.string(),
  kcal: Rango,
  proteinaG: Rango,
  carbosG: Rango,
  grasaG: Rango,
  excluidos: z.array(z.string()),
  dieta: z.array(z.string()),
  noGustaIds: z.array(z.string()),
  locale: z.string(),
  candidatos: z.array(z.string()),
})

const SobreEjercicioZ = z.object({
  id: z.string(),
  tipo: z.literal('ejercicio'),
  grupo: z.string(),
  patron: z.string(),
  series: Rango,
  reps: Rango,
  rir: Rango,
  equipoDisponible: z.array(z.string()),
  contraindicados: z.array(z.string()),
  modalidadesVetadas: z.array(z.string()),
  locale: z.string(),
  candidatos: z.array(z.string()),
})

const Cuerpo = z.object({
  sobre: z.discriminatedUnion('tipo', [SobreComidaZ, SobreEjercicioZ]),
  idRechazado: z.string().optional(),
  motivoUsuario: z.string().optional(),
})

// Saneado contra inyección: una sola línea, longitud acotada. El texto del usuario no manda
// sobre el sistema, solo es una pista del motivo.
function sanear(texto: string | undefined): string | undefined {
  if (!texto) return undefined
  const limpio = texto.replace(/\s+/g, ' ').trim().slice(0, 120)
  return limpio.length > 0 ? limpio : undefined
}

rutaAdaptar.post('/api/adaptar', async (req, res) => {
  const parseo = Cuerpo.safeParse(req.body)
  if (!parseo.success) {
    res.status(400).json({ error: 'cuerpo_invalido' })
    return
  }
  const { sobre, idRechazado, motivoUsuario } = parseo.data

  // Sin clave o sin cupo diario: que la app use su motor local.
  if (!hayClave() || !hayCupo()) {
    res.status(503).json({ fallback: true, motivo: !hayClave() ? 'sin_clave' : 'sin_cupo' })
    return
  }

  registrarLlamada()
  const eleccion = await elegirConLlm({
    tipo: sobre.tipo,
    idRechazado: idRechazado ?? sobre.id,
    candidatos: sobre.candidatos,
    motivoUsuario: sanear(motivoUsuario),
  })
  if (!eleccion) {
    res.status(422).json({ fallback: true, motivo: 'sin_eleccion' })
    return
  }

  // La porción y la validación las hace el motor sobre un sobre con un único candidato: el
  // que eligió el LLM. Así el número nunca sale del modelo y la exclusión nunca se viola.
  if (sobre.tipo === 'comida') {
    const sobreUno = { ...(sobre as unknown as SobreComida), candidatos: [eleccion.eleccionId] }
    const sust = sustituirComidaDeterminista(sobreUno)
    if (sust.vacio) {
      res.status(422).json({ fallback: true, motivo: 'sin_candidatos' })
      return
    }
    const propuesta = { items: sust.items.map((i) => ({ id: i.id, gramos: i.gramos })) }
    const val = validarSustitucionComida(sobre as unknown as SobreComida, propuesta)
    if (!val.ok) {
      res.status(422).json({ fallback: true, motivo: 'no_valida', detalle: val.motivos })
      return
    }
    res.json({ fuente: 'llm', motivoId: eleccion.motivoId, sustitucion: sust })
    return
  }

  const sobreUno = { ...(sobre as unknown as SobreEjercicio), candidatos: [eleccion.eleccionId] }
  const sust = sustituirEjercicioDeterminista(sobreUno)
  if (sust.vacio || !sust.ejercicioId) {
    res.status(422).json({ fallback: true, motivo: 'sin_candidatos' })
    return
  }
  const repsRango = sust.reps ?? { min: 0, max: 0 }
  const propuesta = {
    ejercicioId: sust.ejercicioId,
    series: sust.series ?? 0,
    reps: Math.round((repsRango.min + repsRango.max) / 2),
  }
  const val = validarSustitucionEjercicio(sobre as unknown as SobreEjercicio, propuesta)
  if (!val.ok) {
    res.status(422).json({ fallback: true, motivo: 'no_valida', detalle: val.motivos })
    return
  }
  res.json({ fuente: 'llm', motivoId: eleccion.motivoId, sustitucion: sust })
})
