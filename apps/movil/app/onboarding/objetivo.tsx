import { useRouter } from 'expo-router'
import { View } from 'react-native'

import { PantallaOnboarding, TarjetaSeleccion } from '@/componentes'
import { useT } from '@/i18n'
import { useOnboarding } from '@/onboarding/estado'
import { OBJETIVOS } from '@/onboarding/opciones'
import { useTema } from '@/ui/proveedor'

// Paso 2: objetivo. Se captura primero porque enmarca todo el plan. Selección única entre
// cuatro tarjetas; sin uno elegido no se puede continuar.
export default function Objetivo() {
  const router = useRouter()
  const t = useT()
  const { estado, actualizar } = useOnboarding()
  const { espaciado } = useTema()

  return (
    <PantallaOnboarding
      titulo={t('ob.objetivo.titulo')}
      apoyo={t('ob.objetivo.apoyo')}
      primario={{
        texto: t('comun.siguiente'),
        onPress: () => router.push('/onboarding/cuerpo'),
        desactivado: !estado.objetivo,
      }}>
      <View style={{ gap: espaciado.uno }}>
        {OBJETIVOS.map((o) => (
          <TarjetaSeleccion
            key={o.valor}
            titulo={t(o.clave)}
            descripcion={t(o.desc)}
            icono={o.icono}
            seleccionado={estado.objetivo === o.valor}
            onPress={() => actualizar({ objetivo: o.valor })}
          />
        ))}
      </View>
    </PantallaOnboarding>
  )
}
