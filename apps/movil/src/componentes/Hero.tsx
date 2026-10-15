import { type ReactNode } from 'react'
import { View, type ViewStyle } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'

import { GRADIENTES } from '@/ui/tema'
import { useTema } from '@/ui/proveedor'

// Hero a sangre: una foto de fondo con un velo oscuro de abajo arriba para que el texto se lea
// siempre, aunque la foto tarde o no cargue. El contenido (titular, apoyo, acciones) se apoya
// abajo. Si no se pasa foto, el velo sobre el fondo casi negro ya deja una portada digna, así
// que el export web nunca depende de que exista la imagen.

export function Hero({
  imagen,
  altura,
  children,
  style,
}: {
  imagen?: ImageSource
  altura: number
  children?: ReactNode
  style?: ViewStyle
}) {
  const { colores, espaciado } = useTema()

  return (
    <View style={[{ height: altura, backgroundColor: colores.fondo, overflow: 'hidden' }, style]}>
      {imagen ? (
        <Image
          source={imagen}
          style={{ ...StyleSheetAbsolute }}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
          // Color de espera: el mismo casi negro de la marca, nunca un flash blanco.
          placeholder={{ blurhash: undefined }}
          placeholderContentFit="cover"
        />
      ) : null}
      <LinearGradient colors={GRADIENTES.veloHero} locations={[0, 0.55, 1]} style={{ ...StyleSheetAbsolute }} />
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: espaciado.tres, gap: espaciado.dos }}>{children}</View>
    </View>
  )
}

// Caja absoluta reutilizada por la foto y el velo. Evita repetir el literal en dos sitios.
const StyleSheetAbsolute = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}
