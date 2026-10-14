import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { Platform } from 'react-native'

import { NOMBRE_BASE } from './esquema'
import { migrar } from './migraciones'
import { crearRepositorioMemoria } from './repositorio-memoria'
import { RepositorioSQLite } from './repositorio-sqlite'
import { SQLiteProvider, useSQLiteContext } from './sqlite-runtime'
import type { Repositorio } from './repositorio'

// Proveedor de la capa de datos. En el dispositivo monta expo-sqlite (SQLiteProvider) y aplica
// las migraciones al iniciar. En web degrada a un repositorio en memoria/localStorage con el
// mismo contrato. Las pantallas obtienen el repositorio con useRepositorio() y nunca saben
// cuál de los dos están usando.

const RepoContexto = createContext<Repositorio | null>(null)

export function useRepositorio(): Repositorio {
  const repo = useContext(RepoContexto)
  if (!repo) throw new Error('useRepositorio debe usarse dentro de <ProveedorDatos>')
  return repo
}

function PuenteSQLite({ children }: { children: ReactNode }) {
  const db = useSQLiteContext()
  const repo = useMemo(() => new RepositorioSQLite(db), [db])
  return <RepoContexto.Provider value={repo}>{children}</RepoContexto.Provider>
}

// En web se construye una sola vez. En nativo queda a null y no se usa.
const repoWeb: Repositorio | null = Platform.OS === 'web' ? crearRepositorioMemoria() : null

export function ProveedorDatos({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return <RepoContexto.Provider value={repoWeb}>{children}</RepoContexto.Provider>
  }
  return (
    <SQLiteProvider databaseName={NOMBRE_BASE} onInit={async (db) => { await migrar(db) }}>
      <PuenteSQLite>{children}</PuenteSQLite>
    </SQLiteProvider>
  )
}
