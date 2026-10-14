# Brío

Una app para montar tu entrenamiento de gimnasio y tu plan de comidas a partir de tu
objetivo y de tus datos reales, que se adapta cuando hay algo que no puedes o no quieres
hacer y te propone una alternativa equivalente. Pensada para el móvil, funciona también en
el navegador.

La idea de fondo: los números no se improvisan. Todo lo que de verdad importa (calorías,
macros, series, repeticiones, progresión, sustituciones) lo calcula un **motor
determinista** probado con tests; la IA solo entra para elegir alternativas y explicar, y
siempre dentro de lo que el motor permite. Así la app sigue funcionando sin internet, sin
IA y sin sorpresas.

> Brío te orienta, no sustituye a tu médico ni a tu dietista-nutricionista. Si tienes una
> condición, estás embarazada o tomas medicación, consúltalo antes.

## Qué hace

- Un onboarding corto recoge tu cuerpo (sexo, edad, altura, peso, % de grasa opcional), tu
  nivel de actividad, cómo entrenas (experiencia, días, material), un cribado de salud y tus
  restricciones de comida (dieta, alergias e intolerancias, lo que no te gusta).
- Con eso calcula tu gasto energético, tus calorías objetivo y tus macros, y te arma una
  rutina por objetivo (ganar músculo, perder grasa, mantenimiento o fuerza) con su
  progresión semana a semana.
- En el día a día registras tus series y tus comidas, y si algo no te encaja pides el cambio:
  distingue entre "no puedo con esto" (permanente: alergia, intolerancia, lesión, falta de
  material) y "hoy no me apetece" (puntual), y te ofrece alternativas válidas.
- Cada semana, un check-in ajusta el plan con tu tendencia de peso real, explicándote por qué.

## Seguridad primero

Es una app de salud, así que el motor aplica límites duros **antes** de enseñar ningún
número: suelos de calorías (1200 mujer, 1500 hombre), déficit máximo del 25 % y superávit
máximo del 20 %, suelo de grasa, proteína sobre masa magra, energía disponible mínima. Y
levanta banderas de derivación que cambian lo que se muestra: menor de 18 y antropometría
imposible se bloquean; una señal de trastorno de conducta alimentaria (cribado SCOFF, o
querer perder grasa con un IMC ya bajo) oculta las cifras y muestra recursos de ayuda;
embarazo, lactancia, una respuesta roja del PAR-Q o una patología pasan el plan a
orientación con derivación. Las alergias y las lesiones son innegociables: ninguna
sugerencia (del motor, de la IA o del respaldo) puede saltárselas. El detalle está en
[`MOTOR.md`](./MOTOR.md).

Tus datos del cuerpo y del cribado viven **solo en tu dispositivo**. La IA es opcional y va
desactivada por defecto; si la activas, solo salen del móvil unas etiquetas (rangos,
exclusiones, ids de catálogo) para pedir una alternativa, nunca tu perfil.

## Cómo está hecho

Monorepo de npm workspaces con tres piezas:

- **`packages/motor`** — el corazón, TypeScript puro sin dependencias. Calcula energía,
  macros, rutina, progresión, sustituciones de respaldo y la capa de seguridad.
  `generarPlan` nunca lanza y la salida es determinista. Lo cubren tests con Vitest,
  incluidos fuzz de miles de perfiles y tests de propiedad que comprueban que ninguna
  sustitución viola una exclusión dura. Spec completa en [`MOTOR.md`](./MOTOR.md).
- **`apps/movil`** — la app, Expo SDK 57 + expo-router + TypeScript. Offline-first con
  expo-sqlite (en web degrada a memoria), trilingüe es/ca/en, estilo minimalista con el
  acento Naranja vigor `#FB6A1E`. Diseño en [`DISENO.md`](./DISENO.md).
- **`apps/proxy`** — un servicio Express pequeño que habla con la Claude API. La clave vive
  solo aquí. El LLM únicamente elige entre los candidatos que ya validó el motor, y el
  proxy revuelve a revalidar la propuesta con el mismo motor antes de devolverla. Sin clave,
  sin cupo o ante cualquier fallo responde que la app use su respaldo local.

El contrato híbrido completo (el "sobre" de restricciones, la revalidación en el servidor y
otra vez en la app, el respaldo determinista y el indicador de origen del texto) está en
[`MOTOR.md`](./MOTOR.md).

## Arrancar

Requisitos: Node 24. Desde la raíz, `npm install`.

```bash
# Motor: comprobar tipos y tests (el corazón)
npm run comprobar
npm test

# App móvil (Expo)
cd apps/movil
npx expo start            # abre en Expo Go por QR, o pulsa w para el navegador
npx expo export --platform web   # build web estática en dist/

# Proxy del LLM (opcional; la app funciona sin él)
cd apps/proxy
cp .env.example .env      # pon tu ANTHROPIC_API_KEY si quieres la IA
npm run dev
```

La app funciona entera sin el proxy: la adaptación por IA es un extra que, si no está,
se cubre con el motor local.

## Estado

v1 en construcción. Motor completo y probado; app con onboarding, uso diario, plan semanal,
progreso y perfil; proxy del LLM con respaldo. Pendiente de pulido final y de la demo web
del portfolio. Licencia MIT.
