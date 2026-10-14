import { useEffect, useState } from 'react'
import { AccessibilityInfo, Animated, Platform, Text, type TextProps, type TextStyle } from 'react-native'
import * as Haptics from 'expo-haptics'

import { useTema } from '@/ui/proveedor'

// Primitivas que comparten todos los componentes de Brío: tipografía, lectura de la
// preferencia de movimiento reducido y una pulsación suave. Viven aquí para que cada
// componente no repita lo mismo y todas las pantallas hablen el mismo lenguaje visual.

type Variante = 'titulo' | 'seccion' | 'cuerpo' | 'etiqueta' | 'pie'
type Tono = 'principal' | 'secundario' | 'acento' | 'sobreAcento' | 'exito' | 'precaucion' | 'bloqueo'

interface TextoProps extends TextProps {
  variante?: Variante
  tono?: Tono
  // Peso semibold para dar jerarquía sin cambiar de familia.
  fuerte?: boolean
  // Cifras tabulares: números que no bailan al cambiar de valor (kcal, macros, cargas).
  numerico?: boolean
  centrado?: boolean
}

// Texto con las escalas y pesos del tema. Dos pesos como mucho, una sola familia (la del
// sistema), según la guía de estilo.
export function Texto({
  variante = 'cuerpo',
  tono = 'principal',
  fuerte,
  numerico,
  centrado,
  style,
  ...resto
}: TextoProps) {
  const { colores, tipografia } = useTema()
  const base = tipografia[variante]
  const color =
    tono === 'principal'
      ? colores.texto
      : tono === 'secundario'
        ? colores.textoSecundario
        : tono === 'sobreAcento'
          ? colores.sobreAcento
          : colores[tono]

  const estilo: TextStyle = {
    color,
    fontSize: base.tamano,
    lineHeight: base.interlineado,
    fontWeight: fuerte ? '600' : base.peso,
  }
  if (numerico) estilo.fontVariant = ['tabular-nums']
  if (centrado) estilo.textAlign = 'center'

  return <Text {...resto} style={[estilo, style]} />
}

// Lee y escucha la preferencia del sistema de reducir movimiento. Cuando está activa, las
// animaciones se sustituyen por una aparición simple, nunca desplazamientos.
export function useMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(false)
  useEffect(() => {
    let vivo = true
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => vivo && setReducido(v))
      .catch(() => {})
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReducido(v))
    return () => {
      vivo = false
      sub.remove()
    }
  }, [])
  return reducido
}

type Impacto = 'ligero' | 'seleccion' | 'exito'

// Háptica discreta. En web y en entornos sin motor háptico no hace nada: nunca interrumpe.
export function tocar(impacto: Impacto = 'seleccion') {
  if (Platform.OS === 'web') return
  try {
    if (impacto === 'seleccion') void Haptics.selectionAsync()
    else if (impacto === 'exito') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch {
    // Sin motor háptico disponible: seguimos sin ruido.
  }
}

// Pulsación: encoge un poco al tocar y vuelve con un muelle suave. Respeta el movimiento
// reducido dejando la escala fija. Devuelve el valor animado y los manejadores.
export function usePulsacion(escalaMin = 0.97) {
  const reducido = useMovimientoReducido()
  // El valor animado se crea una sola vez y vive en estado (no en una ref), para poder leerlo
  // en el render sin saltarnos las reglas del compilador de React.
  const [escala] = useState(() => new Animated.Value(1))

  const aMin = () => {
    if (reducido) return
    Animated.timing(escala, { toValue: escalaMin, duration: 90, useNativeDriver: true }).start()
  }
  const aMax = () => {
    if (reducido) return
    Animated.spring(escala, { toValue: 1, friction: 6, tension: 160, useNativeDriver: true }).start()
  }

  return { escala, aMin, aMax }
}
