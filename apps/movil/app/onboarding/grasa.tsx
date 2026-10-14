import { useRouter } from 'expo-router'
import { View } from 'react-native'

import { CampoNumerico, PantallaOnboarding, TarjetaSeleccion, Texto } from '@/componentes'
import { useT } from '@/i18n'
import { useOnboarding } from '@/onboarding/estado'
import { useTema } from '@/ui/proveedor'

// Paso 5: porcentaje de grasa (opcional). Tres caminos claros, sin sliders ni siluetas que
// obliguen a adivinar. Solo pedimos el número si la persona dice que lo tiene medido de verdad.
export default function Grasa() {
  const router = useRouter()
  const t = useT()
  const { estado, actualizar } = useOnboarding()
  const { espaciado } = useTema()

  const modo = estado.grasaModo
  // Si dice que lo tiene medido, exigimos un valor plausible antes de seguir.
  const grasaOk = modo !== 'medido' || (estado.grasaPct != null && estado.grasaPct >= 3 && estado.grasaPct <= 70)

  const opciones: { valor: typeof modo; clave: Parameters<typeof t>[0] }[] = [
    { valor: 'medido', clave: 'ob.grasa.medido' },
    { valor: 'estimar', clave: 'ob.grasa.estimar' },
    { valor: 'saltar', clave: 'ob.grasa.saltar' },
  ]

  return (
    <PantallaOnboarding
      titulo={t('ob.grasa.titulo')}
      apoyo={t('ob.grasa.apoyo')}
      primario={{
        texto: t('comun.siguiente'),
        onPress: () => router.push('/onboarding/entrenamiento'),
        desactivado: !grasaOk,
      }}>
      <View style={{ gap: espaciado.uno }}>
        {opciones.map((o) => (
          <TarjetaSeleccion
            key={o.valor}
            titulo={t(o.clave)}
            seleccionado={modo === o.valor}
            onPress={() => actualizar({ grasaModo: o.valor, ...(o.valor !== 'medido' ? { grasaPct: undefined } : {}) })}
          />
        ))}
      </View>

      {modo === 'medido' ? (
        <CampoNumerico
          etiqueta={t('ob.grasa.campo')}
          valor={estado.grasaPct}
          onChange={(v) => actualizar({ grasaPct: v })}
          sufijo="%"
          min={3}
          max={70}
          decimales
        />
      ) : (
        <Texto variante="etiqueta" tono="secundario">
          {modo === 'estimar' ? t('ob.grasa.estimarNota') : t('ob.grasa.saltarNota')}
        </Texto>
      )}
    </PantallaOnboarding>
  )
}
