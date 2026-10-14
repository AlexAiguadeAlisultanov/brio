# Diseño de Brío

Especificación de diseño producida por el subagente `app-designer` en el arranque. Es el
contrato visual y de interacción de la app móvil. El estilo parte de la guía fija
`apple-minimal-style-guide`; aquí se concreta para esta app. El copy va en español con voz
humana (y se traduce a ca/en por ids en la capa i18n).

## Identidad

- **Nombre:** Brío.
- **Acento:** Naranja vigor `#FB6A1E` (energía, esfuerzo, calorías que se queman). No lo usa
  ningún otro proyecto del portfolio. Variante oscura para texto/enlaces sobre fondo claro:
  Naranja brasa `#C85410`. El acento vive en menos del 10% de la superficie (botón primario,
  pestaña activa, anillo de calorías, estado seleccionado, foco). Nunca es fondo de pantalla.

## Sistema visual

- **Modo oscuro por defecto.** Oscuro: fondo casi negro cálido `#0B0B0C`, superficies
  elevadas por tono (no por sombra): tarjetas `#151517`, hojas y campos `#1D1D20`; texto
  principal `#F5F5F7`, secundario `#9A9AA0`. Claro: fondo `#FAFAFA`, tarjetas blancas, texto
  `#1D1D1F`.
- **Paleta semántica** aparte y desaturada para no competir con la marca: éxito verde
  `#3E9E6E`, precaución ámbar `#C8922E`, bloqueo rojo ladrillo `#C0453A`.
- **Tipografía:** una sola familia, la del sistema (SF Pro en Apple, Roboto en Android),
  para que se sienta nativa. Dos pesos: regular y semibold. Escala de seis pasos, razón 1.2.
  Los números (kcal, macros, cargas, reps) en cifras **tabulares** y semibold: son el
  corazón de la información, se leen de un vistazo y no bailan al cambiar.
- **Iconos:** una familia de línea (Lucide, grosor regular), mismo trazo; acompañan al texto
  salvo en la barra de pestañas.
- **Espaciado y forma:** rejilla de 8 (ajustes finos a 4). Radios: 8 chips, 12 controles y
  campos, 20 tarjetas y esquina superior de las hojas. Elevación por color en oscuro, por
  sombra muy sutil en claro; nunca sombras duras ni de color.
- **Movimiento:** transiciones de 150–250 ms con ease-out o muelle suave. Las hojas suben
  desde abajo, los anillos se rellenan al entrar en Hoy, las pestañas cruzan con fundido. La
  animación explica de dónde viene cada cosa, no decora. Háptica al cerrar un anillo y al
  marcar una serie. Se respeta `prefers-reduced-motion`: el desplazamiento pasa a aparición
  por opacidad. Detalles nativos: título grande que se colapsa al desplazar, pull-to-refresh,
  deslizar sobre una comida o un ejercicio para pedir el cambio, inercia de scroll, teclado
  numérico real en peso y reps, respeto del área segura arriba y abajo.

## Navegación

Dos capas. **Antes de entrar**, un stack de onboarding a pantalla completa, sin barra de
pestañas, con barra de progreso arriba y un solo paso por pantalla (son muchos datos; la
única forma de que no canse es trocearlo y explicar para qué sirve cada dato). **Al
terminar**, barra de pestañas inferior nativa de cuatro destinos, centrada en Hoy:

- **Hoy** — entreno y comidas del día con los anillos. Es donde se vive el día a día.
- **Plan** — semana de entreno, semana de comidas y lista de la compra.
- **Progreso** — tendencia de peso, historial y PRs, calendario de adherencia.
- **Perfil** — datos del cuerpo, restricciones, idioma, suscripción y el aviso médico.

Toda acción puntual sobre un elemento (sustituir una comida o un ejercicio, registrar una
serie, ver una receta o una demo, check-in semanal) se abre como **hoja inferior
deslizable** sobre la pestaña actual, no como pantalla nueva: el gesto es el que ya conoce
cualquiera y no se pierde el contexto. La barra de pestañas lleva fondo difuminado y respeta
el área segura; el icono de la pestaña activa es el único sitio de la barra con acento.

## Componentes reutilizables

- Barra de pestañas inferior con fondo difuminado y área segura; acento solo en la activa.
- Anillos del día: un anillo grande de calorías y tres finos de proteína, carbos y grasa,
  con el número al centro.
- Encabezado de título grande que se colapsa en barra fina al desplazar.
- Tarjeta de comida (hueco del día) con kcal, macros y acciones registrar/sustituir/ver
  receta; deslizable para el cambio rápido.
- Tarjeta de ejercicio con series × reps, carga objetivo o RPE, temporizador y acceso a demo.
- Fila de registro por serie con campos de peso y reps y un check con háptica.
- Temporizador de descanso con cuenta atrás y aviso al terminar.
- Hoja de sustitución: lista ordenada de alternativas, cada una con su delta de kcal y
  macros frente a la original, favoritos primero.
- Selector de motivo del cambio que distingue "no puedo" (permanente) de "hoy no me apetece"
  (puntual).
- Chip de restricción para alergias, intolerancias, lesiones, material y gustos, con color
  según sea dura o blanda.
- Control segmentado (objetivo, unidades métrico/imperial).
- Campo numérico con stepper, sufijo de unidad y teclado numérico.
- Barra de progreso del onboarding con paso actual y total.
- Botón primario en acento y secundario de contorno; una sola acción primaria por pantalla.
- Tarjeta de resumen del plan con TDEE, objetivo calórico y reparto de macros.
- Línea de aviso médico integrada en el texto, **con jerarquía tipográfica suficiente** (no
  solo color), presente en onboarding, plan y perfil; las señales de parada del ejercicio
  (dolor de pecho, mareo, síncope, disnea, palpitaciones) se muestran destacadas en la
  pantalla de entreno.
- Indicador de origen del texto: señala si la explicación viene del motor, está adaptada por
  la IA o es de respaldo sin conexión.
- Gráfico de tendencia de peso suavizada (no pesos sueltos).
- Calendario de adherencia con racha indulgente y opción de congelar el día.
- Estado vacío con una sola acción clara para empezar.

## Inventario de pantallas (con copy clave en español)

### Onboarding (stack, 1 paso por pantalla, barra de progreso)

1. **Bienvenida e idioma** — bienvenida, idioma (es por defecto, ca, en, detectado del
   dispositivo) y bajar la ansiedad antes de pedir datos.
   - Titular: "Vamos a montar tu plan". Apoyo: "Unas cuantas preguntas y te damos tu entreno
     y tus comidas de hoy". Botón: "Empezar". Fino bajo el botón: "Brío te orienta, no
     sustituye a tu médico ni a tu dietista-nutricionista".
2. **Objetivo** — se captura primero porque enmarca todo. Cuatro tarjetas de selección única.
   - Titular: "¿Qué quieres conseguir?". Opciones: "Ganar músculo / Perder grasa /
     Mantenerme / Ganar fuerza". Apoyo: "Puedes cambiarlo cuando quieras, el plan se
     recalcula solo".
3. **Datos del cuerpo** — sexo (segmentado), edad, altura, peso con stepper + teclado,
   toggle métrico/imperial. Estimación en vivo del gasto cuando hay datos suficientes.
   - Titular: "Cuéntanos de ti". Apoyo: "Con esto calculamos tus calorías y tus macros. Estos
     datos se quedan en tu teléfono". En vivo: "Con esto ya vemos que tu gasto ronda las
     2.400 kcal".
4. **Nivel de actividad** — cinco filas con ejemplo de vida real; empuja a no sobreestimar.
   - Titular: "¿Cuánto te mueves en un día normal?". Apoyo: "Si dudas, elige el de abajo.
     Casi todos nos pasamos de optimistas aquí".
5. **Porcentaje de grasa (opcional)** — tres botones: lo tengo medido / que lo estime Brío /
   saltar. Sin sliders ni siluetas para adivinar.
   - Titular: "¿Sabes tu porcentaje de grasa?". Apoyo: "Si no lo tienes medido de verdad,
     sáltalo. Un número inventado nos haría calcular peor".
6. **Contexto de entrenamiento** — experiencia, días/semana (con aviso de qué split cabe),
   duración de sesión, equipo disponible (chips), preferencia de reparto.
   - Titular: "¿Cómo entrenas?". Apoyo bajo días: "Con 3 días montamos cuerpo completo; con 4
     o más, lo repartimos".
7. **Cribado de salud (PAR-Q + SCOFF)** — preguntas sí/no + mapa de zonas del cuerpo para
   lesiones. Bandera deja continuar pero recomienda consultar; las zonas pasan a filtro del
   motor. El SCOFF alimenta la detección de TCA.
   - Titular: "Antes de empezar, un par de preguntas de salud". Con bandera: "Con lo que nos
     cuentas, habla con tu médico antes de ponerte a entrenar. Puedes seguir viendo tu plan
     mientras tanto. Lo que marques aquí lo usamos para no cargar donde te duele".
8. **Restricciones de nutrición** — patrón dietético (chips), alergias/intolerancias (chips
   rojos, exclusión dura e innegociable), lo que no gusta (de una lista del catálogo,
   exclusión blanda), comidas al día (3-6).
   - Titular: "¿Hay algo que no puedas o no quieras comer?". Apoyo: "Las alergias e
     intolerancias no las tocamos nunca, pase lo que pase con los números. Lo que simplemente
     no te gusta lo evitamos, pero podemos proponerlo si encaja mejor".
9. **Resumen y aviso** — lista editable de todo con enlace a cada paso; aviso médico
   integrado (énfasis si hubo bandera); botón para generar el plan.
   - Titular: "Esto es lo que nos has contado". Aviso: "Brío calcula a partir de la ciencia,
     pero no sustituye a tu médico ni a tu dietista-nutricionista. Si tienes una condición,
     estás embarazada o tomas medicación, consúltalo antes". Botón: "Ver mi plan".
10. **Tu plan (recompensa)** — premio al terminar, antes de cualquier muro. Tarjeta con TDEE,
    objetivo calórico y reparto de macros, más qué entreno toca esta semana. Números del
    motor, visibles sin conexión.
    - Titular: "Tu plan está listo". Datos: "Objetivo 2.150 kcal al día. Proteína 165 g,
      carbos 210 g, grasa 60 g. Entreno: 4 días, torso y pierna". Botón: "Empezar hoy".

### Pestañas y hojas

11. **Hoy** — encabezado grande colapsable, anillos del día, tarjeta de entreno de hoy,
    comidas del día por hueco, tarjeta de agua. Todo desde una pantalla.
    - Centro del anillo: "1.240 / 2.150 kcal". Entreno: "Entreno de hoy, torso, 6 ejercicios".
12. **Entreno de hoy** — lista de ejercicios con series × reps, carga/RPE, temporizador de
    descanso, registro por serie con háptica, acceso a demo y a sustituir, feedback al acabar.
    - "Serie 2 de 4, 60 kg, 7 reps, Hecho". "Descansa 90 s". Al acabar: "¿Cómo ha ido?
      Demasiado fácil / En su punto / Demasiado duro".
13. **Comidas de hoy** — comidas por hueco con kcal/macros y acciones registrar/sustituir/ver
    receta; total del día frente al objetivo; deslizar abre el cambio rápido.
    - "Pollo al horno con arroz y verduras, 620 kcal, 48 g proteína". "Te quedan 910 kcal para
      la cena y el snack".
14. **Sustitución de comida (hoja)** — paso 1 motivo: "No puedo con esto" (permanente, abre
    tipo: alergia/intolerancia/dieta/no tengo el ingrediente) vs "Hoy no me apetece"
    (puntual). Paso 2: lista ordenada de alternativas del motor con su delta. Sin conexión
    sigue saliendo del motor con aviso.
    - "¿Por qué lo cambias? No puedo con esto / Hoy no me apetece". "Pavo a la plancha, +15
      kcal, misma proteína". Sin conexión: "Sin internet te proponemos el cambio más parecido
      en números. La explicación llegará cuando vuelva la conexión".
15. **Sustitución de ejercicio (hoja)** — motivo: me molesta una zona (permanente) / no tengo
    el material (permanente) / hoy no me apetece (puntual). Alternativas del mismo grupo y
    patrón, filtradas por equipo, conservando series/reps/intensidad.
    - "Cambia press con barra por... Press con mancuernas, mismo trabajo de pecho, mantiene 4
      series de 6 a 8". Con lesión: "Lo tendremos en cuenta y evitaremos cargar esa zona".
16. **Plan de la semana** — conmutador entreno/comidas por días + lista de la compra agregada
    y preparación por lotes; ajustar días y split.
    - "Tu semana. Lunes torso, Martes pierna, Miércoles descanso". "Toca un día para cambiarlo
      entero".
17. **Progreso** — tendencia de peso suavizada, medidas y fotos opcionales (hueco de UI),
    historial y PRs, calendario de adherencia con racha indulgente.
    - "Bajando unos 0,4 kg por semana, buen ritmo". "Llevas 5 días seguidos". Si rompe racha:
      "Hoy no cuenta en contra. Lo retomas mañana y seguimos".
18. **Check-in semanal (hoja)** — resumen de peso medio e ingesta frente al objetivo y
    propuesta de ajuste del motor explicada en una frase; el usuario confirma.
    - "Tu peso apenas se movió y comiste cerca del objetivo. Bajamos 150 kcal al día para
      volver al ritmo". Botón: "Aplicar". "Necesitamos un par de semanas de datos para afinar".
19. **Perfil y ajustes** — datos del cuerpo, objetivo, restricciones (chips de alergia y
    lesión siempre visibles), idioma, suscripción (maqueta), consentimiento de IA, "borrar
    todos mis datos", cerrar sesión; aviso médico permanente.
    - "Brío te orienta, no sustituye a tu médico ni a tu dietista-nutricionista".

## Estados especiales de seguridad (del informe del motor, la UI debe respetarlos)

- **Plan bloqueado** (menor de edad, antropometría inválida): no mostrar cifras ni rutina de
  carga; pantalla de derivación.
- **Ocultar cifras** (señal de TCA, o perder grasa con IMC bajo): nada de kcal, déficit ni
  encuadre de adelgazar; pantalla de parada con recursos de ayuda (teléfono de TCA según el
  locale) y, como mucho, pautas generales.
- **Derivación** (embarazo/lactancia, PAR-Q en rojo, patología): el plan se ve como
  orientación, con el aviso reforzado y sin máximas.
- **Conjunto vacío en sustitución**: mantener el hueco con un mensaje claro y derivar; nunca
  servir algo que viole una exclusión.
