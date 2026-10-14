import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Dimensions, Pressable, View } from 'react-native'
import { CalendarCheck, ChevronRight, LineChart } from 'lucide-react-native'
import { tendenciaPeso, type Plan, type RegistroProgreso } from '@brio/motor'

import {
  BotonPrimario,
  CampoNumerico,
  GraficoTendencia,
  HojaCheckin,
  HojaInferior,
  PantallaScroll,
  Texto,
  numero,
  tocar,
} from '@/componentes'
import { nombreEjercicio } from '@/datos/nombres'
import type { MarcaPersonal } from '@/db/repositorio'
import { useRepositorio } from '@/db/provider'
import { fechaISO } from '@/dia/logica'
import { calcularAdherencia, type DiaAdherencia } from '@/progreso/adherencia'
import { PESO_MAX_KG, PESO_MIN_KG, pesoPlausible, serieTendencia } from '@/progreso/peso'
import { useLocale, useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

// Progreso: tendencia de peso suavizada (no pesos sueltos), registro de peso con validación,
// calendario de adherencia con racha indulgente y las mejores marcas. El check-in semanal
// reutiliza la hoja de la Fase 2A. Los números (tendencia, ajuste, marcas) salen del motor o del
// historial; aquí solo se ordenan y se visten.

const VENTANA_DIAS = 35

function decimal(valor: number, locale: 'es' | 'ca' | 'en'): string {
  const abs = Math.abs(valor).toFixed(1)
  return locale === 'en' ? abs : abs.replace('.', ',')
}

export default function Progreso() {
  const repo = useRepositorio()
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  const { locale } = useLocale()
  const hoy = fechaISO()

  const [cargando, setCargando] = useState(true)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [historico, setHistorico] = useState<RegistroProgreso[]>([])
  const [diasActivos, setDiasActivos] = useState<string[]>([])
  const [congelados, setCongelados] = useState<string[]>([])
  const [marcas, setMarcas] = useState<MarcaPersonal[]>([])
  const [pesoBorrador, setPesoBorrador] = useState<number | undefined>(undefined)
  const [errorPeso, setErrorPeso] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [checkinAbierto, setCheckinAbierto] = useState(false)
  const [diaCongelar, setDiaCongelar] = useState<DiaAdherencia | null>(null)

  const cargar = useCallback(async () => {
    const desdeTend = fechaISO(new Date(Date.now() - 180 * 86_400_000))
    const desdeVentana = fechaISO(new Date(Date.now() - (VENTANA_DIAS - 1) * 86_400_000))
    const [p, hist, activos, cong, pr] = await Promise.all([
      repo.planActivo(),
      repo.progresoEntre(desdeTend, hoy),
      repo.diasConActividad(desdeVentana, hoy),
      repo.diasCongelados(desdeVentana, hoy),
      repo.mejoresMarcas(),
    ])
    setPlan(p)
    setHistorico(hist)
    setDiasActivos(activos)
    setCongelados(cong)
    setMarcas(pr)
    setPesoBorrador((prev) => prev ?? hist[hist.length - 1]?.pesoKg)
    setCargando(false)
  }, [repo, hoy])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar]),
  )

  const serie = useMemo(() => serieTendencia(historico), [historico])
  const tend = useMemo(() => tendenciaPeso(historico), [historico])
  const adher = useMemo(() => calcularAdherencia(diasActivos, congelados, hoy, VENTANA_DIAS), [diasActivos, congelados, hoy])
  const anchoGrafico = Math.min(Dimensions.get('window').width, 520) - espaciado.tres * 2 - espaciado.dos * 2

  const guardarPeso = async () => {
    if (pesoBorrador == null || !pesoPlausible(pesoBorrador)) {
      setErrorPeso(true)
      setMensaje('')
      return
    }
    setErrorPeso(false)
    tocar('exito')
    await repo.registrarProgreso({ fechaISO: hoy, pesoKg: pesoBorrador })
    setMensaje(t('progreso.peso.guardado'))
    await cargar()
  }

  const alternarCongelado = async () => {
    if (!diaCongelar) return
    const estaCongelado = diaCongelar.estado === 'congelado'
    tocar()
    if (estaCongelado) await repo.descongelarDia(diaCongelar.fechaISO)
    else await repo.congelarDia(diaCongelar.fechaISO)
    setDiaCongelar(null)
    await cargar()
  }

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator color={colores.acento} />
      </View>
    )
  }

  const ritmoFrase = (): string => {
    if (!tend.valido || tend.puntos < 2) return t('checkin.sinDatos')
    const r = tend.ritmoKgSemana
    if (Math.abs(r) < 0.05) return t('checkin.ritmoEstable')
    return t(r < 0 ? 'checkin.ritmoBajando' : 'checkin.ritmoSubiendo').replace('{n}', decimal(r, locale))
  }

  const rachaFrase = (): string => {
    if (adher.rachaActual <= 0) return t('progreso.racha.cero')
    if (adher.rachaActual === 1) return t('progreso.racha.unDia')
    return t('progreso.racha.dias').replace('{n}', String(adher.rachaActual))
  }

  const semanas: DiaAdherencia[][] = []
  for (let i = 0; i < adher.dias.length; i += 7) semanas.push(adher.dias.slice(i, i + 7))

  return (
    <PantallaScroll titulo={t('progreso.titulo')} onRefresh={cargar}>
      {/* Peso: tendencia + registro. */}
      <View style={{ gap: espaciado.dos }}>
        <Texto variante="seccion" fuerte>
          {t('progreso.peso.titulo')}
        </Texto>

        {serie.length >= 2 ? (
          <>
            <GraficoTendencia serie={serie} ancho={anchoGrafico} />
            <Texto fuerte>{ritmoFrase()}</Texto>
          </>
        ) : (
          <View style={{ padding: espaciado.tres, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.uno }}>
            <Texto variante="seccion" fuerte>
              {t('progreso.peso.vacioTitulo')}
            </Texto>
            <Texto tono="secundario">{t('progreso.peso.vacioTexto')}</Texto>
          </View>
        )}

        <View style={{ padding: espaciado.dos, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.dos }}>
          <CampoNumerico
            etiqueta={t('progreso.peso.registrar')}
            valor={pesoBorrador}
            onChange={(v) => {
              setPesoBorrador(v)
              setErrorPeso(false)
              setMensaje('')
            }}
            sufijo={t('comun.kg')}
            min={PESO_MIN_KG}
            max={PESO_MAX_KG}
            paso={0.1}
            decimales
            placeholder="—"
          />
          {errorPeso ? (
            <Texto variante="etiqueta" tono="bloqueo">
              {t('progreso.peso.invalido')}
            </Texto>
          ) : mensaje ? (
            <Texto variante="etiqueta" tono="exito">
              {mensaje}
            </Texto>
          ) : null}
          <BotonPrimario texto={t('progreso.peso.guardar')} onPress={() => void guardarPeso()} />
        </View>
      </View>

      {/* Racha + check-in. */}
      <View style={{ gap: espaciado.dos }}>
        <View style={{ padding: espaciado.tres, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.uno }}>
          <Texto variante="etiqueta" tono="secundario">
            {t('progreso.racha.titulo')}
          </Texto>
          <Texto variante="titulo" numerico>
            {rachaFrase()}
          </Texto>
          {adher.rachaActual > 0 && !adher.hoyActivo ? (
            <Texto tono="secundario">{t('progreso.racha.hoyNoCuenta')}</Texto>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            tocar()
            setCheckinAbierto(true)
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.dos, padding: espaciado.dos, borderRadius: radios.m, borderWidth: 1, borderColor: colores.borde }}>
          <LineChart size={20} color={colores.textoSecundario} strokeWidth={2} />
          <Texto fuerte style={{ flex: 1 }}>
            {t('checkin.titulo')}
          </Texto>
          <ChevronRight size={20} color={colores.textoSecundario} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Calendario de adherencia. */}
      <View style={{ gap: espaciado.dos }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.uno }}>
          <CalendarCheck size={20} color={colores.textoSecundario} strokeWidth={2} />
          <Texto variante="seccion" fuerte>
            {t('progreso.adherencia.titulo')}
          </Texto>
        </View>
        <View style={{ gap: espaciado.media }}>
          {semanas.map((semana, fila) => (
            <View key={fila} style={{ flexDirection: 'row', gap: espaciado.media }}>
              {semana.map((dia) => (
                <CeldaDia key={dia.fechaISO} dia={dia} hoy={hoy} onPress={() => setDiaCongelar(dia)} />
              ))}
            </View>
          ))}
        </View>
        <Texto variante="etiqueta" tono="secundario">
          {t('progreso.adherencia.tocaDia')}
        </Texto>
      </View>

      {/* Mejores marcas. */}
      <View style={{ gap: espaciado.dos }}>
        <Texto variante="seccion" fuerte>
          {t('progreso.prs.titulo')}
        </Texto>
        {marcas.length === 0 ? (
          <Texto tono="secundario">{t('progreso.prs.vacio')}</Texto>
        ) : (
          <View style={{ borderRadius: radios.l, backgroundColor: colores.tarjeta, overflow: 'hidden' }}>
            {marcas.map((m, i) => (
              <View
                key={m.ejercicioId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: espaciado.dos,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colores.borde,
                }}>
                <Texto style={{ flex: 1 }}>{nombreEjercicio(m.ejercicioId, locale)}</Texto>
                <Texto fuerte numerico>
                  {m.reps != null
                    ? t('progreso.prs.marca').replace('{peso}', decimal(m.pesoKg, locale)).replace('{reps}', String(m.reps))
                    : t('progreso.prs.marcaSinReps').replace('{peso}', decimal(m.pesoKg, locale))}
                </Texto>
              </View>
            ))}
          </View>
        )}
      </View>

      {plan ? (
        <HojaCheckin
          visible={checkinAbierto}
          onClose={() => setCheckinAbierto(false)}
          plan={plan}
          historico={historico}
          onAplicar={(ajuste) => void repo.guardarAjuste(ajuste)}
        />
      ) : null}

      <HojaInferior visible={diaCongelar != null} onClose={() => setDiaCongelar(null)} titulo={t('progreso.congelar.titulo')}>
        <View style={{ gap: espaciado.dos, paddingBottom: espaciado.dos }}>
          <Texto fuerte numerico>
            {diaCongelar?.fechaISO}
          </Texto>
          <Texto tono="secundario">{t('progreso.congelar.texto')}</Texto>
          <BotonPrimario
            texto={diaCongelar?.estado === 'congelado' ? t('progreso.congelar.quitar') : t('progreso.congelar.confirmar')}
            onPress={() => void alternarCongelado()}
          />
        </View>
      </HojaInferior>
    </PantallaScroll>
  )
}

// Celda del calendario: un cuadrado por día, teñido según el estado. Los días activos no se
// tocan; los que están en blanco o congelados se pueden tocar para congelar o descongelar.
function CeldaDia({ dia, hoy, onPress }: { dia: DiaAdherencia; hoy: string; onPress: () => void }) {
  const { colores, radios } = useTema()
  const esHoy = dia.fechaISO === hoy
  const fondo =
    dia.estado === 'activo'
      ? colores.acento
      : dia.estado === 'congelado'
        ? colores.precaucion + '33'
        : colores.hoja
  const borde = esHoy ? colores.acento : dia.estado === 'congelado' ? colores.precaucion : colores.borde

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dia.fechaISO}
      disabled={dia.estado === 'activo'}
      onPress={onPress}
      style={{
        flex: 1,
        aspectRatio: 1,
        borderRadius: radios.s,
        backgroundColor: fondo,
        borderWidth: 1,
        borderColor: borde,
      }}
    />
  )
}
