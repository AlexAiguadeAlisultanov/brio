import { useState } from 'react'
import { TextInput, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native'

import { FUENTES } from '@/ui/tema'
import { useTema } from '@/ui/proveedor'

import { Texto } from './base'

// Campo de texto con etiqueta, para correo y contraseña. El borde se enciende en acento al
// enfocar, como el resto de controles. Deja pasar el teclado y el autocompletado nativos.

export function CampoTexto({
  etiqueta,
  valor,
  onChange,
  tipo = 'texto',
  pista,
  autoComplete,
  textContentType,
  onSubmitEditing,
  returnKeyType,
}: {
  etiqueta: string
  valor: string
  onChange: (v: string) => void
  tipo?: 'texto' | 'email' | 'password'
  pista?: string
  autoComplete?: TextInputProps['autoComplete']
  textContentType?: TextInputProps['textContentType']
  onSubmitEditing?: () => void
  returnKeyType?: TextInputProps['returnKeyType']
}) {
  const { colores, espaciado, radios } = useTema()
  const [enfocado, setEnfocado] = useState(false)

  const teclado: KeyboardTypeOptions = tipo === 'email' ? 'email-address' : 'default'

  return (
    <View style={{ gap: espaciado.media }}>
      <Texto variante="etiqueta" tono="secundario">
        {etiqueta}
      </Texto>
      <TextInput
        value={valor}
        onChangeText={onChange}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        keyboardType={teclado}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={tipo === 'password'}
        autoComplete={autoComplete}
        textContentType={textContentType}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        placeholderTextColor={colores.textoSecundario}
        style={{
          minHeight: 52,
          paddingHorizontal: espaciado.dos,
          borderRadius: radios.m,
          borderWidth: 1,
          borderColor: enfocado ? colores.acento : colores.borde,
          backgroundColor: colores.hoja,
          color: colores.texto,
          fontFamily: FUENTES.regular,
          fontSize: 16,
        }}
      />
      {pista ? (
        <Texto variante="pie" tono="secundario">
          {pista}
        </Texto>
      ) : null}
    </View>
  )
}
