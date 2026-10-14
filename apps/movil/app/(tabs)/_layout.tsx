import { Tabs } from 'expo-router'
import { CalendarDays, Flame, TrendingUp, User } from 'lucide-react-native'

import { useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

// Barra de pestañas inferior con los cuatro destinos de la app: Hoy, Plan, Progreso y Perfil.
// Iconos de línea de Lucide, mismo grosor; el acento vive solo en la pestaña activa.

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
        options={{ title: t('tabs.hoy'), tabBarIcon: ({ color }) => <Flame size={22} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: t('tabs.plan'), tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="progreso"
        options={{ title: t('tabs.progreso'), tabBarIcon: ({ color }) => <TrendingUp size={22} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: t('tabs.perfil'), tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} /> }}
      />
    </Tabs>
  )
}
