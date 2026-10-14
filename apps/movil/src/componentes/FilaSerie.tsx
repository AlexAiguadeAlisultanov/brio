import { Pressable, TextInput, View } from 'react-native'
import { Check } from 'lucide-react-native'

import { useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar } from './base'

// Fila de registro de una serie: número de serie, peso y reps con teclado numérico real, y un
// check que la marca como hecha con una háptica. El valor vive fuera (controlado): la fila solo
// pinta y avisa de los cambios, que la pantalla guarda con el repositorio.

export interface DatosSerie {
  peso?: number
  reps?: number
  completada: boolean
}

export function FilaSerie({
  numero,
  datos,
  pesoSugerido,
  repsSugeridas,
  onCambio,
}: {
  numero: number
  datos: DatosSerie
  pesoSugerido?: number
  repsSugeridas?: number
  onCambio: (datos: DatosSerie) => void
}) {
  const { colores, radios, espaciado } = useTema()
  const t = useT()

  const parsear = (texto: string, decimales: boolean): number | undefined => {
    const limpio = texto.replace(',', '.').replace(/[^0-9.]/g, '')
    if (limpio === '' || limpio === '.') return undefined
    const n = Number(limpio)
    if (!Number.isFinite(n)) return undefined
    return decimales ? n : Math.trunc(n)
  }

  const alternar = () => {
    tocar(datos.completada ? 'ligero' : 'exito')
    onCambio({ ...datos, completada: !datos.completada })
  }

  const campo = (valor: number | undefined, placeholder: number | undefined, decimales: boolean, onTexto: (n: number | undefined) => void, etiqueta: string) => (
    <View style={{ flex: 1, gap: 2 }}>
      <Texto variante="pie" tono="secundario">
        {etiqueta}
      </Texto>
      <TextInput
        value={valor != null ? String(valor) : ''}
        onChangeText={(texto) => onTexto(parsear(texto, decimales))}
        keyboardType={decimales ? 'decimal-pad' : 'number-pad'}
        inputMode={decimales ? 'decimal' : 'numeric'}
        placeholder={placeholder != null ? String(placeholder) : '—'}
        placeholderTextColor={colores.textoSecundario}
        editable={!datos.completada}
        style={{
          color: colores.texto,
          fontSize: 18,
          fontWeight: '600',
          fontVariant: ['tabular-nums'],
          minHeight: 40,
          borderRadius: radios.s,
          borderWidth: 1,
          borderColor: colores.borde,
          backgroundColor: datos.completada ? 'transparent' : colores.tarjeta,
          paddingHorizontal: espaciado.uno,
          opacity: datos.completada ? 0.6 : 1,
        }}
      />
    </View>
  )

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: espaciado.uno }}>
      <View style={{ width: 56, paddingBottom: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('entreno.serieN').replace('{n}', String(numero))}
        </Texto>
      </View>
      {campo(datos.peso, pesoSugerido, true, (n) => onCambio({ ...datos, peso: n }), `${t('entreno.peso')} (${t('comun.kg')})`)}
      {campo(datos.reps, repsSugeridas, false, (n) => onCambio({ ...datos, reps: n }), t('entreno.reps'))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('comun.hecho')}
        accessibilityState={{ checked: datos.completada }}
        onPress={alternar}
        style={{
          width: 44,
          height: 44,
          borderRadius: radios.s,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: datos.completada ? colores.acento : colores.tarjeta,
          borderWidth: 1,
          borderColor: datos.completada ? colores.acento : colores.borde,
        }}>
        <Check size={20} color={datos.completada ? colores.sobreAcento : colores.textoSecundario} strokeWidth={2.5} />
      </Pressable>
    </View>
  )
}
