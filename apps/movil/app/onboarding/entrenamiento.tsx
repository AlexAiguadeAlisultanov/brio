import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'

import { CampoNumerico, Chip, PantallaOnboarding, TarjetaSeleccion, Texto } from '@/componentes'
import { useT } from '@/i18n'
import { useOnboarding } from '@/onboarding/estado'
import { EQUIPOS, EXPERIENCIAS } from '@/onboarding/opciones'
import { useTema } from '@/ui/proveedor'

// Paso 6: contexto de entrenamiento. Experiencia, días por semana (con el aviso de qué split
// cabe), duración de la sesión y equipo disponible. Los días y la duración llegan con un valor
// de partida razonable para no empezar en blanco.
export default function Entrenamiento() {
  const router = useRouter()
  const t = useT()
  const { estado, actualizar } = useOnboarding()
  const { espaciado } = useTema()

  useEffect(() => {
    const parcial: Partial<{ diasPorSemana: number; duracionSesionMin: number }> = {}
    if (estado.diasPorSemana == null) parcial.diasPorSemana = 3
    if (estado.duracionSesionMin == null) parcial.duracionSesionMin = 60
    if (Object.keys(parcial).length > 0) actualizar(parcial)
    // Solo al montar, para sembrar valores de partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const alternarEquipo = (valor: (typeof EQUIPOS)[number]['valor']) => {
    const actual = estado.equipo
    actualizar({ equipo: actual.includes(valor) ? actual.filter((e) => e !== valor) : [...actual, valor] })
  }

  const completo = estado.experiencia != null && estado.diasPorSemana != null && estado.duracionSesionMin != null

  return (
    <PantallaOnboarding
      titulo={t('ob.entrenamiento.titulo')}
      primario={{
        texto: t('comun.siguiente'),
        onPress: () => router.push('/onboarding/salud'),
        desactivado: !completo,
      }}>
      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.entrenamiento.experiencia')}
        </Texto>
        {EXPERIENCIAS.map((e) => (
          <TarjetaSeleccion
            key={e.valor}
            titulo={t(e.clave)}
            descripcion={t(e.desc)}
            icono={e.icono}
            seleccionado={estado.experiencia === e.valor}
            onPress={() => actualizar({ experiencia: e.valor })}
          />
        ))}
      </View>

      <View style={{ gap: espaciado.uno }}>
        <CampoNumerico
          etiqueta={t('ob.entrenamiento.dias')}
          valor={estado.diasPorSemana}
          onChange={(v) => actualizar({ diasPorSemana: v })}
          sufijo={t('comun.dias')}
          min={1}
          max={7}
        />
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.entrenamiento.avisoDias')}
        </Texto>
      </View>

      <CampoNumerico
        etiqueta={t('ob.entrenamiento.duracion')}
        valor={estado.duracionSesionMin}
        onChange={(v) => actualizar({ duracionSesionMin: v })}
        sufijo={t('comun.min')}
        min={20}
        max={120}
        paso={5}
      />

      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.entrenamiento.equipo')}
        </Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
          {EQUIPOS.map((e) => (
            <Chip
              key={e.valor}
              etiqueta={t(e.clave)}
              seleccionado={estado.equipo.includes(e.valor)}
              onPress={() => alternarEquipo(e.valor)}
            />
          ))}
        </View>
        <Texto variante="pie" tono="secundario">
          {t('ob.entrenamiento.equipoNota')}
        </Texto>
      </View>
    </PantallaOnboarding>
  )
}
