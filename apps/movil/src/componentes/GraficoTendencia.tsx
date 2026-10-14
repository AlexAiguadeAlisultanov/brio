import { View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

import { useLocale } from '@/i18n'
import type { PuntoTendencia } from '@/progreso/peso'
import { useTema } from '@/ui/proveedor'

import { Texto } from './base'

// Gráfico de la tendencia de peso: una línea suavizada, no los pesos sueltos. La serie ya viene
// suavizada desde la capa de progreso; aquí solo se escala al tamaño de la caja y se dibuja. Los
// puntos reales se insinúan muy tenues para dar contexto sin robarle protagonismo a la tendencia.

const ALTO = 160
const MARGEN = 12

function decimal(valor: number, locale: 'es' | 'ca' | 'en'): string {
  const txt = valor.toFixed(1)
  return locale === 'en' ? txt : txt.replace('.', ',')
}

export function GraficoTendencia({ serie, ancho = 300 }: { serie: PuntoTendencia[]; ancho?: number }) {
  const { colores, espaciado, radios } = useTema()
  const { locale } = useLocale()

  if (serie.length < 2) return null

  const pesos = serie.map((p) => p.pesoKg)
  const min = Math.min(...pesos)
  const max = Math.max(...pesos)
  // Un pequeño colchón arriba y abajo para que la línea no toque los bordes.
  const colchon = Math.max(0.4, (max - min) * 0.15)
  const yMin = min - colchon
  const yMax = max + colchon
  const rango = yMax - yMin || 1

  const anchoUtil = ancho - MARGEN * 2
  const altoUtil = ALTO - MARGEN * 2

  const x = (i: number) => MARGEN + (serie.length === 1 ? anchoUtil / 2 : (i / (serie.length - 1)) * anchoUtil)
  const y = (peso: number) => MARGEN + altoUtil - ((peso - yMin) / rango) * altoUtil

  const d = serie.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.pesoKg).toFixed(1)}`).join(' ')
  const actual = serie[serie.length - 1]!.pesoKg

  return (
    <View style={{ padding: espaciado.dos, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.uno }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Texto variante="pie" tono="secundario" numerico>
          {decimal(yMax, locale)}
        </Texto>
        <Texto variante="seccion" fuerte numerico>
          {decimal(actual, locale)} kg
        </Texto>
      </View>
      <Svg width={ancho} height={ALTO}>
        <Path d={d} stroke={colores.acento} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {serie.map((p, i) => (
          <Circle key={p.fechaISO} cx={x(i)} cy={y(p.pesoKg)} r={1.5} fill={colores.textoSecundario} opacity={0.4} />
        ))}
        <Circle cx={x(serie.length - 1)} cy={y(actual)} r={4} fill={colores.acento} />
      </Svg>
      <Texto variante="pie" tono="secundario" numerico>
        {decimal(yMin, locale)}
      </Texto>
    </View>
  )
}
