import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type {
  Alergeno,
  Cribado,
  Equipo,
  Experiencia,
  NivelActividad,
  Objetivo,
  PatronDietetico,
  Perfil,
  Sexo,
  Zona,
} from '@brio/motor'

import type { Unidades } from '@/db/repositorio'

// Estado compartido del onboarding. Vive en memoria mientras el usuario avanza por los pasos;
// solo al final se arma un Perfil completo y se persiste con el repositorio. Cada pantalla lee
// y escribe aquí, así nadie pierde lo que ya contestó al ir y volver entre pasos.

type ModoGrasa = 'medido' | 'estimar' | 'saltar'

export interface EstadoOnboarding {
  objetivo?: Objetivo
  sexo?: Sexo
  edadAnios?: number
  alturaCm?: number
  pesoKg?: number
  // Para unidades imperiales guardamos aparte lo que teclea el usuario y convertimos a métrico
  // al armar el Perfil. El motor siempre trabaja en cm/kg.
  unidades: Unidades
  grasaModo: ModoGrasa
  grasaPct?: number
  actividad?: NivelActividad
  experiencia?: Experiencia
  diasPorSemana?: number
  duracionSesionMin?: number
  equipo: Equipo[]
  preferenciaReparto?: 'full_body' | 'dividido'
  lesiones: Zona[]
  cribado: Cribado
  patronDietetico: PatronDietetico[]
  alergias: Alergeno[]
  intolerancias: Alergeno[]
  noGustaIds: string[]
  comidasPorDia?: number
}

export function cribadoVacio(): Cribado {
  return {
    problemaCorazon: false,
    dolorPecho: false,
    mareoDesmayo: false,
    problemaOseoArticular: false,
    tensionAlta: false,
    scoffVomitar: false,
    scoffPerderControl: false,
    scoffPerdido6kg3meses: false,
    scoffSeVeGordo: false,
    scoffComidaDomina: false,
    embarazoLactancia: false,
    enfermedadRenalHepatica: false,
    diabetes: false,
    enfermedadCardiovascular: false,
    medicamentos: [],
  }
}

function estadoInicial(): EstadoOnboarding {
  return {
    unidades: 'metrico',
    grasaModo: 'saltar',
    equipo: [],
    lesiones: [],
    cribado: cribadoVacio(),
    patronDietetico: [],
    alergias: [],
    intolerancias: [],
    noGustaIds: [],
  }
}

interface Contexto {
  estado: EstadoOnboarding
  actualizar: (parcial: Partial<EstadoOnboarding>) => void
  actualizarCribado: (parcial: Partial<Cribado>) => void
  reiniciar: () => void
}

const Ctx = createContext<Contexto | null>(null)

export function ProveedorOnboarding({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoOnboarding>(estadoInicial)

  const valor = useMemo<Contexto>(
    () => ({
      estado,
      actualizar: (parcial) => setEstado((e) => ({ ...e, ...parcial })),
      actualizarCribado: (parcial) => setEstado((e) => ({ ...e, cribado: { ...e.cribado, ...parcial } })),
      reiniciar: () => setEstado(estadoInicial()),
    }),
    [estado],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useOnboarding(): Contexto {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useOnboarding debe usarse dentro de <ProveedorOnboarding>')
  return ctx
}

// Arma el Perfil que espera el motor. Aplica valores por defecto seguros para los campos que
// no se hayan tocado, de modo que `generarPlan` siempre reciba un objeto completo. La altura y
// el peso ya llegan en métrico (la conversión imperial se hace en la pantalla del cuerpo).
export function construirPerfil(e: EstadoOnboarding): Perfil {
  return {
    sexo: e.sexo ?? 'hombre',
    edadAnios: e.edadAnios ?? 0,
    alturaCm: e.alturaCm ?? 0,
    pesoKg: e.pesoKg ?? 0,
    ...(e.grasaModo === 'medido' && e.grasaPct != null ? { grasaPct: e.grasaPct } : {}),
    actividad: e.actividad ?? 'sedentario',
    experiencia: e.experiencia ?? 'principiante',
    diasPorSemana: e.diasPorSemana ?? 3,
    duracionSesionMin: e.duracionSesionMin ?? 60,
    equipo: e.equipo.length > 0 ? e.equipo : ['peso_corporal'],
    lesiones: e.lesiones,
    cribado: e.cribado,
    patronDietetico: e.patronDietetico.length > 0 ? e.patronDietetico : ['omnivoro'],
    alergias: e.alergias,
    intolerancias: e.intolerancias,
    noGustaIds: e.noGustaIds,
    comidasPorDia: e.comidasPorDia ?? 4,
  }
}
