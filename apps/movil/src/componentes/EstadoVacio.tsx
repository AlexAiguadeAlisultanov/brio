import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTema } from '@/ui/proveedor'

import { Texto } from './base'
import { BotonPrimario } from './botones'

// Estado vacío con una sola acción clara para empezar. Mismo tono y aire que el resto: título,
// una frase que explica qué va a aparecer aquí y, como mucho, un botón para dar el primer paso.

export function EstadoVacio({
  titulo,
  texto,
  accion,
}: {
  titulo: string
  texto: string
  accion?: { texto: string; onPress: () => void }
}) {
  const { colores, espaciado } = useTema()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colores.fondo }}>
      <View style={{ flex: 1, padding: espaciado.tres, justifyContent: 'center', gap: espaciado.dos }}>
        <Texto variante="titulo">{titulo}</Texto>
        <Texto tono="secundario">{texto}</Texto>
        {accion ? (
          <>
            <View style={{ height: espaciado.dos }} />
            <BotonPrimario texto={accion.texto} onPress={accion.onPress} />
          </>
        ) : null}
      </View>
    </SafeAreaView>
  )
}
