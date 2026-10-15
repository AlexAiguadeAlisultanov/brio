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
    package: 'com.alexaiguade.brio',
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundColor: ACENTO,
    },
    predictiveBackGestureEnabled: false,
  },
  ios: {
    bundleIdentifier: 'com.alexaiguade.brio',
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
    // Pasarela del backend (cuentas, pagos e IA). Se fija por entorno en cada build.
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
    // Proyecto de EAS (builds en la nube). Lo conecta `eas init --id`.
    eas: { projectId: '5c833e8d-5fde-4d7a-baac-dadeee648347' },
  },
})
