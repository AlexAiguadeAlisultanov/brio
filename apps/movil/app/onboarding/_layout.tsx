import { Stack, useSegments } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BarraProgreso } from '@/componentes'
import { ProveedorOnboarding } from '@/onboarding/estado'
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

function Progreso() {
  const segments = useSegments()
  const actual = segments[segments.length - 1]
  const indice = PASOS_ONBOARDING.indexOf(actual as (typeof PASOS_ONBOARDING)[number])
  const paso = indice >= 0 ? indice + 1 : 0
  return <BarraProgreso paso={paso} total={PASOS_ONBOARDING.length} />
}

export default function LayoutOnboarding() {
  const { colores } = useTema()
  return (
    <ProveedorOnboarding>
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: colores.fondo }}>
          <Progreso />
        </SafeAreaView>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colores.fondo },
            animation: 'slide_from_right',
          }}
        />
      </View>
    </ProveedorOnboarding>
  )
}
