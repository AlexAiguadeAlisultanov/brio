import type { Alergeno, Locale, PatronDietetico } from '../tipos'

// Catálogo semilla de alimentos. Valores por 100 g, tomados de rangos nutricionales
// habituales (USDA / BEDCA redondeados). Los ids son estables en snake_case: no se
// borran nunca; si un alimento queda obsoleto se marca con `obsoleto`, no se elimina,
// para no dejar históricos huérfanos.

export type CategoriaAlimento =
  | 'proteina'
  | 'carbohidrato'
  | 'grasa'
  | 'verdura'
  | 'fruta'
  | 'lacteo'
  | 'mixto'

export interface Alimento {
  id: string
  nombre: Record<Locale, string>
  categoria: CategoriaAlimento
  kcal: number
  proteinaG: number
  carbosG: number
  grasaG: number
  fibraG: number
  alergenos: Alergeno[]
  // Dietas con las que el alimento es compatible. Un alimento es válido para un perfil
  // solo si cumple TODAS las dietas que el perfil declara.
  dietas: PatronDietetico[]
  obsoleto?: boolean
}

// Atajos de compatibilidad de dieta para no repetir listas largas.
const TODAS: PatronDietetico[] = ['omnivoro', 'vegetariano', 'vegano', 'sin_gluten', 'sin_lactosa', 'pescetariano', 'halal']
const VEGANO_SG_SL: PatronDietetico[] = ['omnivoro', 'vegetariano', 'vegano', 'sin_gluten', 'sin_lactosa', 'pescetariano', 'halal']
const VEGANO_CON_GLUTEN: PatronDietetico[] = ['omnivoro', 'vegetariano', 'vegano', 'sin_lactosa', 'pescetariano', 'halal']
const VEGETARIANO_LACTEO: PatronDietetico[] = ['omnivoro', 'vegetariano', 'sin_gluten', 'pescetariano', 'halal']
const CARNE_HALAL: PatronDietetico[] = ['omnivoro', 'sin_gluten', 'sin_lactosa', 'halal']
const CARNE_CERDO: PatronDietetico[] = ['omnivoro', 'sin_gluten', 'sin_lactosa']
const PESCADO: PatronDietetico[] = ['omnivoro', 'pescetariano', 'sin_gluten', 'sin_lactosa', 'halal']

export const ALIMENTOS: readonly Alimento[] = [
  // --- Proteína animal ---
  { id: 'pechuga_pollo', nombre: { es: 'Pechuga de pollo', ca: 'Pit de pollastre', en: 'Chicken breast' }, categoria: 'proteina', kcal: 165, proteinaG: 31, carbosG: 0, grasaG: 3.6, fibraG: 0, alergenos: [], dietas: CARNE_HALAL },
  { id: 'pavo_pechuga', nombre: { es: 'Pechuga de pavo', ca: 'Pit de gall dindi', en: 'Turkey breast' }, categoria: 'proteina', kcal: 135, proteinaG: 29, carbosG: 0, grasaG: 1, fibraG: 0, alergenos: [], dietas: CARNE_HALAL },
  { id: 'ternera_magra', nombre: { es: 'Ternera magra', ca: 'Vedella magra', en: 'Lean beef' }, categoria: 'proteina', kcal: 175, proteinaG: 26, carbosG: 0, grasaG: 7, fibraG: 0, alergenos: [], dietas: CARNE_HALAL },
  { id: 'cerdo_lomo', nombre: { es: 'Lomo de cerdo', ca: 'Llom de porc', en: 'Pork loin' }, categoria: 'proteina', kcal: 143, proteinaG: 27, carbosG: 0, grasaG: 3.5, fibraG: 0, alergenos: [], dietas: CARNE_CERDO },
  { id: 'huevo_entero', nombre: { es: 'Huevo entero', ca: 'Ou sencer', en: 'Whole egg' }, categoria: 'proteina', kcal: 143, proteinaG: 13, carbosG: 1.1, grasaG: 9.5, fibraG: 0, alergenos: ['huevo'], dietas: ['omnivoro', 'vegetariano', 'pescetariano', 'sin_gluten', 'sin_lactosa', 'halal'] },
  { id: 'clara_huevo', nombre: { es: 'Clara de huevo', ca: "Clara d'ou", en: 'Egg white' }, categoria: 'proteina', kcal: 52, proteinaG: 11, carbosG: 0.7, grasaG: 0.2, fibraG: 0, alergenos: ['huevo'], dietas: ['omnivoro', 'vegetariano', 'pescetariano', 'sin_gluten', 'sin_lactosa', 'halal'] },
  { id: 'salmon', nombre: { es: 'Salmón', ca: 'Salmó', en: 'Salmon' }, categoria: 'proteina', kcal: 208, proteinaG: 20, carbosG: 0, grasaG: 13, fibraG: 0, alergenos: ['pescado'], dietas: PESCADO },
  { id: 'atun_lata_agua', nombre: { es: 'Atún al natural', ca: 'Tonyina al natural', en: 'Tuna in water' }, categoria: 'proteina', kcal: 116, proteinaG: 26, carbosG: 0, grasaG: 1, fibraG: 0, alergenos: ['pescado'], dietas: PESCADO },
  { id: 'merluza', nombre: { es: 'Merluza', ca: 'Lluç', en: 'Hake' }, categoria: 'proteina', kcal: 90, proteinaG: 18, carbosG: 0, grasaG: 1.8, fibraG: 0, alergenos: ['pescado'], dietas: PESCADO },
  { id: 'gambas', nombre: { es: 'Gambas', ca: 'Gambes', en: 'Shrimp' }, categoria: 'proteina', kcal: 99, proteinaG: 24, carbosG: 0.2, grasaG: 0.3, fibraG: 0, alergenos: ['marisco'], dietas: PESCADO },
  { id: 'mejillones', nombre: { es: 'Mejillones', ca: 'Musclos', en: 'Mussels' }, categoria: 'proteina', kcal: 86, proteinaG: 12, carbosG: 3.7, grasaG: 2.2, fibraG: 0, alergenos: ['marisco'], dietas: PESCADO },

  // --- Lácteos ---
  { id: 'yogur_griego', nombre: { es: 'Yogur griego', ca: 'Iogurt grec', en: 'Greek yogurt' }, categoria: 'lacteo', kcal: 97, proteinaG: 9, carbosG: 3.6, grasaG: 5, fibraG: 0, alergenos: ['lactosa', 'lacteos'], dietas: VEGETARIANO_LACTEO },
  { id: 'queso_batido_0', nombre: { es: 'Queso batido 0%', ca: 'Formatge batut 0%', en: 'Fat-free quark' }, categoria: 'lacteo', kcal: 72, proteinaG: 12, carbosG: 4, grasaG: 0.2, fibraG: 0, alergenos: ['lactosa', 'lacteos'], dietas: VEGETARIANO_LACTEO },
  { id: 'requeson', nombre: { es: 'Requesón', ca: 'Mató', en: 'Cottage cheese' }, categoria: 'lacteo', kcal: 98, proteinaG: 11, carbosG: 3.4, grasaG: 4.3, fibraG: 0, alergenos: ['lactosa', 'lacteos'], dietas: VEGETARIANO_LACTEO },
  { id: 'leche_semidesnatada', nombre: { es: 'Leche semidesnatada', ca: 'Llet semidesnatada', en: 'Semi-skimmed milk' }, categoria: 'lacteo', kcal: 46, proteinaG: 3.3, carbosG: 4.8, grasaG: 1.6, fibraG: 0, alergenos: ['lactosa', 'lacteos'], dietas: VEGETARIANO_LACTEO },
  { id: 'queso_curado', nombre: { es: 'Queso curado', ca: 'Formatge curat', en: 'Cured cheese' }, categoria: 'lacteo', kcal: 400, proteinaG: 25, carbosG: 1.4, grasaG: 33, fibraG: 0, alergenos: ['lactosa', 'lacteos'], dietas: VEGETARIANO_LACTEO },

  // --- Proteína vegetal ---
  { id: 'tofu_firme', nombre: { es: 'Tofu firme', ca: 'Tofu ferm', en: 'Firm tofu' }, categoria: 'proteina', kcal: 144, proteinaG: 15, carbosG: 3, grasaG: 8, fibraG: 1, alergenos: ['soja'], dietas: VEGANO_SG_SL },
  { id: 'tempeh', nombre: { es: 'Tempeh', ca: 'Tempeh', en: 'Tempeh' }, categoria: 'proteina', kcal: 192, proteinaG: 20, carbosG: 8, grasaG: 11, fibraG: 5, alergenos: ['soja'], dietas: VEGANO_SG_SL },
  { id: 'seitan', nombre: { es: 'Seitán', ca: 'Seitan', en: 'Seitan' }, categoria: 'proteina', kcal: 141, proteinaG: 25, carbosG: 14, grasaG: 2, fibraG: 1, alergenos: ['gluten'], dietas: VEGANO_CON_GLUTEN },
  { id: 'proteina_guisante', nombre: { es: 'Proteína de guisante', ca: 'Proteïna de pèsol', en: 'Pea protein' }, categoria: 'proteina', kcal: 375, proteinaG: 80, carbosG: 7, grasaG: 6, fibraG: 6, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'lentejas_cocidas', nombre: { es: 'Lentejas cocidas', ca: 'Llenties cuites', en: 'Cooked lentils' }, categoria: 'proteina', kcal: 116, proteinaG: 9, carbosG: 20, grasaG: 0.4, fibraG: 8, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'garbanzos_cocidos', nombre: { es: 'Garbanzos cocidos', ca: 'Cigrons cuits', en: 'Cooked chickpeas' }, categoria: 'proteina', kcal: 164, proteinaG: 9, carbosG: 27, grasaG: 2.6, fibraG: 8, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'alubias_negras', nombre: { es: 'Alubias negras', ca: 'Mongetes negres', en: 'Black beans' }, categoria: 'proteina', kcal: 132, proteinaG: 8.9, carbosG: 24, grasaG: 0.5, fibraG: 8.7, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'edamame', nombre: { es: 'Edamame', ca: 'Edamame', en: 'Edamame' }, categoria: 'proteina', kcal: 121, proteinaG: 12, carbosG: 9, grasaG: 5, fibraG: 5, alergenos: ['soja'], dietas: VEGANO_SG_SL },
  { id: 'altramuces', nombre: { es: 'Altramuces', ca: 'Tramussos', en: 'Lupini beans' }, categoria: 'proteina', kcal: 119, proteinaG: 16, carbosG: 7, grasaG: 2.9, fibraG: 3, alergenos: ['altramuces'], dietas: VEGANO_SG_SL },

  // --- Carbohidratos ---
  { id: 'arroz_blanco_cocido', nombre: { es: 'Arroz blanco cocido', ca: 'Arròs blanc cuit', en: 'Cooked white rice' }, categoria: 'carbohidrato', kcal: 130, proteinaG: 2.7, carbosG: 28, grasaG: 0.3, fibraG: 0.4, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'arroz_integral_cocido', nombre: { es: 'Arroz integral cocido', ca: 'Arròs integral cuit', en: 'Cooked brown rice' }, categoria: 'carbohidrato', kcal: 112, proteinaG: 2.6, carbosG: 23, grasaG: 0.9, fibraG: 1.8, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'pasta_cocida', nombre: { es: 'Pasta cocida', ca: 'Pasta cuita', en: 'Cooked pasta' }, categoria: 'carbohidrato', kcal: 158, proteinaG: 5.8, carbosG: 31, grasaG: 0.9, fibraG: 1.8, alergenos: ['gluten'], dietas: VEGANO_CON_GLUTEN },
  { id: 'pan_integral', nombre: { es: 'Pan integral', ca: 'Pa integral', en: 'Whole wheat bread' }, categoria: 'carbohidrato', kcal: 247, proteinaG: 9, carbosG: 41, grasaG: 3.4, fibraG: 7, alergenos: ['gluten'], dietas: VEGANO_CON_GLUTEN },
  { id: 'avena', nombre: { es: 'Avena', ca: 'Civada', en: 'Oats' }, categoria: 'carbohidrato', kcal: 389, proteinaG: 16.9, carbosG: 66, grasaG: 6.9, fibraG: 10.6, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'patata_cocida', nombre: { es: 'Patata cocida', ca: 'Patata bullida', en: 'Boiled potato' }, categoria: 'carbohidrato', kcal: 87, proteinaG: 1.9, carbosG: 20, grasaG: 0.1, fibraG: 1.8, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'boniato', nombre: { es: 'Boniato', ca: 'Moniato', en: 'Sweet potato' }, categoria: 'carbohidrato', kcal: 90, proteinaG: 2, carbosG: 21, grasaG: 0.1, fibraG: 3.3, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'quinoa_cocida', nombre: { es: 'Quinoa cocida', ca: 'Quinoa cuita', en: 'Cooked quinoa' }, categoria: 'carbohidrato', kcal: 120, proteinaG: 4.4, carbosG: 21, grasaG: 1.9, fibraG: 2.8, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'pan_molde_blanco', nombre: { es: 'Pan de molde blanco', ca: 'Pa de motlle blanc', en: 'White sandwich bread' }, categoria: 'carbohidrato', kcal: 265, proteinaG: 9, carbosG: 49, grasaG: 3.2, fibraG: 2.7, alergenos: ['gluten'], dietas: VEGANO_CON_GLUTEN },
  { id: 'tortitas_maiz', nombre: { es: 'Tortitas de maíz', ca: 'Coques de blat de moro', en: 'Corn cakes' }, categoria: 'carbohidrato', kcal: 387, proteinaG: 7, carbosG: 82, grasaG: 2, fibraG: 2, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'couscous', nombre: { es: 'Cuscús cocido', ca: 'Cuscús cuit', en: 'Cooked couscous' }, categoria: 'carbohidrato', kcal: 112, proteinaG: 3.8, carbosG: 23, grasaG: 0.2, fibraG: 1.4, alergenos: ['gluten'], dietas: VEGANO_CON_GLUTEN },

  // --- Frutas ---
  { id: 'platano', nombre: { es: 'Plátano', ca: 'Plàtan', en: 'Banana' }, categoria: 'fruta', kcal: 89, proteinaG: 1.1, carbosG: 23, grasaG: 0.3, fibraG: 2.6, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'manzana', nombre: { es: 'Manzana', ca: 'Poma', en: 'Apple' }, categoria: 'fruta', kcal: 52, proteinaG: 0.3, carbosG: 14, grasaG: 0.2, fibraG: 2.4, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'arandanos', nombre: { es: 'Arándanos', ca: 'Nabius', en: 'Blueberries' }, categoria: 'fruta', kcal: 57, proteinaG: 0.7, carbosG: 14, grasaG: 0.3, fibraG: 2.4, alergenos: [], dietas: VEGANO_SG_SL },

  // --- Verduras ---
  { id: 'brocoli', nombre: { es: 'Brócoli', ca: 'Bròquil', en: 'Broccoli' }, categoria: 'verdura', kcal: 34, proteinaG: 2.8, carbosG: 7, grasaG: 0.4, fibraG: 2.6, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'espinacas', nombre: { es: 'Espinacas', ca: 'Espinacs', en: 'Spinach' }, categoria: 'verdura', kcal: 23, proteinaG: 2.9, carbosG: 3.6, grasaG: 0.4, fibraG: 2.2, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'pimiento_rojo', nombre: { es: 'Pimiento rojo', ca: 'Pebrot vermell', en: 'Red pepper' }, categoria: 'verdura', kcal: 31, proteinaG: 1, carbosG: 6, grasaG: 0.3, fibraG: 2.1, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'calabacin', nombre: { es: 'Calabacín', ca: 'Carbassó', en: 'Zucchini' }, categoria: 'verdura', kcal: 17, proteinaG: 1.2, carbosG: 3.1, grasaG: 0.3, fibraG: 1, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'zanahoria', nombre: { es: 'Zanahoria', ca: 'Pastanaga', en: 'Carrot' }, categoria: 'verdura', kcal: 41, proteinaG: 0.9, carbosG: 10, grasaG: 0.2, fibraG: 2.8, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'tomate', nombre: { es: 'Tomate', ca: 'Tomàquet', en: 'Tomato' }, categoria: 'verdura', kcal: 18, proteinaG: 0.9, carbosG: 3.9, grasaG: 0.2, fibraG: 1.2, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'champinones', nombre: { es: 'Champiñones', ca: 'Xampinyons', en: 'Mushrooms' }, categoria: 'verdura', kcal: 22, proteinaG: 3.1, carbosG: 3.3, grasaG: 0.3, fibraG: 1, alergenos: [], dietas: VEGANO_SG_SL },

  // --- Grasas ---
  { id: 'aceite_oliva', nombre: { es: 'Aceite de oliva', ca: "Oli d'oliva", en: 'Olive oil' }, categoria: 'grasa', kcal: 884, proteinaG: 0, carbosG: 0, grasaG: 100, fibraG: 0, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'aguacate', nombre: { es: 'Aguacate', ca: 'Alvocat', en: 'Avocado' }, categoria: 'grasa', kcal: 160, proteinaG: 2, carbosG: 9, grasaG: 15, fibraG: 6.7, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'almendras', nombre: { es: 'Almendras', ca: 'Ametlles', en: 'Almonds' }, categoria: 'grasa', kcal: 579, proteinaG: 21, carbosG: 22, grasaG: 49, fibraG: 12.5, alergenos: ['frutos_secos'], dietas: VEGANO_SG_SL },
  { id: 'nueces', nombre: { es: 'Nueces', ca: 'Nous', en: 'Walnuts' }, categoria: 'grasa', kcal: 654, proteinaG: 15, carbosG: 14, grasaG: 65, fibraG: 6.7, alergenos: ['frutos_secos'], dietas: VEGANO_SG_SL },
  { id: 'crema_cacahuete', nombre: { es: 'Crema de cacahuete', ca: 'Crema de cacauet', en: 'Peanut butter' }, categoria: 'grasa', kcal: 588, proteinaG: 25, carbosG: 20, grasaG: 50, fibraG: 6, alergenos: ['cacahuete'], dietas: VEGANO_SG_SL },
  { id: 'semillas_chia', nombre: { es: 'Semillas de chía', ca: 'Llavors de chia', en: 'Chia seeds' }, categoria: 'grasa', kcal: 486, proteinaG: 17, carbosG: 42, grasaG: 31, fibraG: 34, alergenos: [], dietas: VEGANO_SG_SL },
  { id: 'tahini', nombre: { es: 'Tahini', ca: 'Tahini', en: 'Tahini' }, categoria: 'grasa', kcal: 595, proteinaG: 17, carbosG: 21, grasaG: 54, fibraG: 9, alergenos: ['sesamo'], dietas: VEGANO_SG_SL },
  { id: 'aceite_coco', nombre: { es: 'Aceite de coco', ca: 'Oli de coco', en: 'Coconut oil' }, categoria: 'grasa', kcal: 892, proteinaG: 0, carbosG: 0, grasaG: 99, fibraG: 0, alergenos: [], dietas: VEGANO_SG_SL },

  // --- Mixtos ---
  { id: 'hummus', nombre: { es: 'Hummus', ca: 'Hummus', en: 'Hummus' }, categoria: 'mixto', kcal: 166, proteinaG: 7.9, carbosG: 14, grasaG: 9.6, fibraG: 6, alergenos: ['sesamo'], dietas: VEGANO_SG_SL },
]

const PORID = new Map<string, Alimento>(ALIMENTOS.map((a) => [a.id, a]))

export function alimentoPorId(id: string): Alimento | undefined {
  return PORID.get(id)
}

// `TODAS` y `VEGANO_SG_SL` son equivalentes hoy; se mantienen ambos nombres por claridad
// semántica al declarar cada alimento. Esta referencia evita el aviso de variable sin usar.
void TODAS
