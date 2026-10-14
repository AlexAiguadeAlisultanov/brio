import { describe, expect, it } from 'vitest'
import { ajustarPorFeedback, type EstadoEjercicio, progresar } from '../progresion'

function estado(sobre: Partial<EstadoEjercicio> = {}): EstadoEjercicio {
  return {
    ejercicioId: 'sentadilla_barra',
    grupo: 'cuadriceps',
    pesoKg: 100,
    repsConseguidas: 6,
    repsObjetivo: { min: 3, max: 6 },
    rirObjetivo: 2,
    estancamientos: 0,
    ...sobre,
  }
}

describe('progresión lineal (novato)', () => {
  it('al tope de reps sube +2.5 en tren inferior', () => {
    const r = progresar(estado({ repsConseguidas: 6 }), 'principiante')
    expect(r.cambio).toBe('subir_carga')
    expect(r.pesoKg).toBe(102.5)
  })
  it('al tope de reps sube +1.25 en tren superior', () => {
    const r = progresar(estado({ grupo: 'pecho', pesoKg: 60, repsConseguidas: 6 }), 'principiante')
    expect(r.cambio).toBe('subir_carga')
    expect(r.pesoKg).toBe(61.25)
  })
})

describe('doble progresión (intermedio/avanzado)', () => {
  it('dentro del rango sube una repetición antes que la carga', () => {
    const r = progresar(estado({ repsObjetivo: { min: 6, max: 12 }, repsConseguidas: 8 }), 'avanzado')
    expect(r.cambio).toBe('subir_reps')
    expect(r.pesoKg).toBe(100)
    expect(r.repsObjetivo).toBe(9)
  })
})

describe('ningún salto supera el 10%', () => {
  it('el incremento está acotado al 10% del peso', () => {
    for (const peso of [5, 20, 60, 100, 200]) {
      const r = progresar(estado({ pesoKg: peso, repsConseguidas: 6 }), 'intermedio')
      expect(r.pesoKg / peso).toBeLessThanOrEqual(1.1 + 1e-9)
    }
  })
})

describe('descarga tras dos estancamientos', () => {
  it('dos estancamientos disparan la descarga (~-10%)', () => {
    const r = progresar(estado({ estancamientos: 2 }), 'intermedio')
    expect(r.cambio).toBe('descarga')
    expect(r.descarga).toBe(true)
    expect(r.pesoKg).toBe(90)
    expect(r.estancamientos).toBe(0)
  })
  it('un fallo acumula estancamiento y encadenar dos lleva a la descarga', () => {
    const primero = progresar(estado({ repsConseguidas: 2, estancamientos: 0 }), 'intermedio')
    expect(primero.cambio).toBe('mantener')
    expect(primero.estancamientos).toBe(1)
    const segundo = progresar(estado({ repsConseguidas: 2, estancamientos: 1 }), 'intermedio')
    expect(segundo.estancamientos).toBe(2)
    const tercero = progresar(estado({ repsConseguidas: 2, estancamientos: 2 }), 'intermedio')
    expect(tercero.cambio).toBe('descarga')
  })
})

describe('feedback', () => {
  it("'dificil' baja el estímulo", () => {
    const r = ajustarPorFeedback(estado({ pesoKg: 100 }), 'dificil')
    expect(r.cambio).toBe('bajar_estimulo')
    expect(r.pesoKg).toBeLessThan(100)
  })
  it("'ok' lo mantiene", () => {
    const r = ajustarPorFeedback(estado({ pesoKg: 100 }), 'ok')
    expect(r.pesoKg).toBe(100)
  })
})
