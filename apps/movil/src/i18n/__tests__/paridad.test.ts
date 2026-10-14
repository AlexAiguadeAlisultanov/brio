// Paridad de claves entre idiomas. El `satisfies` de ca.ts y en.ts ya obliga a cubrir todas
// las claves en tiempo de compilación; este test es la red de seguridad en ejecución por si
// algún día se relaja el tipado. Se ejecuta con Vitest (el mismo runner que el motor).

import { describe, expect, it } from 'vitest'

import { ca } from '../ca'
import { en } from '../en'
import { es } from '../es'

const idiomas = { es, ca, en }

describe('i18n: paridad de claves', () => {
  const clavesEs = Object.keys(es).sort()

  for (const [nombre, dic] of Object.entries(idiomas)) {
    it(`${nombre} tiene exactamente las mismas claves que es`, () => {
      expect(Object.keys(dic).sort()).toEqual(clavesEs)
    })

    it(`${nombre} no deja ninguna traducción vacía`, () => {
      for (const valor of Object.values(dic)) {
        expect(valor.trim().length).toBeGreaterThan(0)
      }
    })
  }
})
