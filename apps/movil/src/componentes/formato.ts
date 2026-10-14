import type { Locale } from '@brio/motor'

// Formato de cifras con separador de miles según el idioma (2.150 en es/ca, 2,150 en en).
// Lo hacemos a mano en vez de depender de Intl, porque los datos de idioma de Intl no están
// garantizados en Hermes ni en todos los dispositivos, y aquí el resultado tiene que ser
// siempre el mismo. Los números del plan salen del motor; esto solo los viste para leerse.
export function numero(valor: number, locale: Locale): string {
  const separador = locale === 'en' ? ',' : '.'
  const entero = Math.round(Math.abs(valor))
  const signo = valor < 0 ? '-' : ''
  const agrupado = String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, separador)
  return signo + agrupado
}
