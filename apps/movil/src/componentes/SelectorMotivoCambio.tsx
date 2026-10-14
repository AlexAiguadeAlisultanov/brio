import { Pressable, View } from 'react-native'
import { ChevronRight, Lock } from 'lucide-react-native'

import { useTema } from '@/ui/proveedor'

import { Texto, tocar } from './base'

// Selector del motivo de un cambio. Distingue lo permanente ("no puedo con esto", "me molesta
// una zona", "no tengo el material") de lo puntual ("hoy no me apetece"). Lo permanente deja
// una marca para que se entienda que afectará al plan de ahora en adelante, no solo a hoy.

export interface MotivoOpcion {
  id: string
  titulo: string
  descripcion?: string
  permanente?: boolean
}

export function SelectorMotivoCambio({
  opciones,
  onElegir,
}: {
  opciones: MotivoOpcion[]
  onElegir: (id: string) => void
}) {
  const { colores, espaciado, radios } = useTema()

  return (
    <View style={{ gap: espaciado.uno }}>
      {opciones.map((o) => (
        <Pressable
          key={o.id}
          accessibilityRole="button"
          onPress={() => {
            tocar()
            onElegir(o.id)
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: espaciado.dos,
            padding: espaciado.dos,
            borderRadius: radios.m,
            borderWidth: 1,
            borderColor: colores.borde,
            backgroundColor: colores.tarjeta,
          }}>
          <View style={{ flex: 1, gap: espaciado.media }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.uno }}>
              <Texto fuerte>{o.titulo}</Texto>
              {o.permanente ? <Lock size={13} color={colores.textoSecundario} strokeWidth={2} /> : null}
            </View>
            {o.descripcion ? (
              <Texto variante="etiqueta" tono="secundario">
                {o.descripcion}
              </Texto>
            ) : null}
          </View>
          <ChevronRight size={20} color={colores.textoSecundario} strokeWidth={2} />
        </Pressable>
      ))}
    </View>
  )
}
