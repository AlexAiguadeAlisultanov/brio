import { Router, type Request, type Response } from 'express'
import type Stripe from 'stripe'
import { z } from 'zod'
import { requiereAuth } from '../auth'
import {
  fijarPremium,
  guardarCustomer,
  guardarSuscripcion,
  obtenerUsuarioPorCustomer,
  obtenerUsuarioPorId,
  type Usuario,
} from '../db'
import { DIAS_PASE, MONEDA, PRECIO_CENTIMOS, hayStripe, obtenerStripe } from '../stripe'

// Pagos con Stripe en modo pruebas. Dos caminos, porque Bizum NO admite cobros recurrentes:
//   - 'suscripcion': 4,99 €/mes con tarjeta (mode subscription).
//   - 'pase':        pago único con tarjeta o Bizum, da 30 días de premium (mode payment).
// La clave vive solo en el servidor. Sin clave, /checkout responde 503 {sinPago:true}.
// Nunca se registran en logs datos sensibles del pago.

export const rutaPago = Router()

const CuerpoCheckout = z.object({ modo: z.enum(['suscripcion', 'pase']) })

// Los métodos de pago (tarjeta para la suscripción; tarjeta y Bizum para el pase) se
// gestionan desde el Dashboard de Stripe (dynamic payment methods). La API ya no acepta
// payment_method_types al crear la sesión: Checkout ofrece los métodos activados que encajen
// con el modo (en 'subscription' solo los recurrentes como tarjeta; en 'payment' también
// Bizum si está activado para euros).

// Fecha ISO de dentro de N días.
function dentroDeDias(dias: number): string {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString()
}

// Garantiza que el usuario tenga un cliente de Stripe; crea uno si hace falta y lo guarda.
async function asegurarCliente(stripe: Stripe, usuarioId: string, email: string): Promise<string> {
  const usuario = await obtenerUsuarioPorId(usuarioId)
  if (usuario?.stripe_customer_id) return usuario.stripe_customer_id
  const cliente = await stripe.customers.create({ email, metadata: { usuarioId } })
  await guardarCustomer(usuarioId, cliente.id)
  return cliente.id
}

rutaPago.post('/api/pago/checkout', requiereAuth, async (req, res) => {
  const stripe = obtenerStripe()
  if (!hayStripe() || !stripe) {
    // La demo funciona sin pagos: lo decimos con elegancia, no es un error del cliente.
    res.status(503).json({ sinPago: true })
    return
  }

  const parseo = CuerpoCheckout.safeParse(req.body)
  if (!parseo.success) {
    res.status(400).json({ error: 'modo_invalido' })
    return
  }
  const { modo } = parseo.data
  const usuario = req.usuario!

  const exito = process.env.URL_EXITO ?? 'https://example.com/pago/ok'
  const cancelar = process.env.URL_CANCELAR ?? 'https://example.com/pago/cancelado'

  try {
    const customer = await asegurarCliente(stripe, usuario.id, usuario.email)

    if (modo === 'suscripcion') {
      // Mensual con tarjeta. Si hay STRIPE_PRICE_ID lo usamos; si no, construimos el precio.
      const precioId = process.env.STRIPE_PRICE_ID
      const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = precioId
        ? { price: precioId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: MONEDA,
              unit_amount: PRECIO_CENTIMOS,
              recurring: { interval: 'month' },
              product_data: { name: 'Brío Premium (mensual)' },
            },
          }
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        customer,
        line_items: [lineItem],
        success_url: exito,
        cancel_url: cancelar,
        metadata: { usuarioId: usuario.id, modo },
      }
      const sesion = await stripe.checkout.sessions.create(params)
      res.json({ url: sesion.url })
      return
    }

    // Pase de un solo pago: tarjeta o Bizum. Da 30 días de premium al completarse.
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      customer,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: MONEDA,
            unit_amount: PRECIO_CENTIMOS,
            product_data: { name: `Brío Premium (pase ${DIAS_PASE} días)` },
          },
        },
      ],
      success_url: exito,
      cancel_url: cancelar,
      metadata: { usuarioId: usuario.id, modo },
    }
    const sesion = await stripe.checkout.sessions.create(params)
    res.json({ url: sesion.url })
  } catch {
    // No filtramos el detalle del error de Stripe al cliente ni al log.
    res.status(502).json({ error: 'pago_no_disponible' })
  }
})

// Abre el portal de cliente de Stripe para que el usuario gestione o cancele su suscripción.
// Al cancelar, el webhook customer.subscription.deleted le quita el premium. Requiere tener
// configurado el Customer Portal en el Dashboard de Stripe (una vez).
rutaPago.post('/api/pago/portal', requiereAuth, async (req, res) => {
  const stripe = obtenerStripe()
  if (!hayStripe() || !stripe) {
    res.status(503).json({ sinPago: true })
    return
  }
  const registro = await obtenerUsuarioPorId(req.usuario!.id)
  if (!registro?.stripe_customer_id) {
    res.status(409).json({ error: 'sin_cliente' })
    return
  }
  const retorno = process.env.URL_EXITO ?? 'https://example.com/perfil'
  try {
    const sesion = await stripe.billingPortal.sessions.create({
      customer: registro.stripe_customer_id,
      return_url: retorno,
    })
    res.json({ url: sesion.url })
  } catch {
    res.status(502).json({ error: 'portal_no_disponible' })
  }
})

// Extrae un id de un campo de Stripe que puede venir como string o como objeto expandido.
function idDe(valor: string | { id: string } | null | undefined): string | null {
  if (!valor) return null
  return typeof valor === 'string' ? valor : valor.id
}

// Localiza al usuario de un evento por el id de cliente o, si no, por la metadata.
async function usuarioDeEvento(customerId: string | null, usuarioId: string | null): Promise<Usuario | null> {
  if (customerId) {
    const porCliente = await obtenerUsuarioPorCustomer(customerId)
    if (porCliente) return porCliente
  }
  if (usuarioId) return obtenerUsuarioPorId(usuarioId)
  return null
}

// Pasa un instante unix (segundos) de Stripe a ISO, o null si no viene.
function isoDeUnix(segundos: number | null | undefined): string | null {
  if (!segundos) return null
  return new Date(segundos * 1000).toISOString()
}

// Maneja el webhook de Stripe. Se monta con express.raw (cuerpo crudo) SOLO en esta ruta,
// porque la verificación de la firma necesita los bytes exactos. Nunca registra el cuerpo.
export async function manejarWebhook(req: Request, res: Response): Promise<void> {
  const stripe = obtenerStripe()
  const secreto = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secreto) {
    res.status(503).json({ sinPago: true })
    return
  }

  const firma = req.get('stripe-signature')
  let evento: Stripe.Event
  try {
    // req.body es un Buffer gracias a express.raw en esta ruta.
    evento = stripe.webhooks.constructEvent(req.body as Buffer, firma ?? '', secreto)
  } catch {
    // Firma inválida o ausente: no procesamos nada.
    res.status(400).json({ error: 'firma_invalida' })
    return
  }

  try {
    switch (evento.type) {
      case 'checkout.session.completed': {
        const sesion = evento.data.object as Stripe.Checkout.Session
        const usuario = await usuarioDeEvento(idDe(sesion.customer), sesion.metadata?.usuarioId ?? null)
        if (!usuario) break
        if (idDe(sesion.customer)) await guardarCustomer(usuario.id, idDe(sesion.customer)!)

        if (sesion.mode === 'payment' && sesion.payment_status === 'paid') {
          // Pase: premium durante DIAS_PASE días desde ahora.
          await fijarPremium(usuario.id, true, dentroDeDias(DIAS_PASE))
        } else if (sesion.mode === 'subscription') {
          // La activación fina llega en subscription.updated / invoice.paid; de momento
          // dejamos anotada la suscripción.
          if (idDe(sesion.subscription)) await guardarSuscripcion(usuario.id, idDe(sesion.subscription))
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = evento.data.object as Stripe.Subscription
        const usuario = await usuarioDeEvento(idDe(sub.customer), sub.metadata?.usuarioId ?? null)
        if (!usuario) break
        const activa =
          evento.type === 'customer.subscription.updated' &&
          (sub.status === 'active' || sub.status === 'trialing')
        if (activa) {
          const finPeriodo = isoDeUnix(
            (sub as unknown as { current_period_end?: number }).current_period_end,
          )
          await fijarPremium(usuario.id, true, finPeriodo)
          await guardarSuscripcion(usuario.id, sub.id)
        } else {
          // Cancelada, impagada o borrada: fuera premium.
          await fijarPremium(usuario.id, false, null)
          if (evento.type === 'customer.subscription.deleted') await guardarSuscripcion(usuario.id, null)
        }
        break
      }

      case 'invoice.paid': {
        const factura = evento.data.object as Stripe.Invoice
        const usuario = await usuarioDeEvento(idDe(factura.customer), null)
        if (!usuario) break
        // Extendemos el premium hasta el fin del periodo facturado.
        const finLinea = factura.lines?.data?.[0]?.period?.end
        await fijarPremium(usuario.id, true, isoDeUnix(finLinea) ?? dentroDeDias(DIAS_PASE))
        break
      }

      case 'invoice.payment_failed': {
        const factura = evento.data.object as Stripe.Invoice
        const usuario = await usuarioDeEvento(idDe(factura.customer), null)
        if (!usuario) break
        // Pago fallido: quitamos premium (sin periodo de gracia, por simplicidad).
        await fijarPremium(usuario.id, false, null)
        break
      }

      default:
        // Otros eventos no nos afectan; los aceptamos sin hacer nada.
        break
    }
  } catch {
    // Un fallo procesando no debe hacer que Stripe reintente en bucle por algo nuestro;
    // respondemos 200 igualmente para no entrar en reintentos infinitos.
  }

  res.json({ recibido: true })
}
