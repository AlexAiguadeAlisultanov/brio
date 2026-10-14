import { useRef, useState, type ReactNode } from 'react'
import { Animated, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTema } from '@/ui/proveedor'

import { Texto } from './base'

// Contenedor de pantalla con título grande que se colapsa en una barra fina al desplazar, como
// en Hoy. Lo comparten Plan, Progreso y Perfil para que las cuatro pestañas tengan el mismo
// encabezado nativo y el mismo ritmo de márgenes. El movimiento es solo opacidad (no mueve la
// barra), así que respeta de serie la preferencia de movimiento reducido.

export function PantallaScroll({
  titulo,
  children,
  onRefresh,
}: {
  titulo: string
  children: ReactNode
  onRefresh?: () => Promise<void>
}) {
  const { colores, espaciado } = useTema()
  const insets = useSafeAreaInsets()
  const scrollY = useRef(new Animated.Value(0)).current
  const [refrescando, setRefrescando] = useState(false)

  const alturaBarra = insets.top + 48
  const opacidadBarra = scrollY.interpolate({ inputRange: [24, 72], outputRange: [0, 1], extrapolate: 'clamp' })
  const opacidadTitulo = scrollY.interpolate({ inputRange: [0, 64], outputRange: [1, 0], extrapolate: 'clamp' })

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })

  const refrescar = onRefresh
    ? async () => {
        setRefrescando(true)
        await onRefresh()
        setRefrescando(false)
      }
    : undefined

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: alturaBarra,
          paddingTop: insets.top,
          zIndex: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colores.fondo,
          borderBottomWidth: 1,
          borderBottomColor: colores.borde,
          opacity: opacidadBarra,
        }}>
        <Texto variante="seccion" fuerte>
          {titulo}
        </Texto>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={refrescar ? <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.acento} /> : undefined}
        contentContainerStyle={{
          paddingTop: insets.top + espaciado.uno,
          paddingBottom: insets.bottom + espaciado.seis,
          paddingHorizontal: espaciado.tres,
          gap: espaciado.tres,
        }}>
        <Animated.View style={{ opacity: opacidadTitulo }}>
          <Texto variante="titulo" style={{ fontSize: 34, lineHeight: 40 }}>
            {titulo}
          </Texto>
        </Animated.View>
        {children}
      </Animated.ScrollView>
    </View>
  )
}
