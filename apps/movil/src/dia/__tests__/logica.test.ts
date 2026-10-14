// Pruebas de la lógica del día a día conectada al motor. No tocan React ni la interfaz: solo
// funciones puras más la API pública de @brio/motor (sobres y respaldo determinista). El mismo
// runner que el motor (Vitest).

import { describe, expect, it } from 'vitest'
import { construirSobreComida, construirSobreEjercicio, generarPlan, type Cribado, type Perfil } from '@brio/motor'

import {
  alternativasComida,
  alternativasEjercicio,
  anilloCerrado,
  avanceSesion,
  diaSemanaLunes0,
  estadoEjercicio,
  fechaISO,
  objetivoDelDia,
  razonAnillo,
  sesionDeHoy,
  siguienteObjetivo,
  sumarConsumo,
} from '../logica'

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

describe('fecha y día de la semana', () => {
  it('fechaISO usa el día local en formato YYYY-MM-DD', () => {
    expect(fechaISO(new Date(2026, 9, 14))).toBe('2026-10-14')
  })
  it('diaSemanaLunes0 pone el lunes en 0 y el domingo en 6', () => {
    expect(diaSemanaLunes0(new Date(2026, 9, 12))).toBe(0) // lunes
    expect(diaSemanaLunes0(new Date(2026, 9, 18))).toBe(6) // domingo
  })
})

describe('anillos del día', () => {
  it('sumarConsumo trata los macros que falten como cero', () => {
    const total = sumarConsumo([{ macros: { kcal: 500, proteinaG: 40 } }, { macros: { kcal: 300, carbosG: 50 } }])
    expect(total.kcal).toBe(800)
    expect(total.proteinaG).toBe(40)
    expect(total.carbosG).toBe(50)
    expect(total.grasaG).toBe(0)
  })

  it('razonAnillo se acota a una vuelta y anilloCerrado detecta el cierre', () => {
    expect(razonAnillo(50, 100)).toBeCloseTo(0.5)
    expect(razonAnillo(150, 100)).toBe(1)
    expect(razonAnillo(10, 0)).toBe(0)
    expect(anilloCerrado(100, 100)).toBe(true)
    expect(anilloCerrado(90, 100)).toBe(false)
  })

  it('objetivoDelDia da cifras con plan completo y null cuando se bloquea o se esconde', () => {
    const completo = generarPlan(perfilSano(), 'mantenimiento')
    const obj = objetivoDelDia(completo)
    expect(obj).not.toBeNull()
    expect(obj!.kcal).toBeGreaterThan(0)
    expect(obj!.proteinaG).toBeGreaterThan(0)

    const menor = generarPlan(perfilSano({ edadAnios: 15 }), 'mantenimiento')
    expect(objetivoDelDia(menor)).toBeNull()

    const tca = generarPlan(
      perfilSano({ cribado: { ...cribadoVacio(), scoffVomitar: true, scoffSeVeGordo: true } }),
      'perder_grasa',
    )
    expect(tca.ocultarCifras).toBe(true)
    expect(objetivoDelDia(tca)).toBeNull()
  })
})

describe('sesión de hoy', () => {
  it('reparte las sesiones en los primeros días y deja el resto como descanso', () => {
    const plan = generarPlan(perfilSano({ diasPorSemana: 4 }), 'ganar_musculo')
    const n = plan.entrenamiento?.sesiones.length ?? 0
    expect(n).toBeGreaterThan(0)
    const lunes = sesionDeHoy(plan, 0)
    expect(lunes.descanso).toBe(false)
    const domingo = sesionDeHoy(plan, 6)
    expect(domingo.descanso).toBe(true)
  })

  it('avanceSesion cuenta las series marcadas sobre el total prescrito', () => {
    const plan = generarPlan(perfilSano(), 'ganar_musculo')
    const sesion = plan.entrenamiento!.sesiones[0]!
    const total = sesion.ejercicios.reduce((n, e) => n + e.series, 0)
    const hechas = [{ completada: true }, { completada: false }, { completada: true }]
    const a = avanceSesion(sesion.ejercicios, hechas)
    expect(a.total).toBe(total)
    expect(a.hechas).toBe(2)
  })
})

describe('progresión a partir del registro y el feedback', () => {
  it('sin ninguna serie con peso no hay estado para progresar', () => {
    const plan = generarPlan(perfilSano(), 'ganar_musculo')
    const ej = plan.entrenamiento!.sesiones[0]!.ejercicios[0]!
    expect(estadoEjercicio(ej, [{ completada: false }])).toBeNull()
    expect(siguienteObjetivo(ej, [], 'ok', 'intermedio')).toBeNull()
  })

  it('el feedback de la última sesión mueve la carga sugerida', () => {
    const plan = generarPlan(perfilSano(), 'ganar_musculo')
    const ej = plan.entrenamiento!.sesiones[0]!.ejercicios[0]!
    // Serie al tope del rango de reps, con carga 60: progresar normal sube la carga.
    const series = [{ pesoKg: 60, reps: ej.reps.max, completada: true }]
    const normal = siguienteObjetivo(ej, series, 'ok', 'intermedio')
    const facil = siguienteObjetivo(ej, series, 'facil', 'intermedio')
    const dificil = siguienteObjetivo(ej, series, 'dificil', 'intermedio')
    expect(normal!.pesoKg).toBeGreaterThan(60)
    expect(facil!.pesoKg).toBeGreaterThan(60)
    expect(dificil!.pesoKg).toBeLessThan(60)
  })
})

describe('alternativas de comida', () => {
  it('propone alternativas del motor con su delta frente al objetivo del hueco', () => {
    const perfil = perfilSano()
    const plan = generarPlan(perfil, 'mantenimiento')
    const comida = plan.comidas![0]!
    const sobre = construirSobreComida(plan, comida.id, perfil)
    const objetivo = { kcal: comida.objetivo.kcal, proteinaG: comida.objetivo.proteinaG, carbosG: comida.objetivo.carbosG, grasaG: comida.objetivo.grasaG }
    const alt = alternativasComida(sobre, objetivo)
    expect(alt.vacio).toBe(false)
    expect(alt.opciones.length).toBeGreaterThan(0)
    for (const op of alt.opciones) {
      expect(op.items.length).toBeGreaterThan(0)
      expect(typeof op.delta.kcal).toBe('number')
    }
  })

  it('un conjunto sin candidatos válidos devuelve el estado vacío', () => {
    const perfil = perfilSano()
    const plan = generarPlan(perfil, 'mantenimiento')
    const comida = plan.comidas![0]!
    const sobre = construirSobreComida(plan, comida.id, perfil)
    const objetivo = { kcal: comida.objetivo.kcal, proteinaG: comida.objetivo.proteinaG, carbosG: comida.objetivo.carbosG, grasaG: comida.objetivo.grasaG }
    const alt = alternativasComida({ ...sobre, candidatos: ['id_que_no_existe'] }, objetivo)
    expect(alt.vacio).toBe(true)
    expect(alt.opciones.length).toBe(0)
  })
})

describe('alternativas de ejercicio', () => {
  it('propone ejercicios del mismo grupo conservando el rango de reps', () => {
    const perfil = perfilSano()
    const plan = generarPlan(perfil, 'ganar_musculo')
    const ej = plan.entrenamiento!.sesiones[0]!.ejercicios[0]!
    const sobre = construirSobreEjercicio(plan, ej.id, perfil)
    const alt = alternativasEjercicio(sobre)
    expect(alt.vacio).toBe(false)
    expect(alt.opciones.length).toBeGreaterThan(0)
    for (const op of alt.opciones) {
      expect(op.reps.min).toBe(sobre.reps.min)
      expect(op.reps.max).toBe(sobre.reps.max)
      expect(op.ejercicioId).not.toBe(ej.ejercicioId)
    }
  })

  it('sin candidatos válidos devuelve el estado vacío', () => {
    const perfil = perfilSano()
    const plan = generarPlan(perfil, 'ganar_musculo')
    const ej = plan.entrenamiento!.sesiones[0]!.ejercicios[0]!
    const sobre = construirSobreEjercicio(plan, ej.id, perfil)
    const alt = alternativasEjercicio({ ...sobre, candidatos: ['no_existe'] })
    expect(alt.vacio).toBe(true)
  })
})
