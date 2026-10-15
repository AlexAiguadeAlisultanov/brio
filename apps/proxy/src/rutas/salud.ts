import { Router } from 'express'
import { estadoCircuito } from '../circuito'
import { hayClave, MODELO_LLM } from '../anthropic'
import { hayStripe } from '../stripe'

// Dice si el backend puede adaptar con el LLM y si el pago está configurado. La app lo
// consulta para saber si merece la pena intentar la ruta online o ir directa a su respaldo
// local, y para mostrar (o no) el botón de hacerse premium.
export const rutaSalud = Router()

rutaSalud.get('/api/salud', (_req, res) => {
  res.json({
    ok: true,
    llm: hayClave(),
    modelo: hayClave() ? MODELO_LLM : null,
    pago: hayStripe(),
    circuito: estadoCircuito(),
  })
})
