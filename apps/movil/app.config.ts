import type { ExpoConfig, ConfigContext } from 'expo/config'

// Configuración de la app Brío. El acento naranja es un marcador de posición: el icono y la
// pantalla de carga definitivos los afinará el diseño más adelante. La URL del proxy llega
// por entorno (EXPO_PUBLIC_API_URL); todavía no se usa, pero queda cableada para el futuro.

const ACENTO = '#FB6A1E'
const FONDO_OSCURO = '#0B0B0C'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Brío',
  slug: 'brio',
  scheme: 'brio',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundColor: ACENTO,
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    // SPA: una sola página que resuelve el router en cliente.
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-localization',
    'expo-secure-store',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        backgroundColor: FONDO_OSCURO,
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
    reactCompiler: true,
  },
  extra: {
    // Pasarela del proxy del LLM. Vacía por ahora; las pantallas aún no la consultan.
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  },
})
