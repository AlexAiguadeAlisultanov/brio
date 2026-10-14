import { describe, expect, it } from 'vitest'
import { energiaBase, evaluarSeguridad, limitarKcal } from '../seguridad'
import { cribadoLimpio, perfilBase } from './_helpers'

describe('bloqueos duros', () => {
  it('menor de edad bloquea y deriva a pediatra', () => {
    const info = evaluarSeguridad(perfilBase({ edadAnios: 16 }), 'perder_grasa')
    expect(info.bloquea).toBe(true)
    expect(info.motivoBloqueo).toBe('menor_edad')
    expect(info.derivar).toBe(true)
    expect(info.avisos).toContain('derivar_pediatra')
  })

  it('antropometría inválida bloquea', () => {
    const info = evaluarSeguridad(perfilBase({ pesoKg: 500 }), 'mantenimiento')
    expect(info.bloquea).toBe(true)
    expect(info.motivoBloqueo).toBe('antropometria_invalida')
  })
})

describe('TCA', () => {
  it('SCOFF >= 2 oculta cifras, deriva y fuerza mantenimiento', () => {
    const c = cribadoLimpio()
    c.scoffVomitar = true
    c.scoffSeVeGordo = true
    const info = evaluarSeguridad(perfilBase({ cribado: c }), 'perder_grasa')
    expect(info.ocultarCifras).toBe(true)
    expect(info.derivar).toBe(true)
    expect(info.objetivoEfectivo).toBe('mantenimiento')
    expect(info.banderas).toContain('tca')
  })

  it('perder_grasa con IMC < 20 oculta cifras', () => {
    // 50 kg / 1.75^2 = IMC 16.3
    const info = evaluarSeguridad(perfilBase({ pesoKg: 50, alturaCm: 175 }), 'perder_grasa')
    expect(info.ocultarCifras).toBe(true)
    expect(info.objetivoEfectivo).toBe('mantenimiento')
  })
})

describe('embarazo/lactancia', () => {
  it('fuerza mantenimiento y deriva', () => {
    const c = cribadoLimpio()
    c.embarazoLactancia = true
    const info = evaluarSeguridad(perfilBase({ sexo: 'mujer', cribado: c }), 'perder_grasa')
    expect(info.objetivoEfectivo).toBe('mantenimiento')
    expect(info.derivar).toBe(true)
    expect(info.banderas).toContain('embarazo_lactancia')
  })
})

describe('PAR-Q en rojo', () => {
  it('deriva y veta modalidades de riesgo', () => {
    const c = cribadoLimpio()
    c.dolorPecho = true
    const info = evaluarSeguridad(perfilBase({ cribado: c }), 'fuerza')
    expect(info.derivar).toBe(true)
    expect(info.sinMaximas).toBe(true)
    expect(info.modalidadesVetadas).toEqual(expect.arrayContaining(['valsalva', 'isometrico_intenso', 'carga_axial']))
  })
})

describe('patología cardiovascular / tensión alta', () => {
  it('veta modalidades de riesgo', () => {
    const c = cribadoLimpio()
    c.enfermedadCardiovascular = true
    const info = evaluarSeguridad(perfilBase({ cribado: c }), 'ganar_musculo')
    expect(info.modalidadesVetadas).toEqual(expect.arrayContaining(['valsalva', 'carga_axial']))
    expect(info.banderas).toContain('cardiovascular')
  })
})

describe('enfermedad renal/hepática', () => {
  it('fija tope de proteína 1.2 g/kg y deriva', () => {
    const c = cribadoLimpio()
    c.enfermedadRenalHepatica = true
    const info = evaluarSeguridad(perfilBase({ cribado: c }), 'ganar_musculo')
    expect(info.topeProteinaGkg).toBe(1.2)
    expect(info.derivar).toBe(true)
    expect(info.banderas).toContain('renal_hepatica')
  })
})

describe('edad >= 65', () => {
  it('levanta bandera y pide sin máximas', () => {
    const info = evaluarSeguridad(perfilBase({ edadAnios: 70 }), 'fuerza')
    expect(info.banderas).toContain('edad_avanzada')
    expect(info.sinMaximas).toBe(true)
    expect(info.avisos).toContain('edad_fuerza_submaxima')
  })
})

describe('suelo calórico nunca se cruza y déficit recortado', () => {
  it('déficit máximo del 25% del TDEE', () => {
    const perfil = perfilBase({ sexo: 'hombre', pesoKg: 90, alturaCm: 185, actividad: 'muy_activo' })
    const eb = energiaBase(perfil)
    const lim = limitarKcal(perfil, 'perder_grasa', eb)
    expect(lim.kcal).toBeGreaterThanOrEqual(Math.round(eb.tdee * 0.75) - 1)
  })

  it('EA < 30 frena el déficit agresivo subiendo kcal', () => {
    // Mujer muy ligera y muy activa: el déficit haría caer la energía disponible.
    const perfil = perfilBase({ sexo: 'mujer', pesoKg: 48, alturaCm: 168, edadAnios: 25, actividad: 'muy_activo', duracionSesionMin: 90, diasPorSemana: 6 })
    const eb = energiaBase(perfil)
    const lim = limitarKcal(perfil, 'perder_grasa', eb)
    const ea = (lim.kcal - eb.gastoEjercicioDiaKcal) / eb.masaMagraKg
    expect(ea).toBeGreaterThanOrEqual(29.5)
  })

  it('suelo por encima del TDEE fuerza mantenimiento', () => {
    const perfil = perfilBase({ sexo: 'hombre', pesoKg: 45, alturaCm: 150, edadAnios: 25, actividad: 'sedentario' })
    const eb = energiaBase(perfil)
    const lim = limitarKcal(perfil, 'perder_grasa', eb)
    if (Math.max(1500, eb.bmr * 0.9) > eb.tdee) {
      expect(lim.objetivoEfectivo).toBe('mantenimiento')
    }
    expect(lim.kcal).toBeGreaterThanOrEqual(1500)
  })
})
