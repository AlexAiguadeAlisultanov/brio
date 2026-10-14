import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// El LLM solo ELIGE un candidato ya válido del sobre y da un código de motivo de un
// conjunto cerrado. Nunca escribe prosa libre al usuario ni calcula números: el texto lo
// pone la app con plantillas traducidas y la porción la calcula el motor. Así una respuesta
// del modelo no puede dar un consejo inseguro ni meter cifras inventadas.

export const MOTIVOS = [
  'equivalente',
  'mas_ligero',
  'mas_proteina',
  'variedad',
  'preferencia',
  'sin_material',
  'evita_lesion',
] as const
export type Motivo = (typeof MOTIVOS)[number]

const MODELO = process.env.MODELO_LLM ?? 'claude-opus-5-5'

let cliente: Anthropic | null = null
function obtenerCliente(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!cliente) cliente = new Anthropic()
  return cliente
}

export function hayClave(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

const EsquemaEleccion = z.object({
  eleccionId: z.string(),
  motivoId: z.enum(MOTIVOS),
})
export type Eleccion = z.infer<typeof EsquemaEleccion>

interface EntradaEleccion {
  tipo: 'comida' | 'ejercicio'
  idRechazado: string
  candidatos: string[]
  // Pista opcional del motivo del usuario (puntual o permanente), ya saneada por la ruta.
  motivoUsuario?: string
}

// Extrae el primer objeto JSON del texto de la respuesta, tolerando que venga envuelto.
function extraerJson(texto: string): unknown {
  const directo = texto.trim()
  try {
    return JSON.parse(directo)
  } catch {
    const inicio = directo.indexOf('{')
    const fin = directo.lastIndexOf('}')
    if (inicio >= 0 && fin > inicio) {
      try {
        return JSON.parse(directo.slice(inicio, fin + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

// Pide al modelo que elija el mejor sustituto entre los candidatos. Devuelve null si no hay
// clave, si la respuesta no valida o si la elección no está entre los candidatos: en todos
// esos casos la app usará su respaldo determinista local.
export async function elegirConLlm(entrada: EntradaEleccion): Promise<Eleccion | null> {
  const api = obtenerCliente()
  if (!api) return null
  if (entrada.candidatos.length === 0) return null

  const sistema =
    'Eres un asistente que SOLO elige una alternativa de una lista cerrada ya validada. ' +
    'No calculas calorías, macros, series ni repeticiones. No das consejos de salud ni ' +
    'texto libre. Elige la opción más parecida y variada que respete lo que pide la persona. ' +
    'Responde ÚNICAMENTE con un objeto JSON, sin texto alrededor, con esta forma exacta: ' +
    '{"eleccionId": "<uno de los ids de la lista>", "motivoId": "<uno de: ' +
    MOTIVOS.join(', ') +
    '>"}.'

  const motivoUsuario = entrada.motivoUsuario ? `\nMotivo de la persona: ${entrada.motivoUsuario}` : ''
  const usuario =
    `Tipo de cambio: ${entrada.tipo}.\n` +
    `Elemento que se sustituye: ${entrada.idRechazado}.\n` +
    `Candidatos válidos (elige exactamente uno de estos ids): ${entrada.candidatos.join(', ')}.` +
    motivoUsuario

  try {
    const respuesta = await api.messages.create({
      model: MODELO,
      max_tokens: 2048,
      system: sistema,
      messages: [{ role: 'user', content: usuario }],
    })
    if (respuesta.stop_reason === 'refusal') return null
    const bloque = respuesta.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    if (!bloque) return null
    const crudo = extraerJson(bloque.text)
    const val = EsquemaEleccion.safeParse(crudo)
    if (!val.success) return null
    // Defensa: la elección tiene que ser uno de los candidatos que le dimos.
    if (!entrada.candidatos.includes(val.data.eleccionId)) return null
    return val.data
  } catch {
    // Timeout, error de red, 4xx/5xx: que la app caiga a su motor local.
    return null
  }
}

export { MODELO as MODELO_LLM }
