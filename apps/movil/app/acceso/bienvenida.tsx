import { useRouter } from 'expo-router'
import { useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BotonPrimario, BotonSecundario, Hero, Texto } from '@/componentes'
import { useT } from '@/i18n'
import { HERO_ACCESO } from '@/ui/imagenes'
import { useTema } from '@/ui/proveedor'

// Portada de la app: un hero a sangre con un titular grande, la propuesta de valor y las dos
// salidas (crear cuenta o entrar). El aviso médico fino va debajo, como en el onboarding. La
// cuenta es obligatoria, así que esta es la primera pantalla de quien no ha entrado.
export default function Bienvenida() {
  const router = useRouter()
  const t = useT()
  const { espaciado } = useTema()
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  return (
    <Hero imagen={HERO_ACCESO} altura={height}>
      <View style={{ gap: espaciado.dos, paddingBottom: insets.bottom }}>
        <Texto variante="pie" fuerte tono="acento" style={{ letterSpacing: 1.5 }}>
          {t('app.nombre').toUpperCase()}
        </Texto>
        <Texto variante="display">{t('acceso.bienvenida.titulo')}</Texto>
        <Texto tono="secundario" style={{ maxWidth: 440 }}>
          {t('acceso.bienvenida.apoyo')}
        </Texto>
        <View style={{ gap: espaciado.uno, marginTop: espaciado.uno }}>
          <BotonPrimario texto={t('acceso.bienvenida.crear')} onPress={() => router.push('/acceso/registro')} />
          <BotonSecundario texto={t('acceso.bienvenida.entrar')} onPress={() => router.push('/acceso/entrar')} />
        </View>
        <Texto variante="pie" tono="secundario" style={{ marginTop: espaciado.media }}>
          {t('ob.bienvenida.avisoTexto')}
        </Texto>
      </View>
    </Hero>
  )
}
