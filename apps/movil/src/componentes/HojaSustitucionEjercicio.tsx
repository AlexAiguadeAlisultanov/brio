import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { construirSobreEjercicio, type Equipo, type Perfil, type Plan, type Zona } from '@brio/motor'

import { nombreEjercicio } from '@/datos/nombres'
import type { Repositorio } from '@/db/repositorio'
import { alternativasEjercicio, type AlternativaEjercicio } from '@/dia/logica'
import { useLocale, useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar } from './base'
import { Chip } from './Chip'
import { HojaInferior } from './HojaInferior'
import { IndicadorOrigen } from './IndicadorOrigen'
import { SelectorMotivoCambio, type MotivoOpcion } from './SelectorMotivoCambio'

// Hoja de sustitución de ejercicio. Motivo: me molesta una zona (permanente, persiste lesión),
// no tengo el material (permanente, lo descuenta del equipo) o hoy no me apetece (puntual). Las
// alternativas son del mismo grupo y patrón, filtradas por equipo y lesiones, conservando series,
// reps e intensidad. Mismo manejo de conjunto vacío e indicador de origen que en las comidas.

type Paso = 'motivo' | 'zona' | 'equipo' | 'lista'

const ZONAS: Zona[] = ['rodilla', 'hombro', 'lumbar', 'codo', 'muneca', 'cadera', 'cuello', 'tobillo']

export function HojaSustitucionEjercicio({
  visible,
  onClose,
  plan,
  perfil,
  ejercicioPlanId,
  repo,
  onAplicada,
}: {
  visible: boolean
  onClose: () => void
  plan: Plan
  perfil: Perfil
  ejercicioPlanId: string
  repo: Repositorio
  onAplicada: (resultado: AlternativaEjercicio & { ejercicioPlanId: string }) => void
}) {
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  const { locale } = useLocale()
  const [paso, setPaso] = useState<Paso>('motivo')
  const [zona, setZona] = useState<Zona | null>(null)
  const [equipoFuera, setEquipoFuera] = useState<Equipo | null>(null)

  const alternativas = useMemo(() => {
    const lesiones = zona ? [...perfil.lesiones, zona] : perfil.lesiones
    const equipo = equipoFuera ? perfil.equipo.filter((e) => e !== equipoFuera) : perfil.equipo
    const sobre = construirSobreEjercicio(plan, ejercicioPlanId, { ...perfil, lesiones, equipo })
    return alternativasEjercicio(sobre)
  }, [plan, ejercicioPlanId, perfil, zona, equipoFuera])

  const reiniciar = () => {
    setPaso('motivo')
    setZona(null)
    setEquipoFuera(null)
  }
  const cerrar = () => {
    reiniciar()
    onClose()
  }

  const motivos: MotivoOpcion[] = [
    { id: 'molesta', titulo: t('motivo.molesta'), descripcion: t('motivo.molestaDesc'), permanente: true },
    { id: 'sinMaterial', titulo: t('motivo.sinMaterial'), descripcion: t('motivo.sinMaterialDesc'), permanente: true },
    { id: 'hoyNo', titulo: t('motivo.hoyNo'), descripcion: t('motivo.hoyNoDesc') },
  ]

  const elegirMotivo = (id: string) => {
    if (id === 'molesta') setPaso('zona')
    else if (id === 'sinMaterial') setPaso('equipo')
    else setPaso('lista')
  }

  const elegirZona = async (z: Zona) => {
    tocar()
    setZona(z)
    try {
      await repo.guardarRestriccion({ tipo: 'lesion', valor: z, dureza: 'dura', origen: 'usuario' })
    } catch {
      // No bloqueamos el cambio del día si falla el guardado de la restricción.
    }
    setPaso('lista')
  }

  const elegirEquipo = async (e: Equipo) => {
    tocar()
    setEquipoFuera(e)
    try {
      await repo.guardarRestriccion({ tipo: 'equipo', valor: e, dureza: 'dura', origen: 'usuario' })
    } catch {
      // Igual que arriba: el cambio de hoy sigue adelante.
    }
    setPaso('lista')
  }

  const aplicar = (op: AlternativaEjercicio) => {
    tocar('exito')
    onAplicada({ ...op, ejercicioPlanId })
    cerrar()
  }

  const conservaTexto = (op: AlternativaEjercicio): string =>
    t('sust.conserva').replace('{series}', String(op.series)).replace('{min}', String(op.reps.min)).replace('{max}', String(op.reps.max))

  const titulo = paso === 'motivo' ? t('motivo.titulo') : t('sust.ejercicioTitulo')

  return (
    <HojaInferior visible={visible} onClose={cerrar} titulo={titulo}>
      <View style={{ gap: espaciado.dos, paddingBottom: espaciado.dos }}>
        {paso === 'motivo' ? <SelectorMotivoCambio opciones={motivos} onElegir={elegirMotivo} /> : null}

        {paso === 'zona' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
            {ZONAS.map((z) => (
              <Chip key={z} etiqueta={t(`zona.${z}` as ClaveI18n)} seleccionado={zona === z} onPress={() => void elegirZona(z)} />
            ))}
          </View>
        ) : null}

        {paso === 'equipo' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
            {perfil.equipo.map((e) => (
              <Chip key={e} etiqueta={t(`equipo.${e}` as ClaveI18n)} seleccionado={equipoFuera === e} onPress={() => void elegirEquipo(e)} />
            ))}
          </View>
        ) : null}

        {paso === 'lista' ? (
          alternativas.vacio ? (
            <View style={{ gap: espaciado.uno }}>
              <Texto variante="seccion" fuerte>
                {t('sust.vacioEjercicioTitulo')}
              </Texto>
              <Texto tono="secundario">{t('sust.vacioEjercicioTexto')}</Texto>
            </View>
          ) : (
            <View style={{ gap: espaciado.uno }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Texto variante="etiqueta" tono="secundario">
                  {t('sust.elige')}
                </Texto>
                <IndicadorOrigen origen="motor" />
              </View>
              {zona ? (
                <Texto variante="etiqueta" tono="secundario">
                  {t('sust.lesionGuardada')}
                </Texto>
              ) : null}
              {alternativas.opciones.map((op) => (
                <Pressable
                  key={op.ejercicioId}
                  accessibilityRole="button"
                  onPress={() => aplicar(op)}
                  style={{
                    gap: espaciado.media,
                    padding: espaciado.dos,
                    borderRadius: radios.m,
                    borderWidth: 1,
                    borderColor: colores.borde,
                    backgroundColor: colores.tarjeta,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.uno }}>
                    <Texto fuerte style={{ flex: 1 }}>
                      {nombreEjercicio(op.ejercicioId, locale)}
                    </Texto>
                    {op.aproximado ? (
                      <View style={{ paddingVertical: 2, paddingHorizontal: espaciado.uno, borderRadius: radios.s, backgroundColor: colores.precaucion + '1F' }}>
                        <Texto variante="pie" fuerte style={{ color: colores.precaucion }}>
                          {t('sust.mismoGrupo')}
                        </Texto>
                      </View>
                    ) : (
                      <View style={{ paddingVertical: 2, paddingHorizontal: espaciado.uno, borderRadius: radios.s, backgroundColor: colores.exito + '1F' }}>
                        <Texto variante="pie" fuerte style={{ color: colores.exito }}>
                          {t('sust.mismoPatron')}
                        </Texto>
                      </View>
                    )}
                  </View>
                  <Texto variante="etiqueta" tono="secundario" numerico>
                    {conservaTexto(op)}
                  </Texto>
                </Pressable>
              ))}
            </View>
          )
        ) : null}
      </View>
    </HojaInferior>
  )
}
