import { ActivityIndicator, Animated, Pressable, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTema } from '@/ui/proveedor'

import { Texto, tocar, usePulsacion } from './base'

// Botones de Brío. Una sola acción primaria por pantalla (botón relleno en acento); el resto
// de acciones van en el secundario de contorno. El acento vive solo aquí y en los estados
// seleccionados, nunca como fondo de pantalla.

interface BotonProps {
  texto: string
  onPress: () => void
  desactivado?: boolean
  cargando?: boolean
  icono?: LucideIcon
}

export function BotonPrimario({ texto, onPress, desactivado, cargando, icono: Icono }: BotonProps) {
  const { colores, espaciado, radios } = useTema()
  const { escala, aMin, aMax } = usePulsacion()
  const inerte = desactivado || cargando

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: inerte }}
        disabled={inerte}
        onPressIn={aMin}
        onPressOut={aMax}
        onPress={() => {
          tocar('ligero')
          onPress()
        }}
        style={{
          backgroundColor: colores.acento,
          borderRadius: radios.m,
          minHeight: 52,
          paddingVertical: espaciado.dos,
          paddingHorizontal: espaciado.tres,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: espaciado.uno,
          opacity: inerte ? 0.4 : 1,
        }}>
        {cargando ? (
          <ActivityIndicator color={colores.sobreAcento} />
        ) : (
          <>
            {Icono ? <Icono size={20} color={colores.sobreAcento} strokeWidth={2} /> : null}
            <Texto tono="sobreAcento" fuerte>
              {texto}
            </Texto>
          </>
        )}
      </Pressable>
    </Animated.View>
  )
}

export function BotonSecundario({ texto, onPress, desactivado, icono: Icono }: BotonProps) {
  const { colores, espaciado, radios } = useTema()
  const { escala, aMin, aMax } = usePulsacion(0.98)

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: desactivado }}
        disabled={desactivado}
        onPressIn={aMin}
        onPressOut={aMax}
        onPress={() => {
          tocar()
          onPress()
        }}
        style={{
          borderRadius: radios.m,
          minHeight: 52,
          paddingVertical: espaciado.dos,
          paddingHorizontal: espaciado.tres,
          borderWidth: 1,
          borderColor: colores.borde,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: espaciado.uno,
          opacity: desactivado ? 0.4 : 1,
        }}>
        {Icono ? <Icono size={20} color={colores.texto} strokeWidth={2} /> : null}
        <Texto fuerte>{texto}</Texto>
      </Pressable>
    </Animated.View>
  )
}

// Botón de texto, sin relleno ni contorno, para acciones terciarias (editar un paso, enlaces).
export function BotonTexto({ texto, onPress, icono: Icono }: Omit<BotonProps, 'cargando' | 'desactivado'>) {
  const { colores, espaciado } = useTema()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tocar()
        onPress()
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.media, paddingVertical: espaciado.uno }}>
      {Icono ? (
        <View>
          <Icono size={18} color={colores.acentoContraste} strokeWidth={2} />
        </View>
      ) : null}
      <Texto tono="acento" fuerte style={{ color: colores.acentoContraste }}>
        {texto}
      </Texto>
    </Pressable>
  )
}
