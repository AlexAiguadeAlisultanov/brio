import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import { construirTema, type ModoTema, type Tema } from './tema'

// Proveedor de tema sencillo. Arranca en modo oscuro (la preferencia de Brío) y permite
// cambiarlo en caliente. La persistencia real del modo vivirá en los ajustes de la base de
// datos; de momento se guarda solo en memoria.

interface ContextoTema {
  tema: Tema
  modo: ModoTema
  cambiarModo: (modo: ModoTema) => void
  alternarModo: () => void
}

const Contexto = createContext<ContextoTema | null>(null)

export function ProveedorTema({
  children,
  modoInicial = 'oscuro',
}: {
  children: ReactNode
  modoInicial?: ModoTema
}) {
  const [modo, setModo] = useState<ModoTema>(modoInicial)

  const valor = useMemo<ContextoTema>(
    () => ({
      tema: construirTema(modo),
      modo,
      cambiarModo: setModo,
      alternarModo: () => setModo((m) => (m === 'oscuro' ? 'claro' : 'oscuro')),
    }),
    [modo],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useTema(): Tema {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useTema debe usarse dentro de <ProveedorTema>')
  return ctx.tema
}

export function useControlTema(): ContextoTema {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useControlTema debe usarse dentro de <ProveedorTema>')
  return ctx
}
