import { Router } from 'express'
import { estadoCircuito } from '../circuito'
import { hayClave, MODELO_LLM } from '../anthropic'

// Dice si el proxy puede adaptar con el LLM. La app lo consulta para saber si merece la
// pena intentar la ruta online o ir directa a su respaldo local.
export const rutaSalud = Router()

rutaSalud.get('/api/salud', (_req, res) => {
  res.json({
    ok: true,
    llm: hayClave(),
    modelo: hayClave() ? MODELO_LLM : null,
    circuito: estadoCircuito(),
  })
})
