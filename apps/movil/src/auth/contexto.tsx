import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { acceder, crearCheckout, ErrorApi, registrar, salir, yo, type Usuario } from './api'
import { borrarToken, guardarToken, leerToken } from './almacen'
import { urlApi } from '../llm/cliente'

// Estado global de la cuenta. La app exige haber iniciado sesión para entrar (gratis o
// premium). Guarda el token en el almacén seguro y conoce si el usuario es premium para
// decidir qué funciones desbloquear.

interface EstadoAuth {
  cargando: boolean
  sinServidor: boolean
  usuario: Usuario | null
  esPremium: boolean
  registrar: (email: string, password: string) => Promise<void>
  acceder: (email: string, password: string) => Promise<void>
  salir: () => Promise<void>
  refrescar: () => Promise<void>
  comprarPremium: (modo: 'suscripcion' | 'pase') => Promise<{ ok: boolean; sinPago?: boolean }>
}

const Ctx = createContext<EstadoAuth | null>(null)

export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const sinServidor = urlApi() === ''

  // Al arrancar, recupera el token guardado y comprueba la sesión.
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const guardado = await leerToken()
        if (guardado && !sinServidor) {
          try {
            const u = await yo(guardado)
            if (vivo) {
              setToken(guardado)
              setUsuario(u)
            }
          } catch (e) {
            // Token caducado o inválido: lo olvidamos.
            if (e instanceof ErrorApi && e.estado === 401) await borrarToken()
          }
        }
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [sinServidor])

  const entrar = useCallback(async (tk: string, u: Usuario) => {
    await guardarToken(tk)
    setToken(tk)
    setUsuario(u)
  }, [])

  const hacerRegistro = useCallback(
    async (email: string, password: string) => {
      const r = await registrar(email, password)
      await entrar(r.token, r.usuario)
    },
    [entrar],
  )

  const hacerAcceso = useCallback(
    async (email: string, password: string) => {
      const r = await acceder(email, password)
      await entrar(r.token, r.usuario)
    },
    [entrar],
  )

  const hacerSalir = useCallback(async () => {
    if (token) {
      try {
        await salir(token)
      } catch {
        // Da igual si falla en el servidor: localmente cerramos igual.
      }
    }
    await borrarToken()
    setToken(null)
    setUsuario(null)
  }, [token])

  const refrescar = useCallback(async () => {
    if (!token) return
    try {
      setUsuario(await yo(token))
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 401) {
        await borrarToken()
        setToken(null)
        setUsuario(null)
      }
    }
  }, [token])

  const comprarPremium = useCallback(
    async (modo: 'suscripcion' | 'pase') => {
      if (!token) return { ok: false }
      const url = await crearCheckout(token, modo)
      if (!url) return { ok: false, sinPago: true }
      await WebBrowser.openBrowserAsync(url)
      // Al volver del navegador, el webhook ya pudo marcar premium: lo comprobamos.
      await refrescar()
      return { ok: true }
    },
    [token, refrescar],
  )

  const valor = useMemo<EstadoAuth>(
    () => ({
      cargando,
      sinServidor,
      usuario,
      esPremium: Boolean(usuario?.premium),
      registrar: hacerRegistro,
      acceder: hacerAcceso,
      salir: hacerSalir,
      refrescar,
      comprarPremium,
    }),
    [cargando, sinServidor, usuario, hacerRegistro, hacerAcceso, hacerSalir, refrescar, comprarPremium],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAuth(): EstadoAuth {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth fuera de ProveedorAuth')
  return c
}
