import type { Locale } from '@brio/motor'

// Nombres legibles de alimentos y ejercicios para la interfaz.
//
// El motor es la fuente de verdad de los ids y de los números, pero no expone sus catálogos
// (su `package.json` solo publica la API por `exports`, y Metro la respeta). Como las pantallas
// necesitan mostrar el nombre de cada alimento y ejercicio, lo resolvemos aquí, en la capa de
// presentación. Los ids son los del catálogo del motor; si algún día aparece uno nuevo que no
// esté en esta tabla, el respaldo lo convierte en una etiqueta legible en vez de romper nada.

type Nombre = Record<Locale, string>

const ALIMENTOS: Record<string, Nombre> = {
  pechuga_pollo: { es: 'Pechuga de pollo', ca: 'Pit de pollastre', en: 'Chicken breast' },
  pavo_pechuga: { es: 'Pechuga de pavo', ca: 'Pit de gall dindi', en: 'Turkey breast' },
  ternera_magra: { es: 'Ternera magra', ca: 'Vedella magra', en: 'Lean beef' },
  cerdo_lomo: { es: 'Lomo de cerdo', ca: 'Llom de porc', en: 'Pork loin' },
  huevo_entero: { es: 'Huevo entero', ca: 'Ou sencer', en: 'Whole egg' },
  clara_huevo: { es: 'Clara de huevo', ca: "Clara d'ou", en: 'Egg white' },
  salmon: { es: 'Salmón', ca: 'Salmó', en: 'Salmon' },
  atun_lata_agua: { es: 'Atún al natural', ca: 'Tonyina al natural', en: 'Tuna in water' },
  merluza: { es: 'Merluza', ca: 'Lluç', en: 'Hake' },
  gambas: { es: 'Gambas', ca: 'Gambes', en: 'Shrimp' },
  mejillones: { es: 'Mejillones', ca: 'Musclos', en: 'Mussels' },
  yogur_griego: { es: 'Yogur griego', ca: 'Iogurt grec', en: 'Greek yogurt' },
  queso_batido_0: { es: 'Queso batido 0%', ca: 'Formatge batut 0%', en: 'Fat-free quark' },
  requeson: { es: 'Requesón', ca: 'Mató', en: 'Cottage cheese' },
  leche_semidesnatada: { es: 'Leche semidesnatada', ca: 'Llet semidesnatada', en: 'Semi-skimmed milk' },
  queso_curado: { es: 'Queso curado', ca: 'Formatge curat', en: 'Cured cheese' },
  tofu_firme: { es: 'Tofu firme', ca: 'Tofu ferm', en: 'Firm tofu' },
  tempeh: { es: 'Tempeh', ca: 'Tempeh', en: 'Tempeh' },
  seitan: { es: 'Seitán', ca: 'Seitan', en: 'Seitan' },
  proteina_guisante: { es: 'Proteína de guisante', ca: 'Proteïna de pèsol', en: 'Pea protein' },
  lentejas_cocidas: { es: 'Lentejas cocidas', ca: 'Llenties cuites', en: 'Cooked lentils' },
  garbanzos_cocidos: { es: 'Garbanzos cocidos', ca: 'Cigrons cuits', en: 'Cooked chickpeas' },
  alubias_negras: { es: 'Alubias negras', ca: 'Mongetes negres', en: 'Black beans' },
  edamame: { es: 'Edamame', ca: 'Edamame', en: 'Edamame' },
  altramuces: { es: 'Altramuces', ca: 'Tramussos', en: 'Lupini beans' },
  arroz_blanco_cocido: { es: 'Arroz blanco cocido', ca: 'Arròs blanc cuit', en: 'Cooked white rice' },
  arroz_integral_cocido: { es: 'Arroz integral cocido', ca: 'Arròs integral cuit', en: 'Cooked brown rice' },
  pasta_cocida: { es: 'Pasta cocida', ca: 'Pasta cuita', en: 'Cooked pasta' },
  pan_integral: { es: 'Pan integral', ca: 'Pa integral', en: 'Whole wheat bread' },
  avena: { es: 'Avena', ca: 'Civada', en: 'Oats' },
  patata_cocida: { es: 'Patata cocida', ca: 'Patata bullida', en: 'Boiled potato' },
  boniato: { es: 'Boniato', ca: 'Moniato', en: 'Sweet potato' },
  quinoa_cocida: { es: 'Quinoa cocida', ca: 'Quinoa cuita', en: 'Cooked quinoa' },
  pan_molde_blanco: { es: 'Pan de molde blanco', ca: 'Pa de motlle blanc', en: 'White sandwich bread' },
  tortitas_maiz: { es: 'Tortitas de maíz', ca: 'Coques de blat de moro', en: 'Corn cakes' },
  couscous: { es: 'Cuscús cocido', ca: 'Cuscús cuit', en: 'Cooked couscous' },
  platano: { es: 'Plátano', ca: 'Plàtan', en: 'Banana' },
  manzana: { es: 'Manzana', ca: 'Poma', en: 'Apple' },
  arandanos: { es: 'Arándanos', ca: 'Nabius', en: 'Blueberries' },
  brocoli: { es: 'Brócoli', ca: 'Bròquil', en: 'Broccoli' },
  espinacas: { es: 'Espinacas', ca: 'Espinacs', en: 'Spinach' },
  pimiento_rojo: { es: 'Pimiento rojo', ca: 'Pebrot vermell', en: 'Red pepper' },
  calabacin: { es: 'Calabacín', ca: 'Carbassó', en: 'Zucchini' },
  zanahoria: { es: 'Zanahoria', ca: 'Pastanaga', en: 'Carrot' },
  tomate: { es: 'Tomate', ca: 'Tomàquet', en: 'Tomato' },
  champinones: { es: 'Champiñones', ca: 'Xampinyons', en: 'Mushrooms' },
  aceite_oliva: { es: 'Aceite de oliva', ca: "Oli d'oliva", en: 'Olive oil' },
  aguacate: { es: 'Aguacate', ca: 'Alvocat', en: 'Avocado' },
  almendras: { es: 'Almendras', ca: 'Ametlles', en: 'Almonds' },
  nueces: { es: 'Nueces', ca: 'Nous', en: 'Walnuts' },
  crema_cacahuete: { es: 'Crema de cacahuete', ca: 'Crema de cacauet', en: 'Peanut butter' },
  semillas_chia: { es: 'Semillas de chía', ca: 'Llavors de chia', en: 'Chia seeds' },
  tahini: { es: 'Tahini', ca: 'Tahini', en: 'Tahini' },
  aceite_coco: { es: 'Aceite de coco', ca: 'Oli de coco', en: 'Coconut oil' },
  hummus: { es: 'Hummus', ca: 'Hummus', en: 'Hummus' },
}

const EJERCICIOS: Record<string, Nombre> = {
  sentadilla_barra: { es: 'Sentadilla con barra', ca: 'Esquat amb barra', en: 'Barbell squat' },
  sentadilla_goblet_mancuerna: { es: 'Sentadilla goblet con mancuerna', ca: 'Esquat goblet amb manuella', en: 'Goblet squat' },
  prensa_piernas_maquina: { es: 'Prensa de piernas', ca: 'Premsa de cames', en: 'Leg press' },
  sentadilla_peso_corporal: { es: 'Sentadilla sin peso', ca: 'Esquat sense pes', en: 'Bodyweight squat' },
  sentadilla_hack_maquina: { es: 'Sentadilla hack', ca: 'Esquat hack', en: 'Hack squat' },
  zancadas_mancuernas: { es: 'Zancadas con mancuernas', ca: 'Tisores amb manuelles', en: 'Dumbbell lunges' },
  peso_muerto_barra: { es: 'Peso muerto con barra', ca: 'Pes mort amb barra', en: 'Barbell deadlift' },
  peso_muerto_rumano_mancuernas: { es: 'Peso muerto rumano con mancuernas', ca: 'Pes mort romanès amb manuelles', en: 'Dumbbell Romanian deadlift' },
  hip_thrust_barra: { es: 'Empuje de cadera con barra', ca: 'Hip thrust amb barra', en: 'Barbell hip thrust' },
  curl_femoral_maquina: { es: 'Curl femoral en máquina', ca: 'Curl femoral a màquina', en: 'Machine leg curl' },
  buenos_dias_barra: { es: 'Buenos días con barra', ca: 'Bon dia amb barra', en: 'Barbell good morning' },
  swing_kettlebell: { es: 'Swing con kettlebell', ca: 'Swing amb kettlebell', en: 'Kettlebell swing' },
  peso_muerto_rumano_banda: { es: 'Peso muerto rumano con banda', ca: 'Pes mort romanès amb banda', en: 'Band Romanian deadlift' },
  press_banca_barra: { es: 'Press de banca con barra', ca: 'Press de banca amb barra', en: 'Barbell bench press' },
  press_banca_mancuernas: { es: 'Press de banca con mancuernas', ca: 'Press de banca amb manuelles', en: 'Dumbbell bench press' },
  press_pecho_maquina: { es: 'Press de pecho en máquina', ca: 'Press de pit a màquina', en: 'Machine chest press' },
  flexiones: { es: 'Flexiones', ca: 'Flexions', en: 'Push-ups' },
  cruce_poleas_pecho: { es: 'Cruce de poleas', ca: 'Creuament de politges', en: 'Cable crossover' },
  aperturas_mancuernas: { es: 'Aperturas con mancuernas', ca: 'Obertures amb manuelles', en: 'Dumbbell fly' },
  press_pecho_banda: { es: 'Press de pecho con banda', ca: 'Press de pit amb banda', en: 'Band chest press' },
  remo_barra: { es: 'Remo con barra', ca: 'Rem amb barra', en: 'Barbell row' },
  remo_mancuerna: { es: 'Remo con mancuerna', ca: 'Rem amb manuella', en: 'Dumbbell row' },
  remo_maquina: { es: 'Remo en máquina', ca: 'Rem a màquina', en: 'Machine row' },
  remo_polea_bajo: { es: 'Remo en polea baja', ca: 'Rem a politja baixa', en: 'Seated cable row' },
  remo_invertido: { es: 'Remo invertido', ca: 'Rem invertit', en: 'Inverted row' },
  remo_banda: { es: 'Remo con banda', ca: 'Rem amb banda', en: 'Band row' },
  press_militar_barra: { es: 'Press militar con barra', ca: 'Press militar amb barra', en: 'Barbell overhead press' },
  press_hombro_mancuernas: { es: 'Press de hombro con mancuernas', ca: "Press d'espatlla amb manuelles", en: 'Dumbbell shoulder press' },
  press_hombro_maquina: { es: 'Press de hombro en máquina', ca: "Press d'espatlla a màquina", en: 'Machine shoulder press' },
  elevaciones_laterales_mancuernas: { es: 'Elevaciones laterales con mancuernas', ca: 'Elevacions laterals amb manuelles', en: 'Dumbbell lateral raise' },
  press_hombro_banda: { es: 'Press de hombro con banda', ca: "Press d'espatlla amb banda", en: 'Band shoulder press' },
  elevaciones_laterales_polea: { es: 'Elevaciones laterales en polea', ca: 'Elevacions laterals a politja', en: 'Cable lateral raise' },
  dominadas: { es: 'Dominadas', ca: 'Dominades', en: 'Pull-ups' },
  jalon_polea: { es: 'Jalón en polea', ca: 'Jalament a politja', en: 'Lat pulldown' },
  jalon_maquina: { es: 'Jalón en máquina', ca: 'Jalament a màquina', en: 'Machine pulldown' },
  dominadas_asistidas_banda: { es: 'Dominadas asistidas con banda', ca: 'Dominades assistides amb banda', en: 'Band-assisted pull-ups' },
  pullover_mancuerna: { es: 'Pullover con mancuerna', ca: 'Pullover amb manuella', en: 'Dumbbell pullover' },
  plancha: { es: 'Plancha', ca: 'Planxa', en: 'Plank' },
  crunch_polea: { es: 'Crunch en polea', ca: 'Crunch a politja', en: 'Cable crunch' },
  rueda_abdominal: { es: 'Rueda abdominal', ca: 'Roda abdominal', en: 'Ab wheel rollout' },
  elevacion_piernas: { es: 'Elevación de piernas', ca: 'Elevació de cames', en: 'Leg raises' },
  pallof_polea: { es: 'Press Pallof en polea', ca: 'Press Pallof a politja', en: 'Cable Pallof press' },
  curl_biceps_mancuernas: { es: 'Curl de bíceps con mancuernas', ca: 'Curl de bíceps amb manuelles', en: 'Dumbbell biceps curl' },
  curl_biceps_barra: { es: 'Curl de bíceps con barra', ca: 'Curl de bíceps amb barra', en: 'Barbell biceps curl' },
  curl_biceps_polea: { es: 'Curl de bíceps en polea', ca: 'Curl de bíceps a politja', en: 'Cable biceps curl' },
  curl_biceps_banda: { es: 'Curl de bíceps con banda', ca: 'Curl de bíceps amb banda', en: 'Band biceps curl' },
  extension_triceps_polea: { es: 'Extensión de tríceps en polea', ca: 'Extensió de tríceps a politja', en: 'Cable triceps pushdown' },
  press_frances_barra: { es: 'Press francés con barra', ca: 'Press francès amb barra', en: 'Barbell skull crusher' },
  fondos_triceps: { es: 'Fondos de tríceps', ca: 'Fons de tríceps', en: 'Triceps dips' },
  extension_triceps_mancuerna: { es: 'Extensión de tríceps con mancuerna', ca: 'Extensió de tríceps amb manuella', en: 'Dumbbell triceps extension' },
  patada_triceps_banda: { es: 'Patada de tríceps con banda', ca: 'Puntada de tríceps amb banda', en: 'Band triceps kickback' },
  elevacion_gemelos_maquina: { es: 'Elevación de gemelos en máquina', ca: 'Elevació de bessons a màquina', en: 'Machine calf raise' },
  elevacion_gemelos_mancuernas: { es: 'Elevación de gemelos con mancuernas', ca: 'Elevació de bessons amb manuelles', en: 'Dumbbell calf raise' },
  elevacion_gemelos_peso_corporal: { es: 'Elevación de gemelos sin peso', ca: 'Elevació de bessons sense pes', en: 'Bodyweight calf raise' },
}

// Respaldo: convierte un id en snake_case en una etiqueta legible, por si el catálogo del
// motor crece con un id que aún no esté aquí. Mejor una etiqueta tosca que un hueco en blanco.
function legibleDesdeId(id: string): string {
  const limpio = id.replace(/_/g, ' ').trim()
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

export function nombreAlimento(id: string, locale: Locale): string {
  return ALIMENTOS[id]?.[locale] ?? legibleDesdeId(id)
}

export function nombreEjercicio(id: string, locale: Locale): string {
  return EJERCICIOS[id]?.[locale] ?? legibleDesdeId(id)
}

// Enlace a una demostración del ejercicio. El catálogo del motor todavía no trae un `demoUrl`,
// así que abrimos una búsqueda del nombre del ejercicio; cuando el motor publique la URL, se
// cambia solo aquí. No es un número ni una decisión del plan: es un atajo de la interfaz.
export function demoDeEjercicio(id: string, locale: Locale): string {
  const consulta = encodeURIComponent(`${nombreEjercicio(id, locale)} técnica`)
  return `https://www.youtube.com/results?search_query=${consulta}`
}
