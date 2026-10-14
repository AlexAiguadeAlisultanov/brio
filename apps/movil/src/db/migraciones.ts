import type { SQLiteDatabase } from 'expo-sqlite'

import { SQL_BORRAR_TODO, SQL_CREAR_V1, VERSION_ESQUEMA } from './esquema'

// Migraciones versionadas con PRAGMA user_version. Cada paso lleva a la base de una versión a
// la siguiente dentro de una transacción. Si algo falla a mitad, en vez de dejar la app
// inservible se toma la ruta de rescate: restablecer los datos locales (recrear el esquema
// vacío). Se pierde el contenido local, pero la app vuelve a arrancar; como todo vive solo en
// el dispositivo, esta es la última red antes de un bloqueo total.

interface PasoMigracion {
  version: number
  aplicar: (db: SQLiteDatabase) => Promise<void>
}

const PASOS: PasoMigracion[] = [
  {
    version: 1,
    aplicar: async (db) => {
      await db.execAsync(SQL_CREAR_V1)
    },
  },
]

async function leerVersion(db: SQLiteDatabase): Promise<number> {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  return fila?.user_version ?? 0
}

// Recrea el esquema desde cero. Devuelve la base a la última versión, vacía.
export async function restablecerDatosLocales(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SQL_BORRAR_TODO)
  await db.execAsync(SQL_CREAR_V1)
  // La versión no admite parámetros ligados; VERSION_ESQUEMA es un entero controlado.
  await db.execAsync(`PRAGMA user_version = ${VERSION_ESQUEMA};`)
}

// Resultado de migrar, por si la capa superior quiere avisar de un restablecimiento.
export interface ResultadoMigracion {
  versionAnterior: number
  versionNueva: number
  restablecida: boolean
}

export async function migrar(db: SQLiteDatabase): Promise<ResultadoMigracion> {
  await db.execAsync('PRAGMA foreign_keys = ON;')

  const versionAnterior = await leerVersion(db)
  let actual = versionAnterior

  try {
    for (const paso of PASOS) {
      if (paso.version > actual) {
        await db.withTransactionAsync(async () => {
          await paso.aplicar(db)
        })
        await db.execAsync(`PRAGMA user_version = ${paso.version};`)
        actual = paso.version
      }
    }
    return { versionAnterior, versionNueva: actual, restablecida: false }
  } catch {
    // Ruta de rescate: no dejar la app inservible.
    await restablecerDatosLocales(db)
    return { versionAnterior, versionNueva: VERSION_ESQUEMA, restablecida: true }
  }
}
