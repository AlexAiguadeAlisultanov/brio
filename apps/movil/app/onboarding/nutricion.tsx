import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'
import type { Alergeno } from '@brio/motor'

import { CampoNumerico, Chip, PantallaOnboarding, Texto } from '@/componentes'
import { useT } from '@/i18n'
import { useOnboarding } from '@/onboarding/estado'
import { ALERGENOS, DIETAS, NO_GUSTA } from '@/onboarding/opciones'
import { useTema } from '@/ui/proveedor'

// Paso 8: restricciones de nutrición. El patrón dietético, las alergias e intolerancias (que
// el motor trata como exclusiones duras e innegociables) y lo que no gusta (exclusión blanda,
// por ids reales del catálogo, nunca texto libre). Además, cuántas comidas al día.
export default function Nutricion() {
  const router = useRouter()
  const t = useT()
  const { estado, actualizar } = useOnboarding()
  const { espaciado } = useTema()

  useEffect(() => {
    if (estado.comidasPorDia == null) actualizar({ comidasPorDia: 4 })
    // Solo al montar, para sembrar un valor de partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const alternar = <T,>(lista: T[], valor: T): T[] =>
    lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]

  return (
    <PantallaOnboarding
      titulo={t('ob.nutricion.titulo')}
      apoyo={t('ob.nutricion.apoyo')}
      primario={{ texto: t('comun.siguiente'), onPress: () => router.push('/onboarding/resumen') }}>
      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.nutricion.patron')}
        </Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
          {DIETAS.map((d) => (
            <Chip
              key={d.valor}
              etiqueta={t(d.clave)}
              seleccionado={estado.patronDietetico.includes(d.valor)}
              onPress={() => actualizar({ patronDietetico: alternar(estado.patronDietetico, d.valor) })}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.nutricion.alergias')}
        </Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
          {ALERGENOS.map((a) => (
            <Chip
              key={`al-${a.valor}`}
              etiqueta={t(a.clave)}
              seleccionado={estado.alergias.includes(a.valor)}
              onPress={() => actualizar({ alergias: alternar<Alergeno>(estado.alergias, a.valor) })}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.nutricion.intolerancias')}
        </Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
          {ALERGENOS.map((a) => (
            <Chip
              key={`in-${a.valor}`}
              etiqueta={t(a.clave)}
              seleccionado={estado.intolerancias.includes(a.valor)}
              onPress={() => actualizar({ intolerancias: alternar<Alergeno>(estado.intolerancias, a.valor) })}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.nutricion.noGusta')}
        </Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
          {NO_GUSTA.map((n) => (
            <Chip
              key={n.id}
              etiqueta={t(n.clave)}
              seleccionado={estado.noGustaIds.includes(n.id)}
              onPress={() => actualizar({ noGustaIds: alternar(estado.noGustaIds, n.id) })}
            />
          ))}
        </View>
        <Texto variante="pie" tono="secundario">
          {t('ob.nutricion.noGustaNota')}
        </Texto>
      </View>

      <CampoNumerico
        etiqueta={t('ob.nutricion.comidas')}
        valor={estado.comidasPorDia}
        onChange={(v) => actualizar({ comidasPorDia: v })}
        min={3}
        max={6}
      />
    </PantallaOnboarding>
  )
}
