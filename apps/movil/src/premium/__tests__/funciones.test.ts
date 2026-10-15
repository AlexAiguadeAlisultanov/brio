import { describe, expect, it } from 'vitest'

import { FUNCIONES_PREMIUM, puedeUsar, type FuncionPremium } from '../funciones'

describe('gating de funciones premium', () => {
  it('un usuario premium puede usar todas las funciones de pago', () => {
    for (const f of FUNCIONES_PREMIUM) {
      expect(puedeUsar(f, true)).toBe(true)
    }
  })

  it('un usuario gratis no puede usar ninguna función de pago', () => {
    for (const f of FUNCIONES_PREMIUM) {
      expect(puedeUsar(f, false)).toBe(false)
    }
  })

  it('las cinco funciones de pago están catalogadas', () => {
    expect([...FUNCIONES_PREMIUM].sort()).toEqual(['checkin', 'compra', 'ia', 'objetivo', 'prs'])
  })

  it('una función fuera del catálogo está disponible para cualquiera', () => {
    const libre = 'registrar' as unknown as FuncionPremium
    expect(puedeUsar(libre, false)).toBe(true)
    expect(puedeUsar(libre, true)).toBe(true)
  })
})
