import { getLocales } from 'expo-localization'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import type { Locale } from '@brio/motor'

import { ca } from './ca'
import { en } from './en'
import { es, type ClaveI18n, type DiccionarioI18n } from './es'

// i18n tipado sin librería. El tipo de las claves sale de es.ts, así que t('...') solo acepta
// claves que existen y los tres idiomas están obligados a cubrirlas (ver el satisfies de
// ca.ts / en.ts). Español por defecto; el idioma se detecta del dispositivo y se puede
// cambiar en caliente. La persistencia real del idioma vivirá en ajustes_app (base de datos).

const DICCIONARIOS: Record<Locale, DiccionarioI18n> = { es, ca, en }

const LOCALES_VALIDOS: readonly Locale[] = ['es', 'ca', 'en']

function esLocale(valor: string | null | undefined): valor is Locale {
  return LOCALES_VALIDOS.includes(valor as Locale)
}

// Detecta el idioma del dispositivo. Si no es uno de los nuestros, cae a español.
export function detectarLocale(): Locale {
  try {
    const codigo = getLocales()[0]?.languageCode
    if (esLocale(codigo)) return codigo
  } catch {
    // expo-localization puede fallar en entornos raros; el español por defecto nos cubre.
  }
  return 'es'
}

interface ContextoI18n {
  locale: Locale
  t: (clave: ClaveI18n) => string
  cambiarLocale: (locale: Locale) => void
}

const Contexto = createContext<ContextoI18n | null>(null)

export function I18nProvider({
  children,
  localeInicial,
}: {
  children: ReactNode
  // Si no se pasa, se detecta del dispositivo. Más adelante llegará el guardado en la db.
  localeInicial?: Locale
}) {
  const [locale, setLocale] = useState<Locale>(() => localeInicial ?? detectarLocale())

  const t = useCallback(
    (clave: ClaveI18n) => DICCIONARIOS[locale][clave],
    [locale],
  )

  const valor = useMemo<ContextoI18n>(
    () => ({ locale, t, cambiarLocale: setLocale }),
    [locale, t],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

function useContextoI18n(): ContextoI18n {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useT / useLocale deben usarse dentro de <I18nProvider>')
  return ctx
}

// Hook principal: devuelve la función de traducción.
export function useT(): (clave: ClaveI18n) => string {
  return useContextoI18n().t
}

// Hook para leer y cambiar el idioma activo.
export function useLocale(): { locale: Locale; cambiarLocale: (locale: Locale) => void } {
  const { locale, cambiarLocale } = useContextoI18n()
  return { locale, cambiarLocale }
}

export type { ClaveI18n }
