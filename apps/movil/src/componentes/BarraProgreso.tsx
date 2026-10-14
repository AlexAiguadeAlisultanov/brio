import { useEffect, useState } from 'react'
import { Animated, View } from 'react-native'

import { useTema } from '@/ui/proveedor'

import { useMovimientoReducido } from './base'

// Barra de progreso del onboarding. Se rellena de acento según el paso actual sobre el total.
// Es la única pista de "cuánto queda", así que se anima al avanzar; con movimiento reducido
// salta al valor sin animar.

export function BarraProgreso({ paso, total }: { paso: number; total: number }) {
  const { colores } = useTema()
  const reducido = useMovimientoReducido()
  const objetivo = total > 0 ? Math.min(Math.max(paso / total, 0), 1) : 0
  const [valor] = useState(() => new Animated.Value(objetivo))

  useEffect(() => {
    if (reducido) {
      valor.setValue(objetivo)
      return
    }
    Animated.timing(valor, { toValue: objetivo, duration: 240, useNativeDriver: false }).start()
  }, [objetivo, reducido, valor])

  const ancho = valor.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: paso }}
      style={{ height: 4, backgroundColor: colores.hoja }}>
      <Animated.View style={{ height: 4, width: ancho, backgroundColor: colores.acento }} />
    </View>
  )
}
