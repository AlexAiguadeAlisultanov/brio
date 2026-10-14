// Lista de la compra: pura, sobre un plan real del motor. Comprueba que suma por alimento y que
// escala con los días, sin tocar React ni la interfaz.

import { describe, expect, it } from 'vitest'
import { generarPlan, type Cribado, type Perfil } from '@brio/motor'

import { listaDeLaCompra } from '../compra'

function cribadoVacio(): Cribado {
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

function perfilSano(parcial: Partial<Perfil> = {}): Perfil {
  return {
    sexo: 'hombre',
    edadAnios: 30,
    alturaCm: 180,
    pesoKg: 80,
    actividad: 'moderado',
    experiencia: 'intermedio',
    diasPorSemana: 4,
    duracionSesionMin: 60,
    equipo: ['barra', 'mancuernas', 'maquina', 'polea'],
    lesiones: [],
    cribado: cribadoVacio(),
    patronDietetico: ['omnivoro'],
    alergias: [],
    intolerancias: [],
    noGustaIds: [],
    comidasPorDia: 4,
    ...parcial,
  }
}

describe('lista de la compra', () => {
  it('suma los gramos de cada alimento del día y los multiplica por los días', () => {
    const plan = generarPlan(perfilSano(), 'mantenimiento')
    const lista = listaDeLaCompra(plan, 7)
    expect(lista.length).toBeGreaterThan(0)

    // Gramos por alimento en un solo día, calculados a mano desde el plan.
    const porDia = new Map<string, number>()
    for (const comida of plan.comidas ?? []) {
      for (const alimento of comida.alimentos) {
        porDia.set(alimento.id, (porDia.get(alimento.id) ?? 0) + alimento.gramos)
      }
    }
    for (const item of lista) {
      expect(item.gramos).toBe(Math.round((porDia.get(item.alimentoId) ?? 0) * 7))
    }
  })

  it('no repite un alimento aunque aparezca en varias comidas', () => {
    const plan = generarPlan(perfilSano(), 'ganar_musculo')
    const lista = listaDeLaCompra(plan)
    const ids = lista.map((i) => i.alimentoId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('escala con los días: una semana es siete veces un día', () => {
    const plan = generarPlan(perfilSano(), 'mantenimiento')
    const unDia = listaDeLaCompra(plan, 1)
    const semana = listaDeLaCompra(plan, 7)
    const mapaDia = new Map(unDia.map((i) => [i.alimentoId, i.gramos]))
    for (const item of semana) {
      expect(item.gramos).toBe((mapaDia.get(item.alimentoId) ?? 0) * 7)
    }
  })

  it('un plan sin comidas (bloqueado) da una lista vacía sin lanzar', () => {
    const bloqueado = generarPlan(perfilSano({ edadAnios: 15 }), 'perder_grasa')
    expect(listaDeLaCompra(bloqueado)).toEqual([])
  })
})
