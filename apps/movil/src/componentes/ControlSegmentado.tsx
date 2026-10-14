import { useState } from 'react'
import { LayoutAnimation, Platform, Pressable, UIManager, View } from 'react-native'

import { useTema } from '@/ui/proveedor'

import { Texto, tocar, useMovimientoReducido } from './base'

// Control segmentado para elecciones de pocas opciones cerradas: sexo, unidades, objetivo.
// La pastilla activa es el único sitio con acento. El deslizamiento de la pastilla se anima
// con LayoutAnimation y se apaga con el movimiento reducido.

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export interface OpcionSegmento<T extends string> {
  valor: T
  etiqueta: string
}

interface Props<T extends string> {
  opciones: OpcionSegmento<T>[]
  valor: T | undefined
  onChange: (valor: T) => void
}

export function ControlSegmentado<T extends string>({ opciones, valor, onChange }: Props<T>) {
  const { colores, radios, espaciado } = useTema()
  const reducido = useMovimientoReducido()
  // Fuerza un re-render tras animar el cambio, sin lógica extra.
  const [, setTick] = useState(0)

  const elegir = (v: T) => {
    if (v === valor) return
    if (!reducido) LayoutAnimation.configureNext(LayoutAnimation.create(160, 'easeInEaseOut', 'opacity'))
    tocar()
    onChange(v)
    setTick((n) => n + 1)
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colores.hoja,
        borderRadius: radios.m,
        padding: espaciado.media,
        gap: espaciado.media,
      }}>
      {opciones.map((o) => {
        const activo = o.valor === valor
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            onPress={() => elegir(o.valor)}
            style={{
              flex: 1,
              paddingVertical: espaciado.uno + 2,
              paddingHorizontal: espaciado.uno,
              borderRadius: radios.s,
              backgroundColor: activo ? colores.acento : 'transparent',
              alignItems: 'center',
            }}>
            <Texto tono={activo ? 'sobreAcento' : 'secundario'} fuerte={activo} variante="etiqueta">
              {o.etiqueta}
            </Texto>
          </Pressable>
        )
      })}
    </View>
  )
}
