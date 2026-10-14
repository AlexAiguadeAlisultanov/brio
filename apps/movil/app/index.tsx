import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useRepositorio } from '@/db/provider'
import { useTema } from '@/ui/proveedor'

// Punto de arranque. Pregunta a la base si ya hay un perfil mínimo guardado: si lo hay, entra
// directo a las pestañas; si no, lleva al onboarding. Mientras resuelve, muestra un indicador.

type Destino = 'cargando' | 'onboarding' | 'tabs'

export default function Indice() {
  const repo = useRepositorio()
  const { colores } = useTema()
  const [destino, setDestino] = useState<Destino>('cargando')

  useEffect(() => {
    let vivo = true
    repo
      .hayPerfilMinimo()
      .then((hay) => {
        if (vivo) setDestino(hay ? 'tabs' : 'onboarding')
      })
      .catch(() => {
        if (vivo) setDestino('onboarding')
      })
    return () => {
      vivo = false
    }
  }, [repo])

  if (destino === 'cargando') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator color={colores.acento} />
      </View>
    )
  }

  if (destino === 'tabs') return <Redirect href="/(tabs)/hoy" />
  return <Redirect href="/onboarding/bienvenida" />
}
