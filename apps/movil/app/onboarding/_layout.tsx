import { Stack, useSegments } from 'expo-router'
import { View, type DimensionValue } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTema } from '@/ui/proveedor'

// Orden de los pasos del onboarding. La barra de progreso se calcula a partir del paso actual.
export const PASOS_ONBOARDING = [
  'bienvenida',
  'objetivo',
  'cuerpo',
  'actividad',
  'grasa',
  'entrenamiento',
  'salud',
  'nutricion',
  'resumen',
  'plan',
] as const

function BarraProgreso() {
  const segments = useSegments()
  const { colores } = useTema()
  const actual = segments[segments.length - 1]
  const indice = PASOS_ONBOARDING.indexOf(actual as (typeof PASOS_ONBOARDING)[number])
  const porcentaje = indice >= 0 ? ((indice + 1) / PASOS_ONBOARDING.length) * 100 : 0
  const ancho = `${porcentaje}%` as DimensionValue

  return (
    <View style={{ height: 4, backgroundColor: colores.hoja }}>
      <View style={{ height: 4, width: ancho, backgroundColor: colores.acento }} />
    </View>
  )
}

export default function LayoutOnboarding() {
  const { colores } = useTema()
  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colores.fondo }}>
        <BarraProgreso />
      </SafeAreaView>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colores.fondo },
          animation: 'slide_from_right',
        }}
      />
    </View>
  )
}
