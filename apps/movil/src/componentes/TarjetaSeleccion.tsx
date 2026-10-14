import { Animated, Pressable, View } from 'react-native'
import { Check, type LucideIcon } from 'lucide-react-native'

import { useTema } from '@/ui/proveedor'

import { Texto, tocar, usePulsacion } from './base'

// Tarjeta de selección única: objetivo, nivel de actividad. Un icono de línea a la izquierda,
// título y una línea de apoyo opcional, y una marca a la derecha cuando está elegida. La
// seleccionada lleva borde de acento y fondo tenue; nada de relleno sólido.

interface Props {
  titulo: string
  descripcion?: string
  seleccionado: boolean
  onPress: () => void
  icono?: LucideIcon
}

export function TarjetaSeleccion({ titulo, descripcion, seleccionado, onPress, icono: Icono }: Props) {
  const { colores, radios, espaciado } = useTema()
  const { escala, aMin, aMax } = usePulsacion(0.985)

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
          gap: espaciado.dos,
          padding: espaciado.dos,
          borderRadius: radios.l,
          borderWidth: 1,
          borderColor: seleccionado ? colores.acento : colores.borde,
          backgroundColor: seleccionado ? colores.acento + '1A' : colores.tarjeta,
        }}>
        {Icono ? (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radios.m,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colores.hoja,
            }}>
            <Icono size={22} color={seleccionado ? colores.acentoContraste : colores.texto} strokeWidth={2} />
          </View>
        ) : null}

        <View style={{ flex: 1, gap: 2 }}>
          <Texto fuerte>{titulo}</Texto>
          {descripcion ? (
            <Texto variante="etiqueta" tono="secundario">
              {descripcion}
            </Texto>
          ) : null}
        </View>

        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: seleccionado ? 0 : 1.5,
            borderColor: colores.borde,
            backgroundColor: seleccionado ? colores.acento : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {seleccionado ? <Check size={15} color={colores.sobreAcento} strokeWidth={3} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  )
}
