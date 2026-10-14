import { View } from 'react-native'
import { Info, ShieldAlert } from 'lucide-react-native'

import { useTema } from '@/ui/proveedor'

import { Texto } from './base'

// Aviso médico integrado en el texto, con jerarquía tipográfica propia y no solo color: un
// rótulo corto en semibold marca de qué va, y debajo el cuerpo. Así se entiende aunque no se
// perciba el color. Cuando está reforzado (hubo bandera de salud) sube el peso del rótulo y
// usa el tono de precaución, pero sigue siendo texto, nunca una caja chillona.

export function AvisoMedico({
  texto,
  reforzado,
  rotulo,
}: {
  texto: string
  reforzado?: boolean
  rotulo: string
}) {
  const { colores, espaciado, radios } = useTema()
  const Icono = reforzado ? ShieldAlert : Info
  const colorRotulo = reforzado ? colores.precaucion : colores.textoSecundario

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: espaciado.uno,
        padding: espaciado.dos,
        borderRadius: radios.m,
        borderWidth: 1,
        borderColor: reforzado ? colores.precaucion : colores.borde,
        backgroundColor: colores.tarjeta,
      }}>
      <View style={{ paddingTop: 2 }}>
        <Icono size={18} color={colorRotulo} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: espaciado.media }}>
        <Texto variante="pie" fuerte style={{ color: colorRotulo, letterSpacing: 0.4 }}>
          {rotulo.toUpperCase()}
        </Texto>
        <Texto variante="etiqueta" tono="secundario">
          {texto}
        </Texto>
      </View>
    </View>
  )
}
