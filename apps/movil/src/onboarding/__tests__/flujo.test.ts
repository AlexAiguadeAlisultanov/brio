// Pruebas del puente entre el onboarding y el motor: que el Perfil que armamos a partir del
// estado dispara los estados de seguridad correctos. No tocan React ni la interfaz; solo la
// función pura `construirPerfil` y la API del motor.

import { describe, expect, it } from 'vitest'
import { evaluarSeguridad, generarPlan } from '@brio/motor'

import { construirPerfil, cribadoVacio, type EstadoOnboarding } from '../estado'

function estadoBase(): EstadoOnboarding {
  return {
    objetivo: 'mantenimiento',
    sexo: 'hombre',
    edadAnios: 30,
    alturaCm: 180,
    pesoKg: 80,
    unidades: 'metrico',
    grasaModo: 'saltar',
    actividad: 'moderado',
    experiencia: 'intermedio',
    diasPorSemana: 4,
    duracionSesionMin: 60,
    equipo: ['barra', 'mancuernas'],
    lesiones: [],
    cribado: cribadoVacio(),
    patronDietetico: ['omnivoro'],
    alergias: [],
    intolerancias: [],
    noGustaIds: [],
    comidasPorDia: 4,
  }
}

describe('construirPerfil', () => {
  it('aplica defaults seguros cuando faltan campos', () => {
    const perfil = construirPerfil({
      unidades: 'metrico',
      grasaModo: 'saltar',
      equipo: [],
      lesiones: [],
      cribado: cribadoVacio(),
      patronDietetico: [],
      alergias: [],
      intolerancias: [],
      noGustaIds: [],
    })
    expect(perfil.equipo).toEqual(['peso_corporal'])
    expect(perfil.patronDietetico).toEqual(['omnivoro'])
    expect(perfil.comidasPorDia).toBe(4)
    expect(perfil.grasaPct).toBeUndefined()
  })

  it('solo pasa grasaPct al motor cuando está medido', () => {
    const medido = construirPerfil({ ...estadoBase(), grasaModo: 'medido', grasaPct: 18 })
    expect(medido.grasaPct).toBe(18)
    const estimado = construirPerfil({ ...estadoBase(), grasaModo: 'estimar', grasaPct: 18 })
    expect(estimado.grasaPct).toBeUndefined()
  })
})

describe('estados de seguridad del plan', () => {
  it('un adulto sano recibe un plan completo con cifras', () => {
    const perfil = construirPerfil(estadoBase())
    const plan = generarPlan(perfil, 'mantenimiento')
    expect(plan.bloqueado).toBe(false)
    expect(plan.ocultarCifras).toBe(false)
    expect(plan.energia?.kcalObjetivo).toBeGreaterThan(0)
    expect(plan.macros?.proteinaG).toBeGreaterThan(0)
  })

  it('un menor de edad queda bloqueado sin cifras', () => {
    const perfil = construirPerfil({ ...estadoBase(), edadAnios: 16 })
    const plan = generarPlan(perfil, 'mantenimiento')
    expect(plan.bloqueado).toBe(true)
    expect(plan.seguridad.motivoBloqueo).toBe('menor_edad')
    expect(plan.energia).toBeUndefined()
  })

  it('una altura imposible bloquea por antropometría inválida', () => {
    const perfil = construirPerfil({ ...estadoBase(), alturaCm: 110 })
    const plan = generarPlan(perfil, 'mantenimiento')
    expect(plan.bloqueado).toBe(true)
    expect(plan.seguridad.motivoBloqueo).toBe('antropometria_invalida')
  })

  it('dos positivos en SCOFF ocultan las cifras', () => {
    const cribado = { ...cribadoVacio(), scoffVomitar: true, scoffSeVeGordo: true }
    const perfil = construirPerfil({ ...estadoBase(), objetivo: 'perder_grasa', cribado })
    const plan = generarPlan(perfil, 'perder_grasa')
    expect(plan.ocultarCifras).toBe(true)
    expect(plan.macros).toBeUndefined()
  })

  it('el embarazo deja ver el plan como orientación', () => {
    const cribado = { ...cribadoVacio(), embarazoLactancia: true }
    const perfil = construirPerfil({ ...estadoBase(), cribado })
    const informe = evaluarSeguridad(perfil, 'mantenimiento')
    expect(informe.derivar).toBe(true)
    const plan = generarPlan(perfil, 'mantenimiento')
    expect(plan.derivar).toBe(true)
    expect(plan.bloqueado).toBe(false)
  })
})
