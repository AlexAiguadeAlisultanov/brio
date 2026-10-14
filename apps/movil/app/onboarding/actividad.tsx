import { useRouter } from 'expo-router'
import { View } from 'react-native'

import { PantallaOnboarding, TarjetaSeleccion } from '@/componentes'
import { useT } from '@/i18n'
import { useOnboarding } from '@/onboarding/estado'
import { ACTIVIDADES } from '@/onboarding/opciones'
import { useTema } from '@/ui/proveedor'

// Paso 4: nivel de actividad. Cinco filas ordenadas de más a menos movimiento, cada una con un
// ejemplo de vida real, para empujar a no sobreestimar.
export default function Actividad() {
  const router = useRouter()
  const t = useT()
  const { estado, actualizar } = useOnboarding()
  const { espaciado } = useTema()

  return (
    <PantallaOnboarding
      titulo={t('ob.actividad.titulo')}
      apoyo={t('ob.actividad.apoyo')}
      primario={{
        texto: t('comun.siguiente'),
        onPress: () => router.push('/onboarding/grasa'),
        desactivado: !estado.actividad,
      }}>
      <View style={{ gap: espaciado.uno }}>
        {ACTIVIDADES.map((a) => (
          <TarjetaSeleccion
            key={a.valor}
            titulo={t(a.clave)}
            descripcion={t(a.desc)}
            icono={a.icono}
            seleccionado={estado.actividad === a.valor}
            onPress={() => actualizar({ actividad: a.valor })}
          />
        ))}
      </View>
    </PantallaOnboarding>
  )
}
