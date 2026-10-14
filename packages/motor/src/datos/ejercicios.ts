import type { Equipo, Experiencia, GrupoMuscular, Locale, ModalidadRiesgo, Patron, Zona } from '../tipos'

// Catálogo semilla de ejercicios. Cada uno declara el grupo primario, los secundarios, el
// patrón de movimiento, el material con el que se puede hacer (basta tener uno), el nivel
// mínimo recomendado, las zonas que carga (y por tanto contraindican si hay lesión) y las
// modalidades de riesgo que implica. Los ids son estables en snake_case.

export interface Ejercicio {
  id: string
  nombre: Record<Locale, string>
  grupo: GrupoMuscular
  secundarios: GrupoMuscular[]
  patron: Patron
  equipo: Equipo[]
  nivel: Experiencia
  contraindica: Zona[]
  modalidades: ModalidadRiesgo[]
  obsoleto?: boolean
}

export const EJERCICIOS: readonly Ejercicio[] = [
  // --- Sentadilla (cuádriceps / glúteos) ---
  { id: 'sentadilla_barra', nombre: { es: 'Sentadilla con barra', ca: 'Esquat amb barra', en: 'Barbell squat' }, grupo: 'cuadriceps', secundarios: ['gluteos', 'isquios'], patron: 'sentadilla', equipo: ['barra'], nivel: 'intermedio', contraindica: ['rodilla', 'lumbar'], modalidades: ['carga_axial', 'valsalva'] },
  { id: 'sentadilla_goblet_mancuerna', nombre: { es: 'Sentadilla goblet con mancuerna', ca: 'Esquat goblet amb manuella', en: 'Goblet squat' }, grupo: 'cuadriceps', secundarios: ['gluteos'], patron: 'sentadilla', equipo: ['mancuernas', 'kettlebell'], nivel: 'principiante', contraindica: ['rodilla'], modalidades: [] },
  { id: 'prensa_piernas_maquina', nombre: { es: 'Prensa de piernas', ca: 'Premsa de cames', en: 'Leg press' }, grupo: 'cuadriceps', secundarios: ['gluteos'], patron: 'sentadilla', equipo: ['maquina'], nivel: 'principiante', contraindica: ['rodilla'], modalidades: [] },
  { id: 'sentadilla_peso_corporal', nombre: { es: 'Sentadilla sin peso', ca: 'Esquat sense pes', en: 'Bodyweight squat' }, grupo: 'cuadriceps', secundarios: ['gluteos'], patron: 'sentadilla', equipo: ['peso_corporal', 'bandas'], nivel: 'principiante', contraindica: ['rodilla'], modalidades: [] },
  { id: 'sentadilla_hack_maquina', nombre: { es: 'Sentadilla hack', ca: 'Esquat hack', en: 'Hack squat' }, grupo: 'cuadriceps', secundarios: ['gluteos'], patron: 'sentadilla', equipo: ['maquina'], nivel: 'intermedio', contraindica: ['rodilla'], modalidades: ['carga_axial'] },
  { id: 'zancadas_mancuernas', nombre: { es: 'Zancadas con mancuernas', ca: 'Tisores amb manuelles', en: 'Dumbbell lunges' }, grupo: 'cuadriceps', secundarios: ['gluteos', 'isquios'], patron: 'sentadilla', equipo: ['mancuernas'], nivel: 'principiante', contraindica: ['rodilla'], modalidades: [] },

  // --- Bisagra de cadera (isquios / glúteos) ---
  { id: 'peso_muerto_barra', nombre: { es: 'Peso muerto con barra', ca: 'Pes mort amb barra', en: 'Barbell deadlift' }, grupo: 'isquios', secundarios: ['gluteos', 'espalda'], patron: 'bisagra', equipo: ['barra'], nivel: 'avanzado', contraindica: ['lumbar'], modalidades: ['carga_axial', 'valsalva'] },
  { id: 'peso_muerto_rumano_mancuernas', nombre: { es: 'Peso muerto rumano con mancuernas', ca: 'Pes mort romanès amb manuelles', en: 'Dumbbell Romanian deadlift' }, grupo: 'isquios', secundarios: ['gluteos'], patron: 'bisagra', equipo: ['mancuernas'], nivel: 'intermedio', contraindica: ['lumbar'], modalidades: [] },
  { id: 'hip_thrust_barra', nombre: { es: 'Empuje de cadera con barra', ca: 'Hip thrust amb barra', en: 'Barbell hip thrust' }, grupo: 'gluteos', secundarios: ['isquios'], patron: 'bisagra', equipo: ['barra', 'maquina'], nivel: 'intermedio', contraindica: [], modalidades: [] },
  { id: 'curl_femoral_maquina', nombre: { es: 'Curl femoral en máquina', ca: 'Curl femoral a màquina', en: 'Machine leg curl' }, grupo: 'isquios', secundarios: [], patron: 'aislado', equipo: ['maquina'], nivel: 'principiante', contraindica: ['rodilla'], modalidades: [] },
  { id: 'buenos_dias_barra', nombre: { es: 'Buenos días con barra', ca: 'Bon dia amb barra', en: 'Barbell good morning' }, grupo: 'isquios', secundarios: ['gluteos', 'espalda'], patron: 'bisagra', equipo: ['barra'], nivel: 'avanzado', contraindica: ['lumbar'], modalidades: ['carga_axial', 'valsalva'] },
  { id: 'swing_kettlebell', nombre: { es: 'Swing con kettlebell', ca: 'Swing amb kettlebell', en: 'Kettlebell swing' }, grupo: 'gluteos', secundarios: ['isquios', 'espalda'], patron: 'bisagra', equipo: ['kettlebell'], nivel: 'intermedio', contraindica: ['lumbar'], modalidades: [] },
  { id: 'peso_muerto_rumano_banda', nombre: { es: 'Peso muerto rumano con banda', ca: 'Pes mort romanès amb banda', en: 'Band Romanian deadlift' }, grupo: 'isquios', secundarios: ['gluteos'], patron: 'bisagra', equipo: ['bandas'], nivel: 'principiante', contraindica: ['lumbar'], modalidades: [] },

  // --- Empuje horizontal (pecho) ---
  { id: 'press_banca_barra', nombre: { es: 'Press de banca con barra', ca: 'Press de banca amb barra', en: 'Barbell bench press' }, grupo: 'pecho', secundarios: ['triceps', 'hombro'], patron: 'empuje_horizontal', equipo: ['barra'], nivel: 'intermedio', contraindica: ['hombro'], modalidades: ['supino'] },
  { id: 'press_banca_mancuernas', nombre: { es: 'Press de banca con mancuernas', ca: 'Press de banca amb manuelles', en: 'Dumbbell bench press' }, grupo: 'pecho', secundarios: ['triceps', 'hombro'], patron: 'empuje_horizontal', equipo: ['mancuernas'], nivel: 'intermedio', contraindica: ['hombro'], modalidades: ['supino'] },
  { id: 'press_pecho_maquina', nombre: { es: 'Press de pecho en máquina', ca: 'Press de pit a màquina', en: 'Machine chest press' }, grupo: 'pecho', secundarios: ['triceps', 'hombro'], patron: 'empuje_horizontal', equipo: ['maquina'], nivel: 'principiante', contraindica: ['hombro'], modalidades: [] },
  { id: 'flexiones', nombre: { es: 'Flexiones', ca: 'Flexions', en: 'Push-ups' }, grupo: 'pecho', secundarios: ['triceps', 'hombro'], patron: 'empuje_horizontal', equipo: ['peso_corporal', 'bandas'], nivel: 'principiante', contraindica: ['muneca', 'hombro'], modalidades: [] },
  { id: 'cruce_poleas_pecho', nombre: { es: 'Cruce de poleas', ca: 'Creuament de politges', en: 'Cable crossover' }, grupo: 'pecho', secundarios: [], patron: 'aislado', equipo: ['polea'], nivel: 'intermedio', contraindica: ['hombro'], modalidades: [] },
  { id: 'aperturas_mancuernas', nombre: { es: 'Aperturas con mancuernas', ca: 'Obertures amb manuelles', en: 'Dumbbell fly' }, grupo: 'pecho', secundarios: [], patron: 'aislado', equipo: ['mancuernas'], nivel: 'intermedio', contraindica: ['hombro'], modalidades: ['supino'] },
  { id: 'press_pecho_banda', nombre: { es: 'Press de pecho con banda', ca: 'Press de pit amb banda', en: 'Band chest press' }, grupo: 'pecho', secundarios: ['triceps'], patron: 'empuje_horizontal', equipo: ['bandas'], nivel: 'principiante', contraindica: ['hombro'], modalidades: [] },

  // --- Tracción horizontal (espalda) ---
  { id: 'remo_barra', nombre: { es: 'Remo con barra', ca: 'Rem amb barra', en: 'Barbell row' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_horizontal', equipo: ['barra'], nivel: 'intermedio', contraindica: ['lumbar'], modalidades: [] },
  { id: 'remo_mancuerna', nombre: { es: 'Remo con mancuerna', ca: 'Rem amb manuella', en: 'Dumbbell row' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_horizontal', equipo: ['mancuernas'], nivel: 'principiante', contraindica: [], modalidades: [] },
  { id: 'remo_maquina', nombre: { es: 'Remo en máquina', ca: 'Rem a màquina', en: 'Machine row' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_horizontal', equipo: ['maquina'], nivel: 'principiante', contraindica: [], modalidades: [] },
  { id: 'remo_polea_bajo', nombre: { es: 'Remo en polea baja', ca: 'Rem a politja baixa', en: 'Seated cable row' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_horizontal', equipo: ['polea'], nivel: 'principiante', contraindica: [], modalidades: [] },
  { id: 'remo_invertido', nombre: { es: 'Remo invertido', ca: 'Rem invertit', en: 'Inverted row' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_horizontal', equipo: ['peso_corporal', 'barra'], nivel: 'principiante', contraindica: [], modalidades: [] },
  { id: 'remo_banda', nombre: { es: 'Remo con banda', ca: 'Rem amb banda', en: 'Band row' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_horizontal', equipo: ['bandas'], nivel: 'principiante', contraindica: [], modalidades: [] },

  // --- Empuje vertical (hombro) ---
  { id: 'press_militar_barra', nombre: { es: 'Press militar con barra', ca: 'Press militar amb barra', en: 'Barbell overhead press' }, grupo: 'hombro', secundarios: ['triceps'], patron: 'empuje_vertical', equipo: ['barra'], nivel: 'intermedio', contraindica: ['hombro', 'lumbar'], modalidades: ['carga_axial', 'valsalva'] },
  { id: 'press_hombro_mancuernas', nombre: { es: 'Press de hombro con mancuernas', ca: "Press d'espatlla amb manuelles", en: 'Dumbbell shoulder press' }, grupo: 'hombro', secundarios: ['triceps'], patron: 'empuje_vertical', equipo: ['mancuernas'], nivel: 'intermedio', contraindica: ['hombro'], modalidades: [] },
  { id: 'press_hombro_maquina', nombre: { es: 'Press de hombro en máquina', ca: "Press d'espatlla a màquina", en: 'Machine shoulder press' }, grupo: 'hombro', secundarios: ['triceps'], patron: 'empuje_vertical', equipo: ['maquina'], nivel: 'principiante', contraindica: ['hombro'], modalidades: [] },
  { id: 'elevaciones_laterales_mancuernas', nombre: { es: 'Elevaciones laterales con mancuernas', ca: 'Elevacions laterals amb manuelles', en: 'Dumbbell lateral raise' }, grupo: 'hombro', secundarios: [], patron: 'aislado', equipo: ['mancuernas'], nivel: 'principiante', contraindica: ['hombro'], modalidades: [] },
  { id: 'press_hombro_banda', nombre: { es: 'Press de hombro con banda', ca: "Press d'espatlla amb banda", en: 'Band shoulder press' }, grupo: 'hombro', secundarios: ['triceps'], patron: 'empuje_vertical', equipo: ['bandas'], nivel: 'principiante', contraindica: ['hombro'], modalidades: [] },
  { id: 'elevaciones_laterales_polea', nombre: { es: 'Elevaciones laterales en polea', ca: 'Elevacions laterals a politja', en: 'Cable lateral raise' }, grupo: 'hombro', secundarios: [], patron: 'aislado', equipo: ['polea'], nivel: 'intermedio', contraindica: ['hombro'], modalidades: [] },

  // --- Tracción vertical (espalda/dorsal) ---
  { id: 'dominadas', nombre: { es: 'Dominadas', ca: 'Dominades', en: 'Pull-ups' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_vertical', equipo: ['peso_corporal', 'barra'], nivel: 'intermedio', contraindica: ['hombro', 'codo'], modalidades: [] },
  { id: 'jalon_polea', nombre: { es: 'Jalón en polea', ca: 'Jalament a politja', en: 'Lat pulldown' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_vertical', equipo: ['polea'], nivel: 'principiante', contraindica: ['hombro'], modalidades: [] },
  { id: 'jalon_maquina', nombre: { es: 'Jalón en máquina', ca: 'Jalament a màquina', en: 'Machine pulldown' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_vertical', equipo: ['maquina'], nivel: 'principiante', contraindica: ['hombro'], modalidades: [] },
  { id: 'dominadas_asistidas_banda', nombre: { es: 'Dominadas asistidas con banda', ca: 'Dominades assistides amb banda', en: 'Band-assisted pull-ups' }, grupo: 'espalda', secundarios: ['biceps'], patron: 'traccion_vertical', equipo: ['bandas'], nivel: 'principiante', contraindica: ['hombro', 'codo'], modalidades: [] },
  { id: 'pullover_mancuerna', nombre: { es: 'Pullover con mancuerna', ca: 'Pullover amb manuella', en: 'Dumbbell pullover' }, grupo: 'espalda', secundarios: ['pecho'], patron: 'traccion_vertical', equipo: ['mancuernas'], nivel: 'intermedio', contraindica: ['hombro'], modalidades: ['supino'] },

  // --- Core / abdomen ---
  { id: 'plancha', nombre: { es: 'Plancha', ca: 'Planxa', en: 'Plank' }, grupo: 'abdomen', secundarios: [], patron: 'core', equipo: ['peso_corporal'], nivel: 'principiante', contraindica: ['lumbar'], modalidades: ['isometrico_intenso'] },
  { id: 'crunch_polea', nombre: { es: 'Crunch en polea', ca: 'Crunch a politja', en: 'Cable crunch' }, grupo: 'abdomen', secundarios: [], patron: 'core', equipo: ['polea'], nivel: 'principiante', contraindica: [], modalidades: [] },
  { id: 'rueda_abdominal', nombre: { es: 'Rueda abdominal', ca: 'Roda abdominal', en: 'Ab wheel rollout' }, grupo: 'abdomen', secundarios: [], patron: 'core', equipo: ['peso_corporal'], nivel: 'avanzado', contraindica: ['lumbar'], modalidades: ['isometrico_intenso'] },
  { id: 'elevacion_piernas', nombre: { es: 'Elevación de piernas', ca: 'Elevació de cames', en: 'Leg raises' }, grupo: 'abdomen', secundarios: [], patron: 'core', equipo: ['peso_corporal'], nivel: 'principiante', contraindica: ['lumbar'], modalidades: [] },
  { id: 'pallof_polea', nombre: { es: 'Press Pallof en polea', ca: 'Press Pallof a politja', en: 'Cable Pallof press' }, grupo: 'abdomen', secundarios: [], patron: 'core', equipo: ['polea', 'bandas'], nivel: 'principiante', contraindica: [], modalidades: [] },

  // --- Aislado: bíceps ---
  { id: 'curl_biceps_mancuernas', nombre: { es: 'Curl de bíceps con mancuernas', ca: 'Curl de bíceps amb manuelles', en: 'Dumbbell biceps curl' }, grupo: 'biceps', secundarios: [], patron: 'aislado', equipo: ['mancuernas'], nivel: 'principiante', contraindica: ['codo'], modalidades: [] },
  { id: 'curl_biceps_barra', nombre: { es: 'Curl de bíceps con barra', ca: 'Curl de bíceps amb barra', en: 'Barbell biceps curl' }, grupo: 'biceps', secundarios: [], patron: 'aislado', equipo: ['barra'], nivel: 'principiante', contraindica: ['codo'], modalidades: [] },
  { id: 'curl_biceps_polea', nombre: { es: 'Curl de bíceps en polea', ca: 'Curl de bíceps a politja', en: 'Cable biceps curl' }, grupo: 'biceps', secundarios: [], patron: 'aislado', equipo: ['polea'], nivel: 'principiante', contraindica: ['codo'], modalidades: [] },
  { id: 'curl_biceps_banda', nombre: { es: 'Curl de bíceps con banda', ca: 'Curl de bíceps amb banda', en: 'Band biceps curl' }, grupo: 'biceps', secundarios: [], patron: 'aislado', equipo: ['bandas'], nivel: 'principiante', contraindica: ['codo'], modalidades: [] },

  // --- Aislado: tríceps ---
  { id: 'extension_triceps_polea', nombre: { es: 'Extensión de tríceps en polea', ca: 'Extensió de tríceps a politja', en: 'Cable triceps pushdown' }, grupo: 'triceps', secundarios: [], patron: 'aislado', equipo: ['polea'], nivel: 'principiante', contraindica: ['codo'], modalidades: [] },
  { id: 'press_frances_barra', nombre: { es: 'Press francés con barra', ca: 'Press francès amb barra', en: 'Barbell skull crusher' }, grupo: 'triceps', secundarios: [], patron: 'aislado', equipo: ['barra'], nivel: 'intermedio', contraindica: ['codo'], modalidades: ['supino'] },
  { id: 'fondos_triceps', nombre: { es: 'Fondos de tríceps', ca: 'Fons de tríceps', en: 'Triceps dips' }, grupo: 'triceps', secundarios: ['pecho', 'hombro'], patron: 'empuje_vertical', equipo: ['peso_corporal'], nivel: 'intermedio', contraindica: ['hombro', 'codo'], modalidades: [] },
  { id: 'extension_triceps_mancuerna', nombre: { es: 'Extensión de tríceps con mancuerna', ca: 'Extensió de tríceps amb manuella', en: 'Dumbbell triceps extension' }, grupo: 'triceps', secundarios: [], patron: 'aislado', equipo: ['mancuernas'], nivel: 'principiante', contraindica: ['codo'], modalidades: [] },
  { id: 'patada_triceps_banda', nombre: { es: 'Patada de tríceps con banda', ca: 'Puntada de tríceps amb banda', en: 'Band triceps kickback' }, grupo: 'triceps', secundarios: [], patron: 'aislado', equipo: ['bandas'], nivel: 'principiante', contraindica: ['codo'], modalidades: [] },

  // --- Aislado: gemelos ---
  { id: 'elevacion_gemelos_maquina', nombre: { es: 'Elevación de gemelos en máquina', ca: 'Elevació de bessons a màquina', en: 'Machine calf raise' }, grupo: 'gemelos', secundarios: [], patron: 'aislado', equipo: ['maquina'], nivel: 'principiante', contraindica: ['tobillo'], modalidades: [] },
  { id: 'elevacion_gemelos_mancuernas', nombre: { es: 'Elevación de gemelos con mancuernas', ca: 'Elevació de bessons amb manuelles', en: 'Dumbbell calf raise' }, grupo: 'gemelos', secundarios: [], patron: 'aislado', equipo: ['mancuernas', 'kettlebell'], nivel: 'principiante', contraindica: ['tobillo'], modalidades: [] },
  { id: 'elevacion_gemelos_peso_corporal', nombre: { es: 'Elevación de gemelos sin peso', ca: 'Elevació de bessons sense pes', en: 'Bodyweight calf raise' }, grupo: 'gemelos', secundarios: [], patron: 'aislado', equipo: ['peso_corporal'], nivel: 'principiante', contraindica: ['tobillo'], modalidades: [] },
]

const PORID = new Map<string, Ejercicio>(EJERCICIOS.map((e) => [e.id, e]))

export function ejercicioPorId(id: string): Ejercicio | undefined {
  return PORID.get(id)
}
