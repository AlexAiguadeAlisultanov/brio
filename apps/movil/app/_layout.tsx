import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { ProveedorDatos } from '@/db/provider'
import { I18nProvider } from '@/i18n'
import { ProveedorTema } from '@/ui/proveedor'

// Raíz de la app. Monta, de fuera a dentro, el área segura, el tema, la capa de datos
// (SQLite en el dispositivo, memoria en web) y el idioma, y debajo el navegador por pila.
// La pantalla índice decide a dónde ir según si ya hay perfil guardado.

export default function LayoutRaiz() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProveedorTema>
          <ProveedorDatos>
            <I18nProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </I18nProvider>
          </ProveedorDatos>
        </ProveedorTema>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
