# Motor de Brío — especificación

El motor es el corazón de Brío. Vive en `packages/motor`, es **TypeScript puro** (cero
dependencias de React Native, Expo o del navegador) y se prueba con Vitest. La app móvil y
el proxy lo importan como `@brio/motor`. Es la **única fuente de verdad** sobre números y
seguridad: la interfaz nunca recalcula nada por su cuenta y el LLM solo se mueve dentro de
lo que el motor le permite.

## Invariantes (no negociables, hay un test para cada uno)

1. **`generarPlan` nunca lanza.** Pase lo que pase con la entrada, devuelve un `Plan`
   válido o un `Plan` en estado de bloqueo/derivación. Nada de excepciones no capturadas.
2. **Determinista.** La misma entrada produce byte a byte la misma salida. Prohibido
   `Math.random()` y `Date.now()` dentro del motor. La hora, si hace falta, entra como
   parámetro (`ctx.ahoraISO`).
3. **Las exclusiones duras son sagradas.** Ninguna salida (plan inicial, sustitución del
   motor o propuesta del LLM revalidada) puede contener jamás un alimento con un alérgeno o
   intolerancia declarados, un alimento que viole el patrón dietético, un ejercicio que
   cargue una zona lesionada, un ejercicio que use material no disponible, ni una modalidad
   contraindicada por una patología. Aunque los macros o el patrón encajen perfectos.
4. **La seguridad se aplica antes de emitir.** `evaluarSeguridad` corre primero; sus
   límites y banderas condicionan todo lo que viene después.
5. **Redondeo determinista** a entero en kcal y gramos de macros con `Math.round`.

## Tipos (`src/tipos.ts`)

Fuente de verdad de tipos para motor, app y proxy.

```ts
export type Sexo = 'hombre' | 'mujer'
export type Objetivo = 'ganar_musculo' | 'perder_grasa' | 'mantenimiento' | 'fuerza'
export type NivelActividad = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy_activo'
export type Experiencia = 'principiante' | 'intermedio' | 'avanzado'
export type Equipo = 'barra' | 'mancuernas' | 'maquina' | 'polea' | 'peso_corporal' | 'bandas' | 'kettlebell'
export type GrupoMuscular = 'pecho' | 'espalda' | 'cuadriceps' | 'isquios' | 'gluteos' | 'hombro' | 'biceps' | 'triceps' | 'gemelos' | 'abdomen'
export type Patron = 'sentadilla' | 'bisagra' | 'empuje_horizontal' | 'traccion_horizontal' | 'empuje_vertical' | 'traccion_vertical' | 'core' | 'aislado'
export type ModalidadRiesgo = 'carga_axial' | 'valsalva' | 'isometrico_intenso' | 'supino' | 'impacto'
export type Alergeno = 'gluten' | 'lactosa' | 'lacteos' | 'huevo' | 'frutos_secos' | 'cacahuete' | 'soja' | 'pescado' | 'marisco' | 'sesamo' | 'apio' | 'mostaza' | 'sulfitos' | 'altramuces'
export type PatronDietetico = 'omnivoro' | 'vegetariano' | 'vegano' | 'sin_gluten' | 'sin_lactosa' | 'pescetariano' | 'halal'
export type Zona = 'rodilla' | 'hombro' | 'lumbar' | 'codo' | 'muneca' | 'cadera' | 'cuello' | 'tobillo'
export type Medicamento = 'betabloqueante' | 'insulina' | 'antidiabetico_oral' | 'corticoide' | 'diuretico' | 'tiroideo' | 'anticoagulante'
export type Locale = 'es' | 'ca' | 'en'

export interface Rango { min: number; max: number }
export interface Macros { kcal: number; proteinaG: number; grasaG: number; carbosG: number; fibraG: number }

// Respuestas de un cribado tipo PAR-Q + SCOFF + condiciones declaradas.
export interface Cribado {
  // PAR-Q (true = responde que sí, posible riesgo)
  problemaCorazon: boolean
  dolorPecho: boolean
  mareoDesmayo: boolean
  problemaOseoArticular: boolean
  tensionAlta: boolean
  // SCOFF (true = positivo); >=2 positivos => señal de TCA
  scoffVomitar: boolean
  scoffPerderControl: boolean
  scoffPerdido6kg3meses: boolean
  scoffSeVeGordo: boolean
  scoffComidaDomina: boolean
  // Condiciones declaradas
  embarazoLactancia: boolean
  enfermedadRenalHepatica: boolean
  diabetes: boolean
  enfermedadCardiovascular: boolean
  medicamentos: Medicamento[]
}

export interface Perfil {
  sexo: Sexo
  edadAnios: number
  alturaCm: number
  pesoKg: number
  grasaPct?: number
  actividad: NivelActividad
  experiencia: Experiencia
  diasPorSemana: number
  duracionSesionMin: number
  equipo: Equipo[]
  lesiones: Zona[]
  cribado: Cribado
  patronDietetico: PatronDietetico[]
  alergias: Alergeno[]
  intolerancias: Alergeno[]
  noGustaIds: string[]          // ids del catálogo, NO texto libre
  comidasPorDia: number         // 3..6
}
```

`Plan`, los distintos `Sobre*`, `Propuesta*`, `ResultadoValidacion`, `InformeSeguridad`,
`AjusteSemanal`, etc. se definen en `tipos.ts` siguiendo las firmas de la sección Módulos.

## Módulos y fórmulas exactas

### `energia.ts`
- BMR Mifflin-St Jeor: hombre `10*peso + 6.25*altura - 5*edad + 5`; mujer
  `10*peso + 6.25*altura - 5*edad - 161`.
- BMR Katch-McArdle `370 + 21.6*LBM`, con `LBM = peso*(1 - grasaPct/100)`. Se usa solo si
  `grasaPct` es plausible (entre 5 y 60); si no, Mifflin, y `estimado=true`.
- Factores de actividad exactos: sedentario 1.2, ligero 1.375, moderado 1.55, activo 1.725,
  muy activo 1.9.
- `calcularTDEE = BMR * factor`.
- Ajuste por objetivo: perder_grasa −0.20, ganar_musculo +0.10, mantenimiento 0, fuerza
  +0.05. `kcalObjetivo` se calcula y luego pasa por `limitarKcal` de seguridad.
- `estimarGrasaDeurenberg`: `1.20*IMC + 0.23*edad - 10.8*sexoM - 5.4` (sexoM=1 hombre, 0
  mujer). `imc = peso / (altura_m)^2`.
- `gastoEjercicioKcal(perfil)`: estimación por MET según días y duración de sesión
  (fuerza ~5 MET): `kcal/sesión = MET * 3.5 * pesoKg / 200 * duracionMin`, prorrateado a
  día = `kcal/sesión * diasPorSemana / 7`. Alimenta la energía disponible (no fingir 0).

### `seguridad.ts` (se ejecuta ANTES de emitir el plan)
`evaluarSeguridad(perfil, objetivo): InformeSeguridad` con:
```ts
export interface InformeSeguridad {
  bloquea: boolean                 // true => no se generan cifras ni rutina de carga
  motivoBloqueo?: 'menor_edad' | 'antropometria_invalida' | 'tca' | 'embarazo_lactancia' | 'par_q_rojo'
  objetivoEfectivo: Objetivo       // puede forzarse a 'mantenimiento'
  ocultarCifras: boolean           // TCA: no mostrar kcal/déficit/encuadre de adelgazar
  derivar: boolean
  banderas: Bandera[]              // lista de banderas levantadas
  avisos: AvisoId[]                // ids de aviso traducibles por la app
  modalidadesVetadas: ModalidadRiesgo[]
  recorteKcal: boolean
}
```
Reglas duras:
- **Edad mínima 18.** `edad < 18` => `bloquea`, `motivoBloqueo='menor_edad'`, derivar a
  pediatra; no se generan cifras ni rutina de carga.
- **Antropometría válida** (si no, `bloquea='antropometria_invalida'`): altura 120–220 cm,
  peso 30–300 kg, edad 18–100. Fuera de rango es error de datos, no un perfil.
- **SCOFF ≥ 2 positivos**, o **objetivo perder_grasa con IMC < 20**: `ocultarCifras=true`,
  `derivar=true`, `objetivoEfectivo='mantenimiento'`; la app muestra parada con recursos de
  ayuda (teléfono de TCA según locale) y solo pautas generales, nunca kcal ni déficit.
- **Embarazo/lactancia**: `bloquea` para cortes/volúmenes, `objetivoEfectivo='mantenimiento'`,
  `derivar=true`. Nada de déficit; nota de necesidades aumentadas en lactancia.
- **PAR-Q**: `dolorPecho` o `problemaCorazon` o `mareoDesmayo` => bandera roja, `derivar`,
  y modalidades de riesgo vetadas (`valsalva`, `isometrico_intenso`, `carga_axial`). Deja
  ver el plan como orientación general, sin máximas.
- **Suelo calórico**: nunca por debajo de 1200 (mujer) ni 1500 (hombre), ni por debajo de
  la BMR de forma sostenida (regla operacional: `kcalObjetivo >= max(sueloSexo, BMR*0.9)`).
- **Déficit máximo 25% del TDEE**; superávit máximo 20%. Si el cálculo lo cruza, se recorta
  (`recorteKcal=true`).
- **suelo > TDEE**: no se puede crear déficit => `objetivoEfectivo='mantenimiento'` y
  bandera de derivación (probable bajo peso o dato erróneo).
- **Energía disponible** `EA = (kcalIngesta - gastoEjercicio) / LBM`. Si `EA < 30`
  (riesgo RED-S) se bloquea el déficit agresivo, con cuidado especial en mujeres y jóvenes.
- **Edad ≥ 65**: bandera; sin máximas ni volúmenes a MRV; fuerza submáxima por RIR; aviso
  de menor fiabilidad del BMR estimado.
- **Patología → modalidad**: tensión alta no controlada / enf. cardiovascular =>
  vetar `valsalva`, `isometrico_intenso`, `carga_axial` pesada, `empuje_vertical` pesado.
  Betabloqueante => avisar de que RPE/FC no son fiables. Insulina/antidiabéticos => aviso de
  hipoglucemia y timing de comidas. Estas modalidades se filtran en `entrenamiento.ts`.
- **Enfermedad renal/hepática**: no subir proteína por encima de 1.2 g/kg y derivar.

### `macros.ts`
Orden fijo e invariable **proteína → grasa (suelo) → carbohidratos**:
- Proteína por objetivo (g/kg): fuerza/ganar_musculo 1.8–2.2, perder_grasa 2.0–2.4,
  mantenimiento 1.6–1.8. **El gramaje de proteína y su clamp se aplican sobre la masa
  magra** si `grasaPct` es alto (hombre >25%, mujer >32%) o, si no hay grasaPct, sobre
  peso ajustado; si no, sobre peso corporal. Clamp duro 1.2–3.1 g/(kg de la base elegida).
  Con enfermedad renal/hepática, tope 1.2 g/kg.
- Grasa como **suelo de seguridad**: `max(0.5 g/kg, 20% de kcalObjetivo / 9)`.
- Carbohidratos = energía restante: `(kcal - 4*protG - 9*grasaG) / 4`, nunca negativa; si
  no cuadra, bajar grasa hasta su mínimo antes de dejar carbos en 0.
- Validación de cuadre `4*prot + 9*grasa + 4*carbs ≈ kcal` con ±2%.
- Fibra `14 g por 1000 kcal`. Hidratación base `35 ml/kg` + `500 ml por hora de entreno`,
  sin recomendar más de 0.8–1.0 L/h sostenido.

### `comidas.ts`
- `porcentajesPorComida(n)` para 3–6 huecos (p. ej. 3 = [30,40,30]; 4 = [25,35,25,15];
  añade snacks 10–15%). Suman 100.
- Reparte macros por hueco (`~0.4 g/kg proteína por comida` como guía) y selecciona del
  catálogo alimentos válidos que respetan dieta/alérgenos/intolerancias/noGusta.

### `entrenamiento.ts`
- `elegirSplit(dias)`: 1–2 full body; 3 A/B/A; 4 torso/pierna ×2; 5 torso/pierna + PPL; 6
  PPL ×2. Garantiza **frecuencia ≥ 2× por grupo** cuando los días lo permiten.
- `prescripcion(objetivo)`: fuerza reps 3–6, 80–90% 1RM, series 3–6, descanso 180 s, RIR
  1–3; hipertrofia reps 6–12, 67–80%, series 3–4, descanso 90–120 s, RIR 1–2; perder_grasa
  igual que hipertrofia (mantener estímulo) reps 8–12; mantenimiento reps 8–12, RIR 2–3.
- `volumenSemanal(grupo, experiencia)`: MEV/MAV/MRV series/semana (p. ej. pecho MEV 8 / MAV
  14 / MRV 22), escalado por experiencia; el objetivo queda dentro de **[MEV, MRV]**.
- **%1RM solo para intermedio/avanzado.** Principiantes y edad ≥ 65 entrenan por **RIR/RPE
  con carga autoseleccionada**, nunca test de máximas. El 1RM, si se usa, se siembra de un
  submáximo real (`estimar1RM` Epley sobre un peso a RIR ≥ 3), jamás pidiendo un 1RM directo.
- `seleccionarEjercicios` filtra el catálogo por equipo disponible, zonas lesionadas
  (`contraindica`) **y modalidades vetadas** por `InformeSeguridad.modalidadesVetadas`.
- `estimar1RM` Epley `peso*(1 + reps/30)`; `cargaTrabajo(rm1, pct)`.

### `progresion.ts`
- Novato: **lineal** (+2.5 kg en básicos de tren inferior, +1.25 en tren superior) al
  alcanzar el tope de reps al RIR objetivo.
- Intermedio/avanzado: **doble progresión** (subir reps hasta el tope del rango, luego
  carga). Ningún salto de carga supera el **10%**.
- Descarga programada o disparada por **2 estancamientos** seguidos.
- `ajustarPorFeedback(ej, 'facil'|'ok'|'dificil')` ajusta la siguiente sesión.

### `sobre.ts`
Construye el **sobre de restricciones**: límites numéricos cerrados + exclusiones + lista
de candidatos del catálogo que **ya** encajan, ordenados por cercanía (favoritos primero).
Es el único contrato que recibe el LLM; nunca ve kcal/macros/series objetivo fuera del rango
ni el perfil crudo.
```ts
export interface SobreComida { id: string; tipo: 'comida'; momento: string; kcal: Rango; proteinaG: Rango; carbosG: Rango; grasaG: Rango; excluidos: Alergeno[]; dieta: PatronDietetico[]; noGustaIds: string[]; locale: Locale; candidatos: string[] }
export interface SobreEjercicio { id: string; tipo: 'ejercicio'; grupo: GrupoMuscular; patron: Patron; series: Rango; reps: Rango; rir: Rango; equipoDisponible: Equipo[]; contraindicados: Zona[]; modalidadesVetadas: ModalidadRiesgo[]; locale: Locale; candidatos: string[] }
```

### `sustitucion.ts` (respaldo determinista + validador)
- `filtrarExclusiones*` aplica primero exclusiones **duras** (alergia/intolerancia/dieta/
  equipo/lesión/modalidad vetada) y luego **blandas** (noGusta).
- Elige por **distancia mínima de macros** (comida, peso proteína > carbos ≈ grasa) o
  mismo patrón+grupo y rango de series/reps (ejercicio).
- **Escalado de porción**: ajusta gramos para acercarse al objetivo del hueco **respetando
  a la vez kcal ±8% y los tres macros**. Si un solo alimento no basta, combina dos items
  del catálogo; si aun así no entra en rango, devuelve la mejor aproximación **marcada como
  `aproximado:true` con el delta visible**, nunca presentada como dentro de rango.
- **Estado de conjunto vacío**: si tras los filtros duros no queda ningún candidato
  (p. ej. vegano + alergia a frutos secos + soja + sin gluten sin proteína viable),
  devuelve `{ vacio: true, mensajeId: 'sin_candidatos', derivar: true }` y **mantiene el
  hueco**; jamás un item que viole una exclusión ni uno fuera de rango disfrazado.
- `validarSustitucionComida/Ejercicio(sobre, propuesta): ResultadoValidacion` revalida la
  propuesta del LLM contra el **mismo** sobre: fuera de rango, excluido, contraindicado o
  equipo no disponible => `{ ok:false, motivos:[...] }`. Se usa en el proxy **y** en la app.

### `checkin.ts`
- `tendenciaPeso(hist)`: media móvil que suaviza el ruido; **rechaza pesos imposibles o con
  saltos diarios enormes** antes de entrar en la tendencia.
- Compara el ritmo real con el objetivo y corrige en pasos de **100–200 kcal**, respetando
  siempre los suelos. Necesita ~2 semanas de datos: con menos, `confianza='baja'` y ajuste
  conservador (o no recortar si la varianza es alta).

### `datos/alimentos.ts` y `datos/ejercicios.ts`
- ~50 alimentos por categoría (proteína/carbohidrato/grasa/verdura/mixto) con kcal y macros
  por 100 g, alérgenos y tags de patrón dietético. Ids **estables** (no se borran; si algo
  queda obsoleto, se marca, no se elimina, para no dejar históricos huérfanos).
- ~50 ejercicios etiquetados por grupo primario, secundarios, patrón, equipo, nivel, zonas
  contraindicadas (`contraindica: Zona[]`) y **modalidades de riesgo** (`modalidades:
  ModalidadRiesgo[]`).
- El catálogo semilla debe garantizar **al menos un candidato válido** para los sobres
  razonables en los 4 objetivos y las dietas base; cuando una intersección de exclusiones
  no tenga candidato, el estado de conjunto vacío es la respuesta correcta y testada.

## API pública (`src/index.ts`)
```ts
export const VERSION_MOTOR: string
export function generarPlan(perfil: Perfil, objetivo: Objetivo, ctx?: { ahoraISO?: string }): Plan
export function evaluarSeguridad(perfil: Perfil, objetivo: Objetivo): InformeSeguridad
export function construirSobreComida(plan: Plan, momentoId: string, perfil: Perfil): SobreComida
export function construirSobreEjercicio(plan: Plan, ejercicioId: string, perfil: Perfil): SobreEjercicio
export function sustituirComidaDeterminista(sobre: SobreComida): SustitucionComida
export function sustituirEjercicioDeterminista(sobre: SobreEjercicio): SustitucionEjercicio
export function validarSustitucionComida(sobre: SobreComida, prop: PropuestaComida): ResultadoValidacion
export function validarSustitucionEjercicio(sobre: SobreEjercicio, prop: PropuestaEjercicio): ResultadoValidacion
export function aplicarCheckIn(plan: Plan, historico: RegistroProgreso[]): AjusteSemanal
```

## Tests obligatorios (Vitest, en `src/__tests__`)
1. `energia.test.ts` — BMR Mifflin hombre/mujer con valores conocidos; Katch cuando grasaPct
   plausible; los 5 factores exactos; kcal objetivo con sus clamps; redondeo entero.
2. `seguridad.test.ts` — suelo 1200/1500 nunca se cruza; déficit recortado a 25%; EA<30
   bloquea déficit; cada bandera (menor, antropometría inválida, SCOFF≥2, perder_grasa con
   IMC<20, embarazo/lactancia, PAR-Q rojo, renal, ≥65) hace lo que debe (bloquea / oculta
   cifras / fuerza mantenimiento / veta modalidades / deriva).
3. `macros.test.ts` — orden fijo; suelo de grasa respetado en corte agresivo recortando
   carbos; carbos nunca negativos; cuadre ±2%; fibra 14 g/1000 kcal; **caso obeso**: el
   gramaje de proteína sale razonable (clamp sobre masa magra).
4. `entrenamiento.test.ts` — split por días; frecuencia ≥2×; volumen en [MEV, MRV]; la
   prescripción coincide con la tabla del objetivo; principiante NO recibe %1RM; modalidades
   vetadas no aparecen; Epley correcto.
5. `progresion.test.ts` — doble progresión y lineal; salto ≤10%; descarga tras 2
   estancamientos; feedback 'dificil' baja el estímulo.
6. `comidas.test.ts` — reparto por 3–6 suma el total; porcentajes correctos; cada hueco
   respeta dieta y exclusiones.
7. `sustitucion.test.ts` (PROPIEDAD) — para miles de combinaciones aleatorias (semilla fija,
   generador propio, sin Math.random) de alergias/intolerancias/dieta/lesiones/equipo/
   modalidades, **ninguna** sustitución devuelve un item que viole una exclusión dura; el
   escalado respeta kcal ±8% **y** los tres macros, o se marca `aproximado`; el estado de
   conjunto vacío se devuelve correctamente y nunca un item prohibido.
8. `catalogo.test.ts` — fuzz de **combinaciones adversariales** de exclusiones (no dietas
   sueltas): o hay candidato válido, o el estado vacío es la salida; nunca una violación.
9. `plan.total.test.ts` (FUZZ, el crítico) — miles de perfiles aleatorios (con campos
   faltantes, extremos y combinaciones raras): `generarPlan` **nunca lanza** y siempre
   devuelve un plan válido (kcal ≥ suelo, macros cuadran, rutina cubre volumen, sin
   exclusiones violadas) o un plan de bloqueo coherente.
10. `determinismo.test.ts` — misma entrada, misma salida (hash estable del Plan).
11. `checkin.test.ts` — con ≥2 semanas el ajuste corrige 100–200 kcal respetando suelo; con
    <2 confianza 'baja'; pesos imposibles se descartan.

## Pendiente para fases siguientes (app y proxy, no en el motor)
- App: revalidar localmente la propuesta del LLM antes de aplicarla (defensa en profundidad);
  indicador de origen del texto; timeout corto del LLM (3–5 s) con caída al respaldo;
  consentimiento RGPD explícito y **modo LLM opt-in** (motor local por defecto); cifrado en
  reposo o aviso de que no lo está; "borrar todos mis datos"; migraciones envueltas en
  try/catch con recuperación; estados vacíos del día 1; saliencia del aviso médico por
  jerarquía tipográfica, no solo color; señales de parada del ejercicio destacadas.
- Proxy: el LLM solo devuelve `id` + código de motivo de un conjunto cerrado (el texto lo
  pone la app con plantillas traducidas); si se permite texto generado, validarlo (sin
  dígitos nuevos, lista negra de temas, longitud máxima); sanear `noGusta`/`preferencias`
  contra inyección; tope global de coste (circuit breaker) => 503 `{fallback:true}`; CORS
  al origen de la demo, rate-limit, helmet; sin logs de datos corporales.
