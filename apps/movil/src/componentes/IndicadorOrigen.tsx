import { View } from 'react-native'
import { Cpu, Sparkles, WifiOff } from 'lucide-react-native'

import { useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

import { Texto } from './base'

// Señala de dónde viene una explicación o una propuesta: del motor (lo normal y lo que hay en
// esta fase), adaptada por la IA, o del respaldo sin conexión. Queda lista para los tres estados
// aunque ahora solo se usen 'motor' y 'local'. Es una etiqueta discreta, no un sello llamativo.

export type Origen = 'motor' | 'ia' | 'local'

const ICONO = { motor: Cpu, ia: Sparkles, local: WifiOff } as const
const CLAVE = { motor: 'origen.motor', ia: 'origen.ia', local: 'origen.local' } as const

export function IndicadorOrigen({ origen }: { origen: Origen }) {
  const { colores, espaciado } = useTema()
  const t = useT()
  const Icono = ICONO[origen]
  const color = origen === 'local' ? colores.precaucion : colores.textoSecundario

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.media }}>
      <Icono size={13} color={color} strokeWidth={2} />
      <Texto variante="pie" style={{ color }}>
        {t(CLAVE[origen])}
      </Texto>
    </View>
  )
}
