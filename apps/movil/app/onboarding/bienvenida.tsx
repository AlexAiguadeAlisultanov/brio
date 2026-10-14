import { useRouter } from 'expo-router'
import { View } from 'react-native'
import type { Locale } from '@brio/motor'

import { AvisoMedico, ControlSegmentado, PantallaOnboarding, Texto } from '@/componentes'
import { useLocale, useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

// Paso 1: bienvenida e idioma. Baja la ansiedad antes de pedir datos y deja elegir el idioma
// de entrada. El aviso médico aparece aquí por primera vez, con su jerarquía propia.
export default function Bienvenida() {
  const router = useRouter()
  const t = useT()
  const { locale, cambiarLocale } = useLocale()
  const { espaciado } = useTema()

  const idiomas: { valor: Locale; etiqueta: string }[] = [
    { valor: 'es', etiqueta: t('idioma.es') },
    { valor: 'ca', etiqueta: t('idioma.ca') },
    { valor: 'en', etiqueta: t('idioma.en') },
  ]

  return (
    <PantallaOnboarding
      titulo={t('ob.bienvenida.titulo')}
      apoyo={t('ob.bienvenida.apoyo')}
      primario={{ texto: t('comun.empezar'), onPress: () => router.push('/onboarding/objetivo') }}
      pie={<AvisoMedico rotulo={t('ob.bienvenida.avisoRotulo')} texto={t('ob.bienvenida.avisoTexto')} />}>
      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.bienvenida.idioma')}
        </Texto>
        <ControlSegmentado opciones={idiomas} valor={locale} onChange={cambiarLocale} />
      </View>
    </PantallaOnboarding>
  )
}
