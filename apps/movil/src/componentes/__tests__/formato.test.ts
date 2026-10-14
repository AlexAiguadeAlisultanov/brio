import { describe, expect, it } from 'vitest'

import { numero } from '../formato'

// El separador de miles cambia con el idioma; la cifra siempre se redondea a entero.
describe('numero', () => {
  it('usa punto de millar en español y catalán', () => {
    expect(numero(2150, 'es')).toBe('2.150')
    expect(numero(2150, 'ca')).toBe('2.150')
  })

  it('usa coma de millar en inglés', () => {
    expect(numero(2150, 'en')).toBe('2,150')
  })

  it('redondea a entero', () => {
    expect(numero(164.7, 'es')).toBe('165')
  })
})
