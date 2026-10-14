import { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import type { ObjetivoDia } from '@/dia/logica'
import { anilloCerrado, razonAnillo } from '@/dia/logica'
import { useLocale, useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar, useMovimientoReducido } from './base'
import { numero } from './formato'

// Anillos del día: un anillo grande de kcal y tres finos de proteína, carbos y grasa, con el
// número al centro. Se rellenan al entrar (o aparecen ya llenos con movimiento reducido) y dan
// una háptica de logro cuando algún anillo se cierra. Todos los números vienen del plan y de lo
// registrado; aquí solo se dibuja la razón de llenado, acotada a una vuelta.

const CirculoAnim = Animated.createAnimatedComponent(Circle)
const DURACION = 850

interface Consumo {
  kcal: number
  proteinaG: number
  carbosG: number
  grasaG: number
}

interface AnilloDef {
  radio: number
  grosor: number
  color: string
  valor: number
  objetivo: number
}

export function Anillos({ objetivo, consumo, tamano = 220 }: { objetivo: ObjetivoDia; consumo: Consumo; tamano?: number }) {
  const { colores, espaciado } = useTema()
  const t = useT()
  const { locale } = useLocale()
  const reducido = useMovimientoReducido()
  const progreso = useRef(new Animated.Value(reducido ? 1 : 0)).current
  const hapticaHecha = useRef(false)

  const centro = tamano / 2
  const grosorKcal = 18
  const grosorFino = 8
  const sep = 6

  // De fuera a dentro: kcal (grande, acento) y luego los tres finos.
  const rExterior = centro - grosorKcal / 2 - 2
  const rProt = rExterior - grosorKcal / 2 - sep - grosorFino / 2
  const rCarb = rProt - grosorFino - sep
  const rGrasa = rCarb - grosorFino - sep

  const anillos: AnilloDef[] = [
    { radio: rExterior, grosor: grosorKcal, color: colores.acento, valor: consumo.kcal, objetivo: objetivo.kcal },
    { radio: rProt, grosor: grosorFino, color: colores.texto, valor: consumo.proteinaG, objetivo: objetivo.proteinaG },
    { radio: rCarb, grosor: grosorFino, color: colores.exito, valor: consumo.carbosG, objetivo: objetivo.carbosG },
    { radio: rGrasa, grosor: grosorFino, color: colores.precaucion, valor: consumo.grasaG, objetivo: objetivo.grasaG },
  ]

  const algunoCerrado = anillos.some((a) => anilloCerrado(a.valor, a.objetivo))

  useEffect(() => {
    if (reducido) {
      progreso.setValue(1)
    } else {
      progreso.setValue(0)
      Animated.timing(progreso, { toValue: 1, duration: DURACION, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start()
    }
    if (algunoCerrado && !hapticaHecha.current) {
      hapticaHecha.current = true
      const retardo = reducido ? 0 : DURACION
      const id = setTimeout(() => tocar('exito'), retardo)
      return () => clearTimeout(id)
    }
    return undefined
  }, [progreso, reducido, algunoCerrado])

  const restante = objetivo.kcal - consumo.kcal

  return (
    <View style={{ alignItems: 'center', gap: espaciado.dos }}>
      <View style={{ width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={tamano} height={tamano} style={{ transform: [{ rotate: '-90deg' }] }}>
          {anillos.map((a, i) => (
            <Circle
              key={`track-${i}`}
              cx={centro}
              cy={centro}
              r={a.radio}
              stroke={colores.hoja}
              strokeWidth={a.grosor}
              fill="none"
            />
          ))}
          {anillos.map((a, i) => {
            const circ = 2 * Math.PI * a.radio
            const razon = razonAnillo(a.valor, a.objetivo)
            const offset = progreso.interpolate({ inputRange: [0, 1], outputRange: [circ, circ * (1 - razon)] })
            return (
              <CirculoAnim
                key={`fill-${i}`}
                cx={centro}
                cy={centro}
                r={a.radio}
                stroke={a.color}
                strokeWidth={a.grosor}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circ}
                strokeDashoffset={offset}
              />
            )
          })}
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Texto variante="titulo" numerico style={{ fontSize: 40, lineHeight: 44 }}>
            {numero(consumo.kcal, locale)}
          </Texto>
          <Texto tono="secundario" fuerte numerico>
            / {numero(objetivo.kcal, locale)} {t('comun.kcal')}
          </Texto>
          <Texto variante="pie" tono={restante < 0 ? 'precaucion' : 'secundario'} style={{ marginTop: 2 }}>
            {restante > 0
              ? t('hoy.restante').replace('{n}', numero(restante, locale))
              : restante < 0
                ? t('hoy.pasado').replace('{n}', numero(Math.abs(restante), locale))
                : t('hoy.justo')}
          </Texto>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: espaciado.dos }}>
        <Leyenda color={colores.texto} etiqueta={t('macro.proteina')} valor={consumo.proteinaG} objetivo={objetivo.proteinaG} locale={locale} sufijo={t('comun.gramos')} />
        <Leyenda color={colores.exito} etiqueta={t('macro.carbos')} valor={consumo.carbosG} objetivo={objetivo.carbosG} locale={locale} sufijo={t('comun.gramos')} />
        <Leyenda color={colores.precaucion} etiqueta={t('macro.grasa')} valor={consumo.grasaG} objetivo={objetivo.grasaG} locale={locale} sufijo={t('comun.gramos')} />
      </View>
    </View>
  )
}

function Leyenda({
  color,
  etiqueta,
  valor,
  objetivo,
  locale,
  sufijo,
}: {
  color: string
  etiqueta: string
  valor: number
  objetivo: number
  locale: Parameters<typeof numero>[1]
  sufijo: string
}) {
  const { espaciado } = useTema()
  return (
    <View style={{ gap: espaciado.media, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.media }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Texto variante="pie" tono="secundario">
          {etiqueta}
        </Texto>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Texto fuerte numerico>
          {numero(valor, locale)}
        </Texto>
        <Texto variante="pie" tono="secundario" numerico>
          / {numero(objetivo, locale)} {sufijo}
        </Texto>
      </View>
    </View>
  )
}
