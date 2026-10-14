import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft } from 'lucide-react-native'
import * as WebBrowser from 'expo-web-browser'
import type { EjercicioPlan, Perfil, Plan } from '@brio/motor'

import {
  BotonPrimario,
  BotonTexto,
  HojaFeedbackSesion,
  HojaSustitucionEjercicio,
  SenalesDeParada,
  TarjetaEjercicio,
  Texto,
  type DatosSerie,
} from '@/componentes'
import { demoDeEjercicio, nombreEjercicio } from '@/datos/nombres'
import { useRepositorio } from '@/db/provider'
import type { Feedback } from '@/dia/logica'
import { diaSemanaLunes0, fechaISO, sesionDeHoy, siguienteObjetivo } from '@/dia/logica'
import { useLocale, useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

// Entreno de hoy: la sesión que toca, con registro serie a serie, temporizador de descanso,
// acceso a la demostración, cambio de ejercicio y feedback al acabar. El registro se guarda con
// el repositorio; el feedback alimenta la progresión del motor para la próxima sesión, que aquí
// ya se muestra como carga sugerida. La interfaz no calcula cargas: todo sale del motor.

type Sugerido = { pesoKg: number; reps: number } | null

function formatoPeso(kg: number, locale: 'es' | 'ca' | 'en'): string {
  const txt = Number.isInteger(kg) ? String(kg) : kg.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  return locale === 'en' ? txt : txt.replace('.', ',')
}

function centroRir(e: EjercicioPlan): number {
  return Math.round((e.rir.min + e.rir.max) / 2)
}

export default function Entreno() {
  const repo = useRepositorio()
  const router = useRouter()
  const { colores, espaciado } = useTema()
  const t = useT()
  const { locale } = useLocale()
  const hoy = fechaISO()

  const [cargando, setCargando] = useState(true)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [sesionPlanId, setSesionPlanId] = useState<string | null>(null)
  const [sesionId, setSesionId] = useState<number | null>(null)
  const [nombreSesion, setNombreSesion] = useState('')
  const [ejercicios, setEjercicios] = useState<EjercicioPlan[]>([])
  const [datos, setDatos] = useState<Record<string, DatosSerie[]>>({})
  const [sugeridos, setSugeridos] = useState<Record<string, Sugerido>>({})
  const [autoDescanso, setAutoDescanso] = useState<Record<string, number>>({})
  const [sustituir, setSustituir] = useState<string | null>(null)
  const [feedbackAbierto, setFeedbackAbierto] = useState(false)

  // Ids de las filas ya guardadas, en paralelo a `datos`, para poder borrar al desmarcar.
  const registroIds = useRef<Record<string, (number | undefined)[]>>({})

  useEffect(() => {
    let vivo = true
    ;(async () => {
      const [p, perf] = await Promise.all([repo.planActivo(), repo.cargarPerfil()])
      if (!vivo) return
      setPlan(p)
      setPerfil(perf)
      if (!p) {
        setCargando(false)
        return
      }
      const deHoy = sesionDeHoy(p, diaSemanaLunes0())
      if (deHoy.descanso) {
        setCargando(false)
        return
      }
      const sesion = deHoy.sesion
      setSesionPlanId(sesion.id)
      setNombreSesion(sesion.nombre)
      setEjercicios([...sesion.ejercicios])

      const existente = await repo.sesionDelDia(hoy, sesion.id)
      const id = existente?.id ?? (await repo.registrarSesion({ sesionPlanId: sesion.id, fecha: hoy }))
      if (!vivo) return
      setSesionId(id)

      const seriesHoy = await repo.seriesDeSesion(id)
      const prev = await repo.ultimaSesionCompletada(sesion.id, hoy)
      const prevSeries = prev ? await repo.seriesDeSesion(prev.id) : []
      if (!vivo) return

      const nuevosDatos: Record<string, DatosSerie[]> = {}
      const nuevosIds: Record<string, (number | undefined)[]> = {}
      const nuevosSug: Record<string, Sugerido> = {}
      for (const ej of sesion.ejercicios) {
        const propias = seriesHoy.filter((s) => s.ejercicioId === ej.ejercicioId).sort((a, b) => a.numeroSerie - b.numeroSerie)
        const filas: DatosSerie[] = []
        const ids: (number | undefined)[] = []
        for (let i = 0; i < ej.series; i++) {
          const g = propias.find((s) => s.numeroSerie === i + 1)
          filas.push(g ? { peso: g.pesoKg, reps: g.reps, completada: g.completada } : { completada: false })
          ids.push(g?.id)
        }
        nuevosDatos[ej.id] = filas
        nuevosIds[ej.id] = ids
        const res = siguienteObjetivo(ej, prevSeries.filter((s) => s.ejercicioId === ej.ejercicioId), prev?.feedback as Feedback | undefined, perf?.experiencia ?? 'principiante')
        nuevosSug[ej.id] = res ? { pesoKg: res.pesoKg, reps: res.repsObjetivo } : null
      }
      setDatos(nuevosDatos)
      registroIds.current = nuevosIds
      setSugeridos(nuevosSug)
      setCargando(false)
    })()
    return () => {
      vivo = false
    }
  }, [repo, hoy])

  const descansoSegundos = plan?.entrenamiento?.prescripcion.descansoSegundos ?? 90

  const alCambiarSerie = async (ej: EjercicioPlan, indice: number, nuevos: DatosSerie) => {
    const anterior = datos[ej.id]?.[indice]
    setDatos((d) => {
      const filas = [...(d[ej.id] ?? [])]
      filas[indice] = nuevos
      return { ...d, [ej.id]: filas }
    })

    if (!sesionId) return
    const eraCompletada = anterior?.completada ?? false
    if (nuevos.completada && !eraCompletada) {
      const id = await repo.registrarSerie({
        sesionId,
        ejercicioId: ej.ejercicioId,
        numeroSerie: indice + 1,
        ...(nuevos.peso != null ? { pesoKg: nuevos.peso } : {}),
        ...(nuevos.reps != null ? { reps: nuevos.reps } : {}),
        rir: centroRir(ej),
        completada: true,
        fecha: hoy,
      })
      const lista = [...(registroIds.current[ej.id] ?? [])]
      lista[indice] = id
      registroIds.current[ej.id] = lista
      setAutoDescanso((a) => ({ ...a, [ej.id]: Date.now() }))
    } else if (!nuevos.completada && eraCompletada) {
      const rid = registroIds.current[ej.id]?.[indice]
      if (rid != null) {
        await repo.borrarSerie(rid)
        const lista = [...(registroIds.current[ej.id] ?? [])]
        lista[indice] = undefined
        registroIds.current[ej.id] = lista
      }
    }
  }

  const aplicarSustitucion = async (ejPlanId: string, ejercicioId: string, series: number, reps: EjercicioPlan['reps'], rir: EjercicioPlan['rir']) => {
    // Borra lo registrado hoy del ejercicio que se cambia y reinicia sus filas.
    for (const rid of registroIds.current[ejPlanId] ?? []) {
      if (rid != null) await repo.borrarSerie(rid)
    }
    registroIds.current[ejPlanId] = Array.from({ length: series }, () => undefined)
    setDatos((d) => ({ ...d, [ejPlanId]: Array.from({ length: series }, () => ({ completada: false })) }))
    setEjercicios((lista) => lista.map((e) => (e.id === ejPlanId ? { ...e, ejercicioId, series, reps, rir } : e)))
    setSugeridos((s) => ({ ...s, [ejPlanId]: null }))
  }

  const terminar = (feedback: Feedback) => {
    if (sesionId) void repo.guardarFeedbackSesion(sesionId, feedback)
    router.back()
  }

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator color={colores.acento} />
      </View>
    )
  }

  const sinSesion = !plan || !sesionPlanId || ejercicios.length === 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colores.fondo }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: espaciado.tres, paddingVertical: espaciado.uno }}>
        <BotonTexto texto={t('entreno.volver')} icono={ChevronLeft} onPress={() => router.back()} />
      </View>

      {sinSesion ? (
        <View style={{ flex: 1, padding: espaciado.tres, justifyContent: 'center' }}>
          <Texto variante="titulo">{t('entreno.titulo')}</Texto>
          <View style={{ height: espaciado.dos }} />
          <Texto tono="secundario">{t('entreno.sinSesion')}</Texto>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: espaciado.tres, paddingBottom: espaciado.seis, gap: espaciado.dos }}>
          <Texto variante="titulo" style={{ fontSize: 30, lineHeight: 36 }}>
            {nombreSesion}
          </Texto>

          {plan && (plan.derivar || plan.seguridad.sinMaximas) ? <SenalesDeParada /> : null}

          {ejercicios.map((ej) => {
            const pct = ej.pct1RM
            return (
              <TarjetaEjercicio
                key={ej.id}
                nombre={nombreEjercicio(ej.ejercicioId, locale)}
                objetivoTexto={t('entreno.objetivo').replace('{series}', String(ej.series)).replace('{min}', String(ej.reps.min)).replace('{max}', String(ej.reps.max))}
                rirTexto={t('entreno.rirObjetivo').replace('{min}', String(ej.rir.min)).replace('{max}', String(ej.rir.max))}
                pct1rmTexto={pct ? t('entreno.pct1rm').replace('{min}', String(pct.min)).replace('{max}', String(pct.max)) : undefined}
                sugeridoTexto={
                  sugeridos[ej.id]
                    ? t('entreno.sugerido')
                        .replace('{peso}', formatoPeso(sugeridos[ej.id]!.pesoKg, locale))
                        .replace('{reps}', String(sugeridos[ej.id]!.reps))
                    : undefined
                }
                series={datos[ej.id] ?? []}
                pesoSugerido={sugeridos[ej.id]?.pesoKg}
                repsSugeridas={sugeridos[ej.id]?.reps}
                descansoSegundos={descansoSegundos}
                autoDescanso={autoDescanso[ej.id] ?? 0}
                onCambioSerie={(i, nuevos) => void alCambiarSerie(ej, i, nuevos)}
                onDemo={() => void WebBrowser.openBrowserAsync(demoDeEjercicio(ej.ejercicioId, locale))}
                onSustituir={() => setSustituir(ej.id)}
              />
            )
          })}

          <View style={{ height: espaciado.dos }} />
          <BotonPrimario texto={t('entreno.terminar')} onPress={() => setFeedbackAbierto(true)} />
        </ScrollView>
      )}

      {plan && perfil && sustituir ? (
        <HojaSustitucionEjercicio
          visible={sustituir != null}
          onClose={() => setSustituir(null)}
          plan={plan}
          perfil={perfil}
          ejercicioPlanId={sustituir}
          repo={repo}
          onAplicada={({ ejercicioPlanId, ejercicioId, series, reps, rir }) => void aplicarSustitucion(ejercicioPlanId, ejercicioId, series, reps, rir)}
        />
      ) : null}

      <HojaFeedbackSesion visible={feedbackAbierto} onClose={() => setFeedbackAbierto(false)} onElegir={terminar} />
    </SafeAreaView>
  )
}
