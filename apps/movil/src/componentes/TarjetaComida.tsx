import { useRef } from 'react'
import { Animated, Pressable, View } from 'react-native'
import { Check, Plus, Repeat } from 'lucide-react-native'
import { PanGestureHandler, type PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler'

import { useLocale, useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar } from './base'
import { numero } from './formato'

// Tarjeta de un hueco de comida del día: el momento, sus macros y las kcal destacadas. Deslizar
// hacia la izquierda abre el cambio rápido (sustituir); los botones dejan registrar la comida y
// cambiarla sin deslizar, para quien prefiera no usar el gesto. El nombre sale del catálogo y
// las cifras, del plan.

export function TarjetaComida({
  momento,
  titulo,
  kcal,
  proteinaG,
  carbosG,
  grasaG,
  registrada,
  onRegistrar,
  onSustituir,
}: {
  momento: string
  titulo: string
  kcal: number
  proteinaG: number
  carbosG: number
  grasaG: number
  registrada: boolean
  onRegistrar: () => void
  onSustituir: () => void
}) {
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  const { locale } = useLocale()
  const x = useRef(new Animated.Value(0)).current

  const alSoltar = (e: PanGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.state !== State.END) return
    if (e.nativeEvent.translationX < -60) {
      tocar()
      onSustituir()
    }
    Animated.spring(x, { toValue: 0, useNativeDriver: true, friction: 8, tension: 120 }).start()
  }

  return (
    <PanGestureHandler
      activeOffsetX={[-20, 20]}
      onGestureEvent={Animated.event([{ nativeEvent: { translationX: x } }], { useNativeDriver: true })}
      onHandlerStateChange={alSoltar}>
      <Animated.View style={{ transform: [{ translateX: x.interpolate({ inputRange: [-200, 0, 1], outputRange: [-120, 0, 0] }) }] }}>
        <View
          style={{
            padding: espaciado.dos,
            borderRadius: radios.l,
            backgroundColor: colores.tarjeta,
            gap: espaciado.uno,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: espaciado.dos }}>
            <View style={{ flex: 1, gap: espaciado.media }}>
              <Texto variante="pie" tono="secundario" style={{ letterSpacing: 0.4 }}>
                {momento.toUpperCase()}
              </Texto>
              <Texto fuerte>{titulo}</Texto>
              <Texto variante="etiqueta" tono="secundario" numerico>
                {t('macro.proteina').charAt(0)} {numero(proteinaG, locale)} · {t('macro.carbos').charAt(0)} {numero(carbosG, locale)} · {t('macro.grasa').charAt(0)} {numero(grasaG, locale)} {t('comun.gramos')}
              </Texto>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Texto variante="seccion" numerico>
                {numero(kcal, locale)}
              </Texto>
              <Texto variante="pie" tono="secundario">
                {t('comun.kcal')}
              </Texto>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: espaciado.uno, marginTop: espaciado.media }}>
            <Accion
              icono={registrada ? Check : Plus}
              etiqueta={registrada ? t('hoy.comidaRegistrada') : t('comun.guardar')}
              activo={registrada}
              onPress={() => {
                tocar(registrada ? 'ligero' : 'exito')
                onRegistrar()
              }}
            />
            <Accion
              icono={Repeat}
              etiqueta={t('entreno.cambiar')}
              onPress={() => {
                tocar()
                onSustituir()
              }}
            />
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  )
}

function Accion({
  icono: Icono,
  etiqueta,
  activo,
  onPress,
}: {
  icono: typeof Check
  etiqueta: string
  activo?: boolean
  onPress: () => void
}) {
  const { colores, espaciado, radios } = useTema()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaciado.media,
        paddingVertical: espaciado.uno,
        paddingHorizontal: espaciado.dos,
        borderRadius: radios.s,
        borderWidth: 1,
        borderColor: activo ? colores.exito : colores.borde,
        backgroundColor: activo ? colores.exito + '1F' : colores.hoja,
      }}>
      <Icono size={15} color={activo ? colores.exito : colores.textoSecundario} strokeWidth={2} />
      <Texto variante="etiqueta" fuerte style={activo ? { color: colores.exito } : undefined}>
        {etiqueta}
      </Texto>
    </Pressable>
  )
}
