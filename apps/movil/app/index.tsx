import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ServerOff } from 'lucide-react-native'

import { useAuth } from '@/auth/contexto'
import { Texto } from '@/componentes'
import { useRepositorio } from '@/db/provider'
import { useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

// Punto de arranque y portero de la app. El orden manda:
//  1. mientras la cuenta se resuelve, pantalla de carga;
//  2. sin servidor de cuentas configurado, pantalla clara que lo explica (no rompe el export);
//  3. sin sesión, al stack de acceso;
//  4. con sesión pero sin perfil mínimo, al onboarding;
//  5. con todo, a las pestañas.
export default function Indice() {
  const { cargando, sinServidor, usuario } = useAuth()
  const repo = useRepositorio()
  const { colores } = useTema()
  const [hayPerfil, setHayPerfil] = useState<boolean | null>(null)

  useEffect(() => {
    let vivo = true
    if (!usuario) {
      setHayPerfil(null)
      return
    }
    repo
      .hayPerfilMinimo()
      .then((hay) => vivo && setHayPerfil(hay))
      .catch(() => vivo && setHayPerfil(false))
    return () => {
      vivo = false
    }
  }, [repo, usuario])

  if (cargando) return <Cargando color={colores.acento} fondo={colores.fondo} />
  if (sinServidor) return <SinServidor />
  if (!usuario) return <Redirect href="/acceso/bienvenida" />
  if (hayPerfil === null) return <Cargando color={colores.acento} fondo={colores.fondo} />
  if (!hayPerfil) return <Redirect href="/onboarding/bienvenida" />
  return <Redirect href="/(tabs)/hoy" />
}

function Cargando({ color, fondo }: { color: string; fondo: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: fondo }}>
      <ActivityIndicator color={color} />
    </View>
  )
}

// Sin servidor de cuentas: en una demo o un export estático no hay backend al que entrar. Se
// explica con normalidad en vez de dejar la app colgada o lanzando errores.
function SinServidor() {
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colores.fondo }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: espaciado.tres, gap: espaciado.dos }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radios.m,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colores.tarjeta,
          }}>
          <ServerOff size={26} color={colores.textoSecundario} strokeWidth={2} />
        </View>
        <Texto variante="titulo">{t('acceso.sinServidor.titulo')}</Texto>
        <Texto tono="secundario">{t('acceso.sinServidor.texto')}</Texto>
      </View>
    </SafeAreaView>
  )
}
