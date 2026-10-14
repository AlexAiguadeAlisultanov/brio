import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { rutaAdaptar } from './rutas/adaptar'
import { rutaSalud } from './rutas/salud'

// Construye la app Express. No registra en logs ningún dato del sobre ni del cuerpo: solo
// la ruta y el estado. La clave de la API vive en el entorno, nunca aquí.
export function crearApp(): express.Express {
  const app = express()

  app.use(helmet())

  const origenes = (process.env.ORIGEN_PERMITIDO ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  app.use(
    cors({
      origin: (origen, cb) => {
        // Sin cabecera Origin (apps nativas, curl) se permite; con ella, solo la lista.
        if (!origen || origenes.length === 0 || origenes.includes(origen)) return cb(null, true)
        cb(null, false)
      },
      methods: ['GET', 'POST'],
    }),
  )

  app.use(express.json({ limit: '32kb' }))

  app.use(
    '/api/',
    rateLimit({
      windowMs: 60_000,
      limit: 30,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.use(rutaSalud)
  app.use(rutaAdaptar)

  return app
}
