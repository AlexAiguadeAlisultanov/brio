import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { construirSobreEjercicio, type Equipo, type Perfil, type Plan, type Zona } from '@brio/motor'

import { useAuth } from '@/auth/contexto'
import { nombreEjercicio } from '@/datos/nombres'
import type { Repositorio } from '@/db/repositorio'
import { alternativasEjercicio, type AlternativaEjercicio } from '@/dia/logica'
import { adaptarEjercicio } from '@/llm/adaptar'
import { useLocale, useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar } from './base'
import { Chip } from './Chip'
import { HojaInferior } from './HojaInferior'
import { IndicadorOrigen, type Origen } from './IndicadorOrigen'
import { SelectorMotivoCambio, type MotivoOpcion } from './SelectorMotivoCambio'

// Hoja de sustitución de ejercicio. Motivo: me molesta una zona (permanente, persiste lesión),
// no tengo el material (permanente, lo descuenta del equipo) o hoy no me apetece (puntual). Las
// alternativas del motor son del mismo grupo y patrón, filtradas por equipo y lesiones,
// conservando series, reps e intensidad; salen al instante y son la red de seguridad. Con
// consentimiento de IA se intenta además una propuesta adaptada que el motor revalida. El
// indicador dice de dónde viene lo que se muestra. Mismo manejo de conjunto vacío que en comidas.

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
  const { esPremium } = useAuth()
  const [paso, setPaso] = useState<Paso>('motivo')
  const [zona, setZona] = useState<Zona | null>(null)
  const [equipoFuera, setEquipoFuera] = useState<Equipo | null>(null)
  const [origen, setOrigen] = useState<Origen>('motor')
  const [adaptada, setAdaptada] = useState<AlternativaEjercicio | null>(null)

  // Id del catálogo del ejercicio que se cambia: es lo que se descarta al pedir la adaptación.
  const idRechazado = useMemo(() => {
    const todos = plan.entrenamiento?.sesiones.flatMap((s) => s.ejercicios) ?? []
    return todos.find((e) => e.id === ejercicioPlanId)?.ejercicioId ?? ''
  }, [plan, ejercicioPlanId])

  const sobre = useMemo(() => {
    const lesiones = zona ? [...perfil.lesiones, zona] : perfil.lesiones
    const equipo = equipoFuera ? perfil.equipo.filter((e) => e !== equipoFuera) : perfil.equipo
    return construirSobreEjercicio(plan, ejercicioPlanId, { ...perfil, lesiones, equipo })
  }, [plan, ejercicioPlanId, perfil, zona, equipoFuera])

  const alternativas = useMemo(() => alternativasEjercicio(sobre), [sobre])

  useEffect(() => {
    if (!visible || paso !== 'lista' || alternativas.vacio) return
    let vivo = true
    void (async () => {
      setAdaptada(null)
      setOrigen('motor')
      // La vía IA es premium; los gratis usan el motor local, que filtra igual lesiones y equipo.
      if (!esPremium) return
      let consentimientoLlm = false
      try {
        consentimientoLlm = (await repo.ajustesApp()).consentimientoLlm
      } catch {
        consentimientoLlm = false
      }
      if (!vivo || !consentimientoLlm) return
      const res = await adaptarEjercicio(sobre, { consentimientoLlm: true, idRechazado })
      if (!vivo) return
      const s = res.sustitucion
      if (res.origen === 'llm' && !s.vacio && s.ejercicioId) {
        setOrigen('ia')
        setAdaptada({
          ejercicioId: s.ejercicioId,
          series: s.series ?? sobre.series.min,
          reps: s.reps ?? sobre.reps,
          rir: s.rir ?? sobre.rir,
          aproximado: s.aproximado,
        })
      } else if (res.origen === 'offline') {
        setOrigen('local')
      }
    })()
    return () => {
      vivo = false
    }
  }, [visible, paso, alternativas.vacio, sobre, idRechazado, repo, esPremium])

  const reiniciar = () => {
    setPaso('motivo')
    setZona(null)
    setEquipoFuera(null)
    setOrigen('motor')
    setAdaptada(null)
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

  // La propuesta de la IA va primero; detrás, las del motor (sin repetir el mismo ejercicio).
  const opciones = adaptada ? [adaptada, ...alternativas.opciones.filter((o) => o.ejercicioId !== adaptada.ejercicioId)] : alternativas.opciones

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
                <IndicadorOrigen origen={origen} />
              </View>
              {origen === 'local' ? (
                <Texto variante="etiqueta" tono="secundario">
                  {t('origen.localNota')}
                </Texto>
              ) : null}
              {zona ? (
                <Texto variante="etiqueta" tono="secundario">
                  {t('sust.lesionGuardada')}
                </Texto>
              ) : null}
              {opciones.map((op) => {
                const esIa = adaptada != null && op === adaptada
                return (
                  <Pressable
                    key={op.ejercicioId}
                    accessibilityRole="button"
                    onPress={() => aplicar(op)}
                    style={{
                      gap: espaciado.media,
                      padding: espaciado.dos,
                      borderRadius: radios.m,
                      borderWidth: 1,
                      borderColor: esIa ? colores.acento : colores.borde,
                      backgroundColor: colores.tarjeta,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.uno }}>
                      {esIa ? <Sparkles size={15} color={colores.acentoContraste} strokeWidth={2} /> : null}
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
                )
              })}
            </View>
          )
        ) : null}
      </View>
    </HojaInferior>
  )
}
