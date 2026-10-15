import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft } from 'lucide-react-native'

import { Hero, Texto, tocar } from '@/componentes'
import { useT } from '@/i18n'
import { HERO_ACCESO } from '@/ui/imagenes'
import { useTema } from '@/ui/proveedor'

import { FormularioCredenciales } from './FormularioCredenciales'

// Marco común de crear cuenta y entrar: una banda de hero con la foto y el titular arriba, y
// debajo el formulario en una tarjeta que sube con el teclado. El botón de volver regresa a la
// portada. El contenido cambia solo por el `modo`.
export function PantallaFormAcceso({ modo }: { modo: 'registro' | 'acceso' }) {
  const router = useRouter()
  const t = useT()
  const { colores, espaciado, radios } = useTema()
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const titulo = modo === 'registro' ? t('acceso.registro.titulo') : t('acceso.entrar.titulo')
  const apoyo = modo === 'registro' ? t('acceso.registro.apoyo') : t('acceso.entrar.apoyo')

  const volver = () => {
    tocar()
    if (router.canGoBack()) router.back()
    else router.replace('/acceso/bienvenida')
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Hero imagen={HERO_ACCESO} altura={Math.max(260, height * 0.4)}>
        <Texto variante="titulo">{titulo}</Texto>
        <Texto tono="secundario">{apoyo}</Texto>
      </Hero>

      <Pressable
        accessibilityRole="button"
        onPress={volver}
        style={{
          position: 'absolute',
          top: insets.top + espaciado.uno,
          left: espaciado.dos,
          width: 44,
          height: 44,
          borderRadius: radios.completo,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(11,11,12,0.5)',
        }}>
        <ChevronLeft size={24} color={colores.texto} strokeWidth={2} />
      </Pressable>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: espaciado.tres,
            paddingBottom: Math.max(insets.bottom, espaciado.tres),
            gap: espaciado.dos,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <FormularioCredenciales modo={modo} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
