import { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'

import { useTema } from '@/ui/proveedor'

import { Texto, tocar } from './base'

// Campo numérico con stepper y sufijo de unidad. Teclado numérico real. El stepper es para
// ajustes finos de a uno; el teclado, para teclear un valor de golpe. El valor vive fuera
// (controlado): el componente solo sabe pintar y avisar de los cambios.

interface Props {
  etiqueta: string
  valor: number | undefined
  onChange: (valor: number | undefined) => void
  sufijo?: string
  min?: number
  max?: number
  paso?: number
  // Permite decimales (peso, grasa). Por defecto solo enteros (edad, altura).
  decimales?: boolean
  placeholder?: string
}

export function CampoNumerico({
  etiqueta,
  valor,
  onChange,
  sufijo,
  min,
  max,
  paso = 1,
  decimales,
  placeholder,
}: Props) {
  const { colores, radios, espaciado } = useTema()
  // Mientras el campo tiene el foco mandamos el borrador (lo que se está tecleando, incluso a
  // medias); cuando no, mostramos el valor externo, así un cambio de unidades o del stepper se
  // refleja solo. El borrador a null significa "no estoy editando".
  const [borrador, setBorrador] = useState<string | null>(null)
  const enfocado = borrador != null
  const texto = borrador != null ? borrador : valor != null ? String(valor) : ''

  const acotar = (n: number) => {
    let v = n
    if (min != null) v = Math.max(min, v)
    if (max != null) v = Math.min(max, v)
    return v
  }

  const fijar = (n: number) => {
    const v = acotar(decimales ? Math.round(n * 10) / 10 : Math.round(n))
    onChange(v)
  }

  const alTeclear = (t: string) => {
    const limpio = t.replace(',', '.').replace(/[^0-9.]/g, '')
    setBorrador(limpio)
    if (limpio === '' || limpio === '.') {
      onChange(undefined)
      return
    }
    const n = Number(limpio)
    if (Number.isFinite(n)) onChange(decimales ? n : Math.trunc(n))
  }

  const paos = (dir: 1 | -1) => {
    tocar()
    const actual = valor ?? min ?? 0
    fijar(actual + dir * paso)
  }

  const botonEstilo = {
    width: 44,
    height: 44,
    borderRadius: radios.s,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colores.hoja,
  }

  return (
    <View style={{ gap: espaciado.uno }}>
      <Texto variante="etiqueta" tono="secundario">
        {etiqueta}
      </Texto>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.uno }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Restar" onPress={() => paos(-1)} style={botonEstilo}>
          <Minus size={20} color={colores.texto} strokeWidth={2} />
        </Pressable>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: espaciado.media,
            minHeight: 52,
            borderRadius: radios.m,
            borderWidth: 1,
            borderColor: enfocado ? colores.acento : colores.borde,
            backgroundColor: colores.hoja,
            paddingHorizontal: espaciado.dos,
          }}>
          <TextInput
            value={texto}
            onChangeText={alTeclear}
            onFocus={() => setBorrador(valor != null ? String(valor) : '')}
            onBlur={() => {
              setBorrador(null)
              if (valor != null) fijar(valor)
            }}
            keyboardType={decimales ? 'decimal-pad' : 'number-pad'}
            inputMode={decimales ? 'decimal' : 'numeric'}
            placeholder={placeholder}
            placeholderTextColor={colores.textoSecundario}
            style={{
              color: colores.texto,
              fontSize: 22,
              fontWeight: '600',
              fontVariant: ['tabular-nums'],
              textAlign: 'center',
              minWidth: 56,
              paddingVertical: espaciado.uno,
            }}
          />
          {sufijo ? (
            <Texto tono="secundario" fuerte>
              {sufijo}
            </Texto>
          ) : null}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Sumar" onPress={() => paos(1)} style={botonEstilo}>
          <Plus size={20} color={colores.texto} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  )
}
