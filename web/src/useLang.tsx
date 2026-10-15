import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CONTENIDO, type Contenido, type Lang } from './i18n'

const CLAVE = 'brio.idioma'
const IDIOMAS_VALIDOS: Lang[] = ['es', 'ca', 'en']

// Idioma inicial: lo guardado, luego lo del navegador, y por defecto español.
function idiomaInicial(): Lang {
  if (typeof window === 'undefined') return 'es'
  const guardado = window.localStorage.getItem(CLAVE)
  if (guardado && IDIOMAS_VALIDOS.includes(guardado as Lang)) return guardado as Lang
  const navegador = window.navigator.language.slice(0, 2).toLowerCase()
  if (IDIOMAS_VALIDOS.includes(navegador as Lang)) return navegador as Lang
  return 'es'
}

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: Contenido
}

const LangContext = createContext<Ctx | null>(null)

export function ProveedorIdioma({ children }: { children: ReactNode }) {
  const [lang, setLangEstado] = useState<Lang>(idiomaInicial)

  useEffect(() => {
    document.documentElement.lang = lang
    window.localStorage.setItem(CLAVE, lang)
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangEstado(l), [])
  const valor = useMemo<Ctx>(() => ({ lang, setLang, t: CONTENIDO[lang] }), [lang, setLang])

  return <LangContext.Provider value={valor}>{children}</LangContext.Provider>
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang debe usarse dentro de ProveedorIdioma')
  return ctx
}
