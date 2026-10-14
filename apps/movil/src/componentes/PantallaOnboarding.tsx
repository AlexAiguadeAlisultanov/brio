import { useEffect, useState, type ReactNode } from 'react'
import { Animated, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTema } from '@/ui/proveedor'

import { Texto, useMovimientoReducido } from './base'
import { BotonPrimario, BotonSecundario } from './botones'

// Envoltorio de cada paso del onboarding. Pone el título y el apoyo arriba, deja el contenido
// en un scroll y fija abajo la acción primaria respetando el área segura. La barra de progreso
// vive en el layout del stack, así que aquí no se repite. El contenido entra con una aparición
// breve que se apaga con el movimiento reducido.

interface Props {
  titulo: string
  apoyo?: string
  children: ReactNode
  primario: { texto: string; onPress: () => void; desactivado?: boolean; cargando?: boolean }
  secundario?: { texto: string; onPress: () => void }
  // Texto fino bajo el botón (por ejemplo, el aviso médico).
  pie?: ReactNode
}

export function PantallaOnboarding({ titulo, apoyo, children, primario, secundario, pie }: Props) {
  const { colores, espaciado } = useTema()
  const insets = useSafeAreaInsets()
  const reducido = useMovimientoReducido()
  const [aparicion] = useState(() => new Animated.Value(0))
  const [desplazamiento] = useState(() => new Animated.Value(12))

  useEffect(() => {
    if (reducido) {
      aparicion.setValue(1)
      desplazamiento.setValue(0)
      return
    }
    Animated.parallel([
      Animated.timing(aparicion, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(desplazamiento, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [aparicion, desplazamiento, reducido])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View
        style={{ flex: 1, opacity: aparicion, transform: [{ translateY: desplazamiento }] }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: espaciado.tres,
            paddingTop: espaciado.tres,
            paddingBottom: espaciado.cuatro,
            gap: espaciado.dos,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={{ gap: espaciado.uno }}>
            <Texto variante="titulo">{titulo}</Texto>
            {apoyo ? <Texto tono="secundario">{apoyo}</Texto> : null}
          </View>
          <View style={{ gap: espaciado.dos, marginTop: espaciado.uno }}>{children}</View>
        </ScrollView>
      </Animated.View>

      <View
        style={{
          paddingHorizontal: espaciado.tres,
          paddingTop: espaciado.dos,
          paddingBottom: Math.max(insets.bottom, espaciado.dos),
          gap: espaciado.dos,
          borderTopWidth: 1,
          borderTopColor: colores.borde,
          backgroundColor: colores.fondo,
        }}>
        {pie ? <View>{pie}</View> : null}
        <View style={{ gap: espaciado.uno }}>
          <BotonPrimario
            texto={primario.texto}
            onPress={primario.onPress}
            desactivado={primario.desactivado}
            cargando={primario.cargando}
          />
          {secundario ? <BotonSecundario texto={secundario.texto} onPress={secundario.onPress} /> : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
