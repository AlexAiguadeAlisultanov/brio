# Backend de Brío (`@brio/proxy`)

Servidor de Brío: cuentas de usuario, sesión por token, planes gratis/premium con
entitlement, adaptación por IA (Claude) y pagos con Stripe en modo pruebas. Express 5 +
TypeScript, base libSQL (SQLite local o Turso en producción). La app móvil y la web
hablan con este backend; las claves (Claude y Stripe) viven solo aquí.

## Arrancar

```bash
npm install                 # desde la raíz del monorepo
cp apps/proxy/.env.example apps/proxy/.env   # y rellena lo que uses
npm run dev -w @brio/proxy   # desarrollo con recarga
npm run start -w @brio/proxy # producción (tsx)
npm run comprobar -w @brio/proxy  # tsc --noEmit
npm test -w @brio/proxy           # vitest
```

Sin ninguna clave configurada el backend funciona igual: la IA responde `503 {fallback:true}`
y el pago responde `503 {sinPago:true}`. La demo arranca sin secretos.

## Base de datos

libSQL con `@libsql/client` (SQLite, pero también Turso). Es asíncrona: toda la capa de
`src/db.ts` devuelve promesas, salvo `usuarioEsPremium`, que es lógica pura. La base se elige por
entorno, en este orden:

1. `BRIO_DB_URL` (+ `BRIO_DB_TOKEN`) → **Turso**, base persistente en la nube. Es lo de producción.
2. Si no, un fichero local en `DB_PATH` (por defecto `./datos/brio.db`; la carpeta se crea sola).
   `DB_PATH=:memory:` da una base en memoria, que es lo que usan los tests (que además fuerzan
   `BRIO_DB_URL` vacío para no tocar nunca una base remota).

Las tablas se crean solas al primer uso. Dos tablas:

- `usuario(id, email UNIQUE, hash, sal, creado_en, premium, premium_hasta, stripe_customer_id, stripe_subscription_id)`
- `sesion(token PK, usuario_id, creado_en, expira_en)` — el `token` guardado es el **hash**
  del token, nunca el token en claro.

Siempre con sentencias preparadas, nunca SQL concatenado.

> **Producción:** en Render el disco es **efímero** y se borra en cada despliegue, así que el
> fichero local pierde las cuentas al redesplegar. Por eso producción usa Turso. Crear la base
> una vez con la CLI de Turso y poner las dos variables en Render:
>
> ```bash
> turso db create brio
> turso db show brio --url       # -> BRIO_DB_URL (libsql://...)
> turso db tokens create brio    # -> BRIO_DB_TOKEN
> ```

## Sesión por token y entitlement

- Las contraseñas se guardan con `scrypt` (sal por usuario) y se comparan en tiempo constante
  (`timingSafeEqual`). Nunca viajan ni se registran en claro.
- Al registrarse o acceder se crea una sesión y se devuelve un token aleatorio
  (`crypto.randomBytes`). El cliente lo manda en `Authorization: Bearer <token>`. En la base
  solo se guarda su HMAC, así que un robo de la tabla `sesion` no permite suplantar a nadie.
- `requiereAuth` resuelve el token a usuario (401 si no). `requierePremium` exige premium
  vigente (403 `{necesitaPremium:true}`). La regla de entitlement es única: es premium si la
  marca está puesta y, si hay `premium_hasta`, aún no ha pasado.

## Rutas

| Método | Ruta | Auth | Contrato |
|---|---|---|---|
| GET | `/api/salud` | — | `{ok, llm, modelo, pago, circuito}` (`pago` = hay Stripe configurado) |
| POST | `/api/registro` | — | `{email, password}` → `201 {token, usuario:{email, premium, premiumHasta}}`; `400` datos inválidos; `409` email en uso |
| POST | `/api/acceso` | — | `{email, password}` → `200 {token, usuario}`; `401 {error:'credenciales_invalidas'}` (mensaje genérico, no revela si el email existe) |
| GET | `/api/yo` | Bearer | `{email, premium, premiumHasta}`; `401` sin token |
| POST | `/api/salir` | Bearer | invalida el token → `{ok:true}` |
| POST | `/api/adaptar` | Bearer + premium | IA. `401` sin token, `403 {necesitaPremium:true}` sin premium. El gratis sigue con su motor local |
| POST | `/api/pago/checkout` | Bearer | `{modo:'suscripcion'\|'pase'}` → `{url}`; `503 {sinPago:true}` si no hay Stripe |
| POST | `/api/pago/webhook` | firma Stripe | eventos de Stripe (cuerpo crudo) |

## Pagos con Stripe (modo pruebas)

Bizum **no** admite cobros recurrentes, así que hay dos caminos:

- **`suscripcion`**: `mode:'subscription'`, 4,99 €/mes, solo tarjeta (`payment_method_types:['card']`).
  Usa `STRIPE_PRICE_ID` si está; si no, construye el precio con `PRECIO_CENTIMOS` y `MONEDA`,
  recurrencia mensual.
- **`pase`**: `mode:'payment'`, pago único de `PRECIO_CENTIMOS`, tarjeta o **Bizum**
  (`payment_method_types:['card','bizum']`). Da 30 días de premium.

Se crea (o reutiliza) el `stripe_customer_id` del usuario. `success_url`/`cancel_url` salen de
`URL_EXITO`/`URL_CANCELAR`.

El **webhook** verifica la firma con `STRIPE_WEBHOOK_SECRET` usando el cuerpo crudo
(`express.raw` solo en esa ruta) y maneja:

- `checkout.session.completed` → pase pagado: premium 30 días; suscripción: guarda la suscripción.
- `customer.subscription.updated` → activa/trial: premium hasta el fin del periodo; otro estado: fuera premium.
- `customer.subscription.deleted` → fuera premium.
- `invoice.paid` → premium hasta el fin del periodo facturado.
- `invoice.payment_failed` → fuera premium.

Nunca se registran en logs datos sensibles del pago.

## Variables de entorno

Ver `.env.example` (comentado). Resumen: `ANTHROPIC_API_KEY`, `MODELO_LLM`,
`TOPE_PETICIONES_DIA` (IA); `BRIO_DB_URL`, `BRIO_DB_TOKEN`, `DB_PATH`, `TOKEN_SECRETO`, `DIAS_SESION` (base y sesión);
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (opcional), `PRECIO_CENTIMOS`,
`MONEDA`, `URL_EXITO`, `URL_CANCELAR` (pagos); `ORIGEN_PERMITIDO`, `PORT`, `LIMITE_API`,
`LIMITE_AUTH` (red).

## Activar cobros reales

1. Crea una cuenta en Stripe y activa el **modo test** (claves `sk_test_...`).
2. Pon `STRIPE_SECRET_KEY` en el `.env` (local) o en Render (nunca en el repositorio).
3. Para la suscripción, o bien dejas que el backend construya el precio, o creas un Price
   mensual en Stripe y pones su id en `STRIPE_PRICE_ID`.
4. Da de alta el webhook en Stripe apuntando a `https://TU-BACKEND/api/pago/webhook`,
   suscrito a `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed`. Copia el
   `whsec_...` a `STRIPE_WEBHOOK_SECRET`.
5. Para probar en local, usa el Stripe CLI: `stripe listen --forward-to localhost:8099/api/pago/webhook`.
6. Para **cobros de verdad** (salir de pruebas): completa la activación de la cuenta en Stripe
   (datos fiscales + **IBAN** para los pagos), activa Bizum en tu cuenta, y cambia a las claves
   **live** (`sk_live_...` y el `whsec_` del webhook en modo live). Tarjetas de prueba y el flujo
   de Bizum de test están en la documentación de Stripe.
