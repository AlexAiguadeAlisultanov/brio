import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTema } from '@/ui/proveedor'

// Componentes de relleno para que la cáscara de navegación arranque y se pueda recorrer.
// Son provisionales: el diseño real de cada pantalla lo construye app-designer encima de los
// tokens de tema. No añadir aquí lógica de producto.

export function Placeholder({
  titulo,
  descripcion,
  pie,
  children,
}: {
  titulo: string
  descripcion?: string
  pie?: string
  children?: ReactNode
}) {
  const { colores, espaciado, tipografia } = useTema()
  return (
    <SafeAreaView style={[estilos.safe, { backgroundColor: colores.fondo }]}>
      <View style={[estilos.contenido, { padding: espaciado.tres, gap: espaciado.dos }]}>
        <Text
          style={{
            color: colores.texto,
            fontSize: tipografia.titulo.tamano,
            lineHeight: tipografia.titulo.interlineado,
            fontWeight: tipografia.titulo.peso,
          }}>
          {titulo}
        </Text>
        {descripcion ? (
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: tipografia.cuerpo.tamano,
              lineHeight: tipografia.cuerpo.interlineado,
            }}>
            {descripcion}
          </Text>
        ) : null}
        <View style={estilos.relleno} />
        {children}
        {pie ? (
          <Text style={{ color: colores.textoSecundario, fontSize: tipografia.pie.tamano }}>{pie}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

export function BotonPrimario({ texto, onPress }: { texto: string; onPress: () => void }) {
  const { colores, espaciado, radios, tipografia } = useTema()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colores.acento,
          borderRadius: radios.m,
          paddingVertical: espaciado.dos,
          paddingHorizontal: espaciado.tres,
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Text style={{ color: colores.sobreAcento, fontWeight: '600', fontSize: tipografia.cuerpo.tamano }}>
        {texto}
      </Text>
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  safe: { flex: 1 },
  contenido: { flex: 1 },
  relleno: { flex: 1 },
})
