import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Dimensions, Easing, Modal, Pressable, View } from 'react-native'
import { PanGestureHandler, type PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTema } from '@/ui/proveedor'

import { Texto, useMovimientoReducido } from './base'

// Hoja inferior deslizable: sube desde abajo sobre la pestaña actual, se arrastra hacia abajo
// para cerrarla y toca fuera para descartar. Es el contenedor de todas las acciones puntuales
// (sustituir, check-in, feedback). El movimiento respeta la preferencia de movimiento reducido:
// en vez de deslizar, aparece con una transición de opacidad.

const DURACION = 220
const UMBRAL_CIERRE = 120

export function HojaInferior({
  visible,
  onClose,
  titulo,
  children,
}: {
  visible: boolean
  onClose: () => void
  titulo?: string
  children: ReactNode
}) {
  const { colores, espaciado, radios } = useTema()
  const insets = useSafeAreaInsets()
  const reducido = useMovimientoReducido()
  const alto = Dimensions.get('window').height

  const [render, setRender] = useState(visible)
  const y = useRef(new Animated.Value(alto)).current
  const fondo = useRef(new Animated.Value(0)).current
  const arrastre = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setRender(true)
      arrastre.setValue(0)
      if (reducido) {
        y.setValue(0)
        fondo.setValue(1)
      } else {
        y.setValue(alto)
        Animated.parallel([
          Animated.timing(y, { toValue: 0, duration: DURACION, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(fondo, { toValue: 1, duration: DURACION, useNativeDriver: true }),
        ]).start()
      }
    } else if (render) {
      if (reducido) {
        fondo.setValue(0)
        setRender(false)
      } else {
        Animated.parallel([
          Animated.timing(y, { toValue: alto, duration: DURACION, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(fondo, { toValue: 0, duration: DURACION, useNativeDriver: true }),
        ]).start(() => setRender(false))
      }
    }
    // alto no cambia en la práctica; dejarlo fuera evita reiniciar la animación al rotar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reducido])

  const alSoltar = (e: PanGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.state !== State.END) return
    const { translationY, velocityY } = e.nativeEvent
    if (translationY > UMBRAL_CIERRE || velocityY > 800) {
      onClose()
    } else {
      Animated.spring(arrastre, { toValue: 0, useNativeDriver: true, friction: 8, tension: 120 }).start()
    }
  }

  if (!render) return null

  const arrastreAcotado = arrastre.interpolate({ inputRange: [0, alto], outputRange: [0, alto], extrapolateLeft: 'clamp' })
  const translateY = Animated.add(y, arrastreAcotado)

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={{ ...StyleSheetAbsolute, backgroundColor: '#000', opacity: fondo.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }}>
          <Pressable accessibilityRole="button" accessibilityLabel={titulo} style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor: colores.hoja,
            borderTopLeftRadius: radios.l,
            borderTopRightRadius: radios.l,
            paddingBottom: Math.max(insets.bottom, espaciado.dos),
            maxHeight: alto * 0.9,
          }}>
          <PanGestureHandler onGestureEvent={Animated.event([{ nativeEvent: { translationY: arrastre } }], { useNativeDriver: true })} onHandlerStateChange={alSoltar}>
            <Animated.View style={{ paddingTop: espaciado.uno, alignItems: 'center' }}>
              <View style={{ width: 40, height: 5, borderRadius: 999, backgroundColor: colores.borde, marginBottom: espaciado.uno }} />
              {titulo ? (
                <Texto variante="seccion" fuerte style={{ paddingBottom: espaciado.uno }}>
                  {titulo}
                </Texto>
              ) : null}
            </Animated.View>
          </PanGestureHandler>
          <View style={{ paddingHorizontal: espaciado.tres, paddingTop: espaciado.uno }}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const StyleSheetAbsolute = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }
