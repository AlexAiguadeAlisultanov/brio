import { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Timer, X } from 'lucide-react-native'

import { useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar } from './base'

// Temporizador de descanso entre series: cuenta atrás desde los segundos que prescribe el plan
// y avisa con una háptica al terminar. Se puede arrancar a mano o dejar que arranque solo al
// marcar una serie (cuando `autoIniciar` cambia). Mientras corre, muestra el tiempo restante y
// se puede cancelar de un toque.

export function TemporizadorDescanso({ segundos, autoIniciar }: { segundos: number; autoIniciar?: number }) {
  const { colores, radios, espaciado } = useTema()
  const t = useT()
  const [restante, setRestante] = useState<number | null>(null)
  const [recienFin, setRecienFin] = useState(false)
  const finAt = useRef<number>(0)

  const arrancar = () => {
    setRecienFin(false)
    finAt.current = Date.now() + segundos * 1000
    setRestante(segundos)
  }

  const cancelar = () => {
    setRestante(null)
    setRecienFin(false)
  }

  // Arranque automático al marcar una serie: el token cambia y relanzamos la cuenta.
  useEffect(() => {
    if (autoIniciar && autoIniciar > 0) arrancar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoIniciar])

  useEffect(() => {
    if (restante == null) return undefined
    const id = setInterval(() => {
      const quedan = Math.ceil((finAt.current - Date.now()) / 1000)
      if (quedan <= 0) {
        clearInterval(id)
        setRestante(null)
        setRecienFin(true)
        tocar('exito')
      } else {
        setRestante(quedan)
      }
    }, 250)
    return () => clearInterval(id)
  }, [restante != null])

  if (restante != null) {
    const mm = Math.floor(restante / 60)
    const ss = String(restante % 60).padStart(2, '0')
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('comun.cancelar')}
        onPress={cancelar}
        style={pastilla(colores.acento + '24', colores.acento, radios.completo, espaciado)}>
        <Timer size={16} color={colores.acentoContraste} strokeWidth={2} />
        <Texto fuerte numerico style={{ color: colores.acentoContraste }}>
          {mm > 0 ? `${mm}:${ss}` : `${restante}s`}
        </Texto>
        <X size={14} color={colores.acentoContraste} strokeWidth={2} />
      </Pressable>
    )
  }

  if (recienFin) {
    return (
      <View style={pastilla(colores.exito + '24', colores.exito, radios.completo, espaciado)}>
        <Timer size={16} color={colores.exito} strokeWidth={2} />
        <Texto fuerte style={{ color: colores.exito }}>
          {t('entreno.descansoFin')}
        </Texto>
      </View>
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tocar()
        arrancar()
      }}
      style={pastilla(colores.tarjeta, colores.borde, radios.completo, espaciado)}>
      <Timer size={16} color={colores.textoSecundario} strokeWidth={2} />
      <Texto variante="etiqueta" tono="secundario" fuerte numerico>
        {t('entreno.descanso')} · {segundos}s
      </Texto>
    </Pressable>
  )
}

function pastilla(fondo: string, borde: string, radio: number, espaciado: { uno: number; dos: number }) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    gap: espaciado.uno,
    paddingVertical: espaciado.uno,
    paddingHorizontal: espaciado.dos,
    borderRadius: radio,
    borderWidth: 1,
    borderColor: borde,
    backgroundColor: fondo,
  }
}
