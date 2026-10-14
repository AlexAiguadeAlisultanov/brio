import type { ReactNode } from 'react'

// Stubs para web. Nunca se renderizan ni se invocan: en web la app usa el repositorio en
// memoria y el proveedor de datos corta antes de llegar aquí. Existen solo para que el
// empaquetado web no tenga que resolver expo-sqlite (alpha en web).

export function SQLiteProvider(_props: { children?: ReactNode; [clave: string]: unknown }): null {
  return null
}

export function useSQLiteContext(): never {
  throw new Error('expo-sqlite no está disponible en web; se usa el repositorio en memoria.')
}
