import { View } from 'react-native'
import { OctagonAlert } from 'lucide-react-native'

import { useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

import { Texto } from './base'

// Señales por las que hay que parar el ejercicio y buscar ayuda (dolor de pecho, mareo,
// síncope, disnea, palpitaciones). Se muestran destacadas en la pantalla de entreno cuando el
// plan trae bandera de derivación o entrena sin máximas. La jerarquía la da el peso y el
// contorno, no solo el color: se entiende aunque no se perciba el tono.

export function SenalesDeParada() {
  const { colores, espaciado, radios } = useTema()
  const t = useT()

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: espaciado.dos,
        padding: espaciado.dos,
        borderRadius: radios.m,
        borderWidth: 1,
        borderColor: colores.bloqueo,
        backgroundColor: colores.bloqueo + '1F',
      }}>
      <View style={{ paddingTop: 2 }}>
        <OctagonAlert size={20} color={colores.bloqueo} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: espaciado.media }}>
        <Texto variante="etiqueta" fuerte style={{ color: colores.bloqueo, letterSpacing: 0.4 }}>
          {t('parada.rotulo').toUpperCase()}
        </Texto>
        <Texto fuerte>{t('parada.senales')}</Texto>
        <Texto variante="etiqueta" tono="secundario">
          {t('parada.texto')}
        </Texto>
      </View>
    </View>
  )
}
