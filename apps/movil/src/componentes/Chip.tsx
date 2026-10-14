import { Animated, Pressable, View } from 'react-native'
import { Check, X } from 'lucide-react-native'

import type { DurezaRestriccion } from '@/db/repositorio'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar, usePulsacion } from './base'

// Chip de selección: material, patrón dietético, zonas, gustos. Seleccionado se tiñe de acento
// de forma sutil (fondo tenue + borde + marca), nunca relleno sólido, para no saturar la rejilla.
export function Chip({
  etiqueta,
  seleccionado,
  onPress,
}: {
  etiqueta: string
  seleccionado: boolean
  onPress: () => void
}) {
  const { colores, radios, espaciado } = useTema()
  const { escala, aMin, aMax } = usePulsacion(0.96)

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: seleccionado }}
        onPressIn={aMin}
        onPressOut={aMax}
        onPress={() => {
          tocar()
          onPress()
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: espaciado.media,
          paddingVertical: espaciado.uno,
          paddingHorizontal: espaciado.dos,
          borderRadius: radios.s,
          borderWidth: 1,
          borderColor: seleccionado ? colores.acento : colores.borde,
          backgroundColor: seleccionado ? mezclaAcento(colores.acento) : colores.hoja,
        }}>
        {seleccionado ? <Check size={16} color={colores.acentoContraste} strokeWidth={2.5} /> : null}
        <Texto variante="etiqueta" fuerte={seleccionado}>
          {etiqueta}
        </Texto>
      </Pressable>
    </Animated.View>
  )
}

// Chip de restricción con color según su dureza: las duras (alergias, intolerancias, lesiones)
// en rojo ladrillo porque no se tocan jamás; las blandas (gustos) en neutro porque son
// negociables. El color acompaña a la etiqueta, que ya dice de qué tipo es.
export function ChipRestriccion({
  etiqueta,
  dureza,
  onQuitar,
}: {
  etiqueta: string
  dureza: DurezaRestriccion
  onQuitar?: () => void
}) {
  const { colores, radios, espaciado } = useTema()
  const dura = dureza === 'dura'
  const color = dura ? colores.bloqueo : colores.textoSecundario

  const contenido = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaciado.media,
        paddingVertical: espaciado.uno,
        paddingHorizontal: espaciado.dos,
        borderRadius: radios.s,
        borderWidth: 1,
        borderColor: dura ? color : colores.borde,
        backgroundColor: dura ? mezclaBloqueo(colores.bloqueo) : colores.hoja,
      }}>
      <Texto variante="etiqueta" fuerte style={{ color: dura ? color : colores.texto }}>
        {etiqueta}
      </Texto>
      {onQuitar ? <X size={15} color={color} strokeWidth={2.5} /> : null}
    </View>
  )

  if (!onQuitar) return contenido
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Quitar ${etiqueta}`}
      onPress={() => {
        tocar()
        onQuitar()
      }}>
      {contenido}
    </Pressable>
  )
}

// Fondo tenue a partir del acento: el acento al 14% sobre la superficie. Se calcula aquí para
// no meter una dependencia de color y mantener el mismo tono en toda la app.
function mezclaAcento(acento: string): string {
  return acento + '24' // ~14% alfa en hex
}
function mezclaBloqueo(bloqueo: string): string {
  return bloqueo + '1F' // ~12% alfa en hex
}
