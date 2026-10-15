import type { ExpoConfig, ConfigContext } from 'expo/config'

// Configuración de la app Brío. Icono y splash: monograma "B" naranja sobre fondo oscuro,
// la misma marca que la landing y la app. La URL del proxy llega por entorno
// (EXPO_PUBLIC_API_URL).

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
      monochromeImage: './assets/images/android-icon-monochrome.png',
      backgroundColor: FONDO_OSCURO,
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
    // Proyecto de EAS (builds en la nube). Se enlaza con `eas init` (crea el proyecto "brio"
    // bajo tu cuenta). Pega aquí el projectId que te imprima, o déjalo por entorno.
    eas: { projectId: process.env.EAS_PROJECT_ID ?? 'b976e2a7-e3d6-4d94-b793-9c34fdb73100' },
  },
})
