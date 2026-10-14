import {
  Activity,
  Armchair,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  Scale,
  Zap,
  type LucideIcon,
} from 'lucide-react-native'
import type {
  Alergeno,
  Equipo,
  Experiencia,
  Medicamento,
  NivelActividad,
  Objetivo,
  PatronDietetico,
  Zona,
} from '@brio/motor'

import type { ClaveI18n } from '@/i18n/es'

// Catálogos de opciones del onboarding. Cada opción apunta a su clave de traducción (y a su
// descripción e icono cuando los lleva), nunca a texto suelto. Los ids coinciden con los
// valores que espera el motor; los de alimentos son ids reales del catálogo.

export interface OpcionTarjeta<T extends string> {
  valor: T
  clave: ClaveI18n
  desc: ClaveI18n
  icono: LucideIcon
}

export interface OpcionSimple<T extends string> {
  valor: T
  clave: ClaveI18n
}

export const OBJETIVOS: OpcionTarjeta<Objetivo>[] = [
  { valor: 'ganar_musculo', clave: 'objetivo.ganar_musculo', desc: 'objetivo.ganar_musculo.desc', icono: Dumbbell },
  { valor: 'perder_grasa', clave: 'objetivo.perder_grasa', desc: 'objetivo.perder_grasa.desc', icono: Flame },
  { valor: 'mantenimiento', clave: 'objetivo.mantenimiento', desc: 'objetivo.mantenimiento.desc', icono: Scale },
  { valor: 'fuerza', clave: 'objetivo.fuerza', desc: 'objetivo.fuerza.desc', icono: Zap },
]

// Orden intencionado de menos a más movimiento, para que el apoyo "elige el de abajo" tenga
// sentido y empuje a no sobreestimar.
export const ACTIVIDADES: OpcionTarjeta<NivelActividad>[] = [
  { valor: 'muy_activo', clave: 'actividad.muy_activo', desc: 'actividad.muy_activo.desc', icono: Flame },
  { valor: 'activo', clave: 'actividad.activo', desc: 'actividad.activo.desc', icono: Activity },
  { valor: 'moderado', clave: 'actividad.moderado', desc: 'actividad.moderado.desc', icono: Bike },
  { valor: 'ligero', clave: 'actividad.ligero', desc: 'actividad.ligero.desc', icono: Footprints },
  { valor: 'sedentario', clave: 'actividad.sedentario', desc: 'actividad.sedentario.desc', icono: Armchair },
]

export const EXPERIENCIAS: OpcionTarjeta<Experiencia>[] = [
  { valor: 'principiante', clave: 'experiencia.principiante', desc: 'experiencia.principiante.desc', icono: Footprints },
  { valor: 'intermedio', clave: 'experiencia.intermedio', desc: 'experiencia.intermedio.desc', icono: Activity },
  { valor: 'avanzado', clave: 'experiencia.avanzado', desc: 'experiencia.avanzado.desc', icono: Flame },
]

export const EQUIPOS: OpcionSimple<Equipo>[] = [
  { valor: 'barra', clave: 'equipo.barra' },
  { valor: 'mancuernas', clave: 'equipo.mancuernas' },
  { valor: 'maquina', clave: 'equipo.maquina' },
  { valor: 'polea', clave: 'equipo.polea' },
  { valor: 'peso_corporal', clave: 'equipo.peso_corporal' },
  { valor: 'bandas', clave: 'equipo.bandas' },
  { valor: 'kettlebell', clave: 'equipo.kettlebell' },
]

export const ZONAS: OpcionSimple<Zona>[] = [
  { valor: 'rodilla', clave: 'zona.rodilla' },
  { valor: 'hombro', clave: 'zona.hombro' },
  { valor: 'lumbar', clave: 'zona.lumbar' },
  { valor: 'codo', clave: 'zona.codo' },
  { valor: 'muneca', clave: 'zona.muneca' },
  { valor: 'cadera', clave: 'zona.cadera' },
  { valor: 'cuello', clave: 'zona.cuello' },
  { valor: 'tobillo', clave: 'zona.tobillo' },
]

export const MEDICAMENTOS: OpcionSimple<Medicamento>[] = [
  { valor: 'betabloqueante', clave: 'med.betabloqueante' },
  { valor: 'insulina', clave: 'med.insulina' },
  { valor: 'antidiabetico_oral', clave: 'med.antidiabetico_oral' },
  { valor: 'corticoide', clave: 'med.corticoide' },
  { valor: 'diuretico', clave: 'med.diuretico' },
  { valor: 'tiroideo', clave: 'med.tiroideo' },
  { valor: 'anticoagulante', clave: 'med.anticoagulante' },
]

export const DIETAS: OpcionSimple<PatronDietetico>[] = [
  { valor: 'omnivoro', clave: 'dieta.omnivoro' },
  { valor: 'vegetariano', clave: 'dieta.vegetariano' },
  { valor: 'vegano', clave: 'dieta.vegano' },
  { valor: 'sin_gluten', clave: 'dieta.sin_gluten' },
  { valor: 'sin_lactosa', clave: 'dieta.sin_lactosa' },
  { valor: 'pescetariano', clave: 'dieta.pescetariano' },
  { valor: 'halal', clave: 'dieta.halal' },
]

// Alérgenos e intolerancias comparten catálogo: lo que cambia es si es exclusión de alergia o
// de intolerancia (dos listas separadas en el perfil).
export const ALERGENOS: OpcionSimple<Alergeno>[] = [
  { valor: 'gluten', clave: 'alergeno.gluten' },
  { valor: 'lactosa', clave: 'alergeno.lactosa' },
  { valor: 'lacteos', clave: 'alergeno.lacteos' },
  { valor: 'huevo', clave: 'alergeno.huevo' },
  { valor: 'frutos_secos', clave: 'alergeno.frutos_secos' },
  { valor: 'cacahuete', clave: 'alergeno.cacahuete' },
  { valor: 'soja', clave: 'alergeno.soja' },
  { valor: 'pescado', clave: 'alergeno.pescado' },
  { valor: 'marisco', clave: 'alergeno.marisco' },
  { valor: 'sesamo', clave: 'alergeno.sesamo' },
  { valor: 'apio', clave: 'alergeno.apio' },
  { valor: 'mostaza', clave: 'alergeno.mostaza' },
  { valor: 'sulfitos', clave: 'alergeno.sulfitos' },
  { valor: 'altramuces', clave: 'alergeno.altramuces' },
]

// Lo que no gusta sale como ids reales del catálogo del motor (exclusión blanda), nunca texto
// libre. Un puñado de alimentos comunes y reconocibles; el resto se gestiona más adelante.
export const NO_GUSTA: { id: string; clave: ClaveI18n }[] = [
  { id: 'pechuga_pollo', clave: 'alimento.pechuga_pollo' },
  { id: 'salmon', clave: 'alimento.salmon' },
  { id: 'huevo_entero', clave: 'alimento.huevo_entero' },
  { id: 'tofu_firme', clave: 'alimento.tofu_firme' },
  { id: 'lentejas_cocidas', clave: 'alimento.lentejas_cocidas' },
  { id: 'brocoli', clave: 'alimento.brocoli' },
  { id: 'espinacas', clave: 'alimento.espinacas' },
  { id: 'champinones', clave: 'alimento.champinones' },
  { id: 'queso_curado', clave: 'alimento.queso_curado' },
  { id: 'aguacate', clave: 'alimento.aguacate' },
  { id: 'boniato', clave: 'alimento.boniato' },
  { id: 'avena', clave: 'alimento.avena' },
]
