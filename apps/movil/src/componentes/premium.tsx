import { Pressable, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronRight, Lock, Sparkles } from 'lucide-react-native'

import { GRADIENTES } from '@/ui/tema'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar } from './base'

// Insignia premium: una pastilla dorada con destello. Marca lo que es de pago sin gritar; el
// oro vive solo aquí y en el muro, para que se lea "premium" sin ensuciar el naranja de marca.
export function InsigniaPremium({ texto }: { texto: string }) {
  const { colores, espaciado, radios } = useTema()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaciado.media,
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: espaciado.uno,
        borderRadius: radios.completo,
        borderWidth: 1,
        borderColor: colores.oro + '66',
        backgroundColor: colores.oro + '1F',
      }}>
      <Sparkles size={13} color={colores.oro} strokeWidth={2.2} />
      <Texto variante="pie" fuerte style={{ color: colores.oro, letterSpacing: 0.4 }}>
        {texto}
      </Texto>
    </View>
  )
}

// Muro de una función de pago: candado, qué desbloquea y una flecha. No es un error, es una
// invitación: al tocarlo se abre la pantalla Premium. Se usa allá donde una función premium
// queda bloqueada para quien no ha pagado.
export function MuroPremium({
  titulo,
  texto,
  onAbrir,
}: {
  titulo: string
  texto: string
  onAbrir: () => void
}) {
  const { colores, espaciado, radios } = useTema()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tocar()
        onAbrir()
      }}
      style={{ borderRadius: radios.l, overflow: 'hidden', borderWidth: 1, borderColor: colores.oro + '40' }}>
      <LinearGradient colors={GRADIENTES.tarjetaOscura} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: espaciado.tres, gap: espaciado.dos }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.dos }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radios.m,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colores.oro + '22',
            }}>
            <Lock size={20} color={colores.oro} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: espaciado.media }}>
            <Texto variante="seccion" fuerte>
              {titulo}
            </Texto>
            <Texto variante="etiqueta" tono="secundario">
              {texto}
            </Texto>
          </View>
          <ChevronRight size={20} color={colores.oro} strokeWidth={2} />
        </View>
      </LinearGradient>
    </Pressable>
  )
}
