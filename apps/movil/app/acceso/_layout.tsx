import { Stack } from 'expo-router'

import { useTema } from '@/ui/proveedor'

// Stack de acceso, a pantalla completa y sin barra de pestañas: bienvenida, crear cuenta y
// entrar. Fundido corto entre pantallas para que el cambio no distraiga.
export default function LayoutAcceso() {
  const { colores } = useTema()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colores.fondo },
        animation: 'fade',
      }}
    />
  )
}
