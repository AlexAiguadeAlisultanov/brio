import { describe, expect, it } from 'vitest'
import {
  AJUSTE_OBJETIVO,
  FACTORES_ACTIVIDAD,
  bmrKatchMcArdle,
  bmrMifflin,
  calcularBmr,
  calcularTDEE,
  estimarGrasaDeurenberg,
  kcalObjetivoCrudo,
} from '../energia'
import { energiaBase, limitarKcal } from '../seguridad'
import { perfilBase } from './_helpers'

describe('BMR Mifflin-St Jeor', () => {
  it('hombre con valores conocidos', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(bmrMifflin(80, 180, 30, 'hombre')).toBe(1780)
  })
  it('mujer con valores conocidos', () => {
    // 10*70 + 6.25*165 - 5*30 - 161 = 1420.25
    expect(bmrMifflin(70, 165, 30, 'mujer')).toBeCloseTo(1420.25, 2)
  })
})

describe('BMR Katch-McArdle', () => {
  it('usa Katch cuando grasaPct es plausible', () => {
    // grasa 20% sobre 80 kg => LBM 64 => 370 + 21.6*64 = 1752.4
    const perfil = perfilBase({ pesoKg: 80, grasaPct: 20 })
    const res = calcularBmr(perfil)
    expect(res.metodo).toBe('katch')
    expect(res.estimado).toBe(false)
    expect(res.bmr).toBeCloseTo(1752.4, 1)
    expect(bmrKatchMcArdle(64)).toBeCloseTo(1752.4, 1)
  })
  it('cae a Mifflin y marca estimado cuando la grasa no es plausible', () => {
    const perfil = perfilBase({ grasaPct: 80 })
    const res = calcularBmr(perfil)
    expect(res.metodo).toBe('mifflin')
    expect(res.estimado).toBe(true)
  })
  it('cae a Mifflin cuando no hay grasaPct', () => {
    const res = calcularBmr(perfilBase({ grasaPct: undefined }))
    expect(res.metodo).toBe('mifflin')
    expect(res.estimado).toBe(true)
  })
})

describe('factores de actividad exactos', () => {
  it('coinciden con la tabla', () => {
    expect(FACTORES_ACTIVIDAD.sedentario).toBe(1.2)
    expect(FACTORES_ACTIVIDAD.ligero).toBe(1.375)
    expect(FACTORES_ACTIVIDAD.moderado).toBe(1.55)
    expect(FACTORES_ACTIVIDAD.activo).toBe(1.725)
    expect(FACTORES_ACTIVIDAD.muy_activo).toBe(1.9)
  })
  it('TDEE = BMR * factor', () => {
    expect(calcularTDEE(1800, 'moderado')).toBeCloseTo(2790, 6)
  })
})

describe('ajuste por objetivo y kcal objetivo', () => {
  it('fracciones exactas', () => {
    expect(AJUSTE_OBJETIVO.perder_grasa).toBe(-0.2)
    expect(AJUSTE_OBJETIVO.ganar_musculo).toBe(0.1)
    expect(AJUSTE_OBJETIVO.mantenimiento).toBe(0)
    expect(AJUSTE_OBJETIVO.fuerza).toBe(0.05)
  })
  it('kcal cruda aplica el ajuste', () => {
    expect(kcalObjetivoCrudo(2000, 'perder_grasa')).toBeCloseTo(1600, 6)
    expect(kcalObjetivoCrudo(2000, 'ganar_musculo')).toBeCloseTo(2200, 6)
  })
})

describe('Deurenberg', () => {
  it('estima grasa con la fórmula', () => {
    // 1.2*IMC + 0.23*edad - 10.8*1 - 5.4 ; IMC = 80/1.8^2 = 24.69
    const imc = 80 / 1.8 ** 2
    const esperado = 1.2 * imc + 0.23 * 30 - 10.8 - 5.4
    expect(estimarGrasaDeurenberg(80, 180, 30, 'hombre')).toBeCloseTo(esperado, 4)
  })
})

describe('limitarKcal: clamps y redondeo', () => {
  it('recorta el déficit al 25% del TDEE', () => {
    // Objetivo perder_grasa pediría -20%, pero si forzamos un déficit mayor el suelo del 25% manda.
    const perfil = perfilBase({ pesoKg: 70, alturaCm: 175, edadAnios: 30, sexo: 'hombre' })
    const eb = energiaBase(perfil)
    const lim = limitarKcal(perfil, 'perder_grasa', eb)
    expect(lim.kcal).toBeGreaterThanOrEqual(Math.round(eb.tdee * 0.75) - 1)
    expect(Number.isInteger(lim.kcal)).toBe(true)
  })
  it('nunca por debajo del suelo del sexo', () => {
    const mujer = perfilBase({ sexo: 'mujer', pesoKg: 45, alturaCm: 150, edadAnios: 60, actividad: 'sedentario' })
    const eb = energiaBase(mujer)
    const lim = limitarKcal(mujer, 'perder_grasa', eb)
    expect(lim.kcal).toBeGreaterThanOrEqual(1200)
  })
  it('kcal objetivo siempre es entero', () => {
    const eb = energiaBase(perfilBase())
    expect(Number.isInteger(limitarKcal(perfilBase(), 'mantenimiento', eb).kcal)).toBe(true)
  })
})
