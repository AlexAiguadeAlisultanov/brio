import { Tabs } from 'expo-router'
import { View, type ColorValue } from 'react-native'

import { useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

// Barra de pestañas inferior con los cuatro destinos de la app: Hoy, Plan, Progreso y Perfil.
// Los iconos definitivos los pondrá app-designer; de momento un punto que toma el color activo.

function PuntoPestana({ color }: { color: ColorValue }) {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
}

export default function LayoutTabs() {
  const t = useT()
  const { colores } = useTema()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.acento,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarStyle: {
          backgroundColor: colores.tarjeta,
          borderTopColor: colores.borde,
        },
      }}>
      <Tabs.Screen
        name="hoy"
        options={{ title: t('tabs.hoy'), tabBarIcon: ({ color }) => <PuntoPestana color={color} /> }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: t('tabs.plan'), tabBarIcon: ({ color }) => <PuntoPestana color={color} /> }}
      />
      <Tabs.Screen
        name="progreso"
        options={{ title: t('tabs.progreso'), tabBarIcon: ({ color }) => <PuntoPestana color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: t('tabs.perfil'), tabBarIcon: ({ color }) => <PuntoPestana color={color} /> }}
      />
    </Tabs>
  )
}
