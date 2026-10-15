import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { rutaAdaptar } from './rutas/adaptar'
import { rutaCuentas } from './rutas/cuentas'
import { manejarWebhook, rutaPago } from './rutas/pago'
import { rutaSalud } from './rutas/salud'

// Construye la app Express. No registra en logs ningún dato de cuentas ni de pagos: solo la
// ruta y el estado. Las claves (Claude y Stripe) viven en el entorno, nunca aquí.
export function crearApp(): express.Express {
  const app = express()

  // Detrás de un proxy (Render, y cualquier PaaS) la IP real llega en X-Forwarded-For. Sin
  // esto, express-rate-limit lanza un ValidationError y no identifica bien a cada cliente.
  // Confiamos en un salto (el balanceador del hosting), no en toda la cadena.
  app.set('trust proxy', 1)

  app.use(helmet())

  const origenes = (process.env.ORIGEN_PERMITIDO ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  app.use(
    cors({
      origin: (origen, cb) => {
        // Sin cabecera Origin (apps nativas, curl, webhooks) se permite; con ella, solo la lista.
        if (!origen || origenes.length === 0 || origenes.includes(origen)) return cb(null, true)
        cb(null, false)
      },
      methods: ['GET', 'POST'],
    }),
  )

  // El webhook de Stripe necesita el cuerpo CRUDO para verificar la firma, así que se monta
  // ANTES del parser JSON y antes del rate-limit (Stripe puede reintentar en ráfagas).
  app.post('/api/pago/webhook', express.raw({ type: 'application/json' }), manejarWebhook)

  app.use(express.json({ limit: '32kb' }))

  // Rate-limit general del API. Configurable para no estorbar en los tests.
  const limiteApi = Number(process.env.LIMITE_API ?? 60)
  app.use(
    '/api/',
    rateLimit({
      windowMs: 60_000,
      limit: limiteApi,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  // Rate-limit más estricto en registro y acceso para frenar la fuerza bruta de contraseñas.
  const limiteAuth = Number(process.env.LIMITE_AUTH ?? 10)
  app.use(
    ['/api/registro', '/api/acceso'],
    rateLimit({
      windowMs: 15 * 60_000,
      limit: limiteAuth,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.use(rutaSalud)
  app.use(rutaCuentas)
  app.use(rutaPago)
  app.use(rutaAdaptar)

  return app
}
