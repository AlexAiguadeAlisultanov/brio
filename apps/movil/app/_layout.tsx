import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import { Sora_400Regular, Sora_600SemiBold, Sora_700Bold, useFonts } from '@expo-google-fonts/sora'

import { ProveedorAuth } from '@/auth/contexto'
import { ProveedorDatos } from '@/db/provider'
import { I18nProvider } from '@/i18n'
import { ProveedorTema } from '@/ui/proveedor'

// Raíz de la app. Monta, de fuera a dentro, el área segura, el tema, la capa de datos
// (SQLite en el dispositivo, memoria en web), el idioma y la cuenta, y debajo el navegador por
// pila. La pantalla índice decide a dónde ir según si hay sesión y si ya hay perfil guardado.
//
// Mantenemos la pantalla de carga nativa hasta que Sora esté lista, para que ningún texto
// aparezca primero con la fuente del sistema y salte al cargar la tipografía.

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function LayoutRaiz() {
  const [fuentesListas, errorFuentes] = useFonts({ Sora_400Regular, Sora_600SemiBold, Sora_700Bold })
  // Si las fuentes fallan (poco probable), seguimos con la del sistema en vez de dejar la
  // pantalla de carga colgada para siempre.
  const listo = fuentesListas || errorFuentes != null

  useEffect(() => {
    if (listo) SplashScreen.hideAsync().catch(() => {})
  }, [listo])

  if (!listo) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProveedorTema>
          <ProveedorDatos>
            <I18nProvider>
              <ProveedorAuth>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="acceso" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="entreno" options={{ presentation: 'card' }} />
                  <Stack.Screen name="premium" options={{ presentation: 'modal' }} />
                </Stack>
              </ProveedorAuth>
            </I18nProvider>
          </ProveedorDatos>
        </ProveedorTema>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
