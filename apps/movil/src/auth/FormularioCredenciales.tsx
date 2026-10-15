import { useRouter } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'

import { BotonPrimario, BotonTexto, CampoTexto, Texto } from '@/componentes'
import { useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import { useTema } from '@/ui/proveedor'

import { useAuth } from './contexto'
import { mapearErrorAcceso, validarCredenciales, type ClaveErrorAcceso } from './validacion'

// Formulario compartido por registro y acceso: los dos piden correo y contraseña y validan
// igual. La diferencia es qué llamada hace y cómo traduce el error. Al terminar bien, manda al
// índice, que decide a dónde ir (onboarding si aún no hay perfil, pestañas si ya lo hay).

export function FormularioCredenciales({ modo }: { modo: 'registro' | 'acceso' }) {
  const { registrar, acceder } = useAuth()
  const router = useRouter()
  const t = useT()
  const { espaciado } = useTema()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ClaveErrorAcceso | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async () => {
    const fallo = validarCredenciales(email, password)
    if (fallo) {
      setError(fallo)
      return
    }
    setError(null)
    setEnviando(true)
    try {
      if (modo === 'registro') await registrar(email.trim(), password)
      else await acceder(email.trim(), password)
      router.replace('/')
    } catch (e) {
      setError(mapearErrorAcceso(e, modo))
      setEnviando(false)
    }
  }

  const boton = modo === 'registro' ? t('acceso.registro.boton') : t('acceso.entrar.boton')
  const enlace = modo === 'registro' ? t('acceso.registro.yaTengo') : t('acceso.entrar.noTengo')
  const irAlOtro = () => router.replace(modo === 'registro' ? '/acceso/entrar' : '/acceso/registro')

  return (
    <View style={{ gap: espaciado.dos }}>
      <CampoTexto
        etiqueta={t('acceso.email')}
        valor={email}
        onChange={(v) => {
          setEmail(v)
          setError(null)
        }}
        tipo="email"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <CampoTexto
        etiqueta={t('acceso.password')}
        valor={password}
        onChange={(v) => {
          setPassword(v)
          setError(null)
        }}
        tipo="password"
        pista={modo === 'registro' ? t('acceso.passwordPista') : undefined}
        autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
        textContentType={modo === 'registro' ? 'newPassword' : 'password'}
        returnKeyType="go"
        onSubmitEditing={() => void enviar()}
      />

      {error ? (
        <Texto variante="etiqueta" tono="bloqueo">
          {t(`acceso.error.${error}` as ClaveI18n)}
        </Texto>
      ) : null}

      <BotonPrimario texto={boton} onPress={() => void enviar()} cargando={enviando} />
      <View style={{ alignItems: 'center' }}>
        <BotonTexto texto={enlace} onPress={irAlOtro} />
      </View>
    </View>
  )
}
