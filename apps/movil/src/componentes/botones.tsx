import { ActivityIndicator, Animated, Pressable, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { LucideIcon } from 'lucide-react-native'

import { GRADIENTES } from '@/ui/tema'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar, usePulsacion } from './base'

// Botones de Brío. Una sola acción primaria por pantalla (botón relleno en acento); el resto
// de acciones van en el secundario de contorno. El acento vive solo aquí y en los estados
// seleccionados, nunca como fondo de pantalla. El relleno es un degradado de dos paradas del
// mismo naranja: aporta profundidad sin dejar de ser un único acento.

interface BotonProps {
  texto: string
  onPress: () => void
  desactivado?: boolean
  cargando?: boolean
  icono?: LucideIcon
  // Variante dorada para la única acción de pago del muro premium.
  tono?: 'marca' | 'oro'
}

export function BotonPrimario({ texto, onPress, desactivado, cargando, icono: Icono, tono = 'marca' }: BotonProps) {
  const { colores, espaciado, radios } = useTema()
  const { escala, aMin, aMax } = usePulsacion()
  const inerte = desactivado || cargando
  const degradado = tono === 'oro' ? GRADIENTES.oro : GRADIENTES.marca

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
        style={{ borderRadius: radios.m, opacity: inerte ? 0.4 : 1, overflow: 'hidden' }}>
        <LinearGradient
          colors={degradado}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            minHeight: 52,
            paddingVertical: espaciado.dos,
            paddingHorizontal: espaciado.tres,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: espaciado.uno,
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
        </LinearGradient>
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
