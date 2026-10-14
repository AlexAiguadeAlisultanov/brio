import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Pressable, RefreshControl, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronRight, Droplet, Dumbbell, LineChart, Minus, Plus } from 'lucide-react-native'
import type { ItemComida, Macros, Perfil, Plan } from '@brio/motor'

import {
  Anillos,
  AvisoMedico,
  BotonPrimario,
  HojaCheckin,
  HojaSustitucionComida,
  SenalesDeParada,
  TarjetaComida,
  Texto,
  numero,
  tocar,
} from '@/componentes'
import { nombreAlimento } from '@/datos/nombres'
import type { ComidaGuardada, SerieGuardada } from '@/db/repositorio'
import { useRepositorio } from '@/db/provider'
import { avanceSesion, diaSemanaLunes0, fechaISO, objetivoDelDia, sesionDeHoy, sumarConsumo } from '@/dia/logica'
import { useLocale, useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

const VASO_ML = 250

type Override = Record<string, { items: ItemComida[]; macros: Macros }>

export default function Hoy() {
  const repo = useRepositorio()
  const router = useRouter()
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  const { locale } = useLocale()
  const insets = useSafeAreaInsets()
  const hoy = fechaISO()

  const [cargando, setCargando] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [comidasHoy, setComidasHoy] = useState<ComidaGuardada[]>([])
  const [seriesHoy, setSeriesHoy] = useState<SerieGuardada[]>([])
  const [agua, setAgua] = useState(0)
  const [historico, setHistorico] = useState<Awaited<ReturnType<typeof repo.progresoEntre>>>([])
  const [overrides, setOverrides] = useState<Override>({})
  const [comidaSust, setComidaSust] = useState<string | null>(null)
  const [checkinAbierto, setCheckinAbierto] = useState(false)

  const scrollY = useRef(new Animated.Value(0)).current

  const cargar = useCallback(async () => {
    const [p, perf, com, ser, ag] = await Promise.all([
      repo.planActivo(),
      repo.cargarPerfil(),
      repo.comidasDeFecha(hoy),
      repo.seriesDeFecha(hoy),
      repo.aguaDeFecha(hoy),
    ])
    setPlan(p)
    setPerfil(perf)
    setComidasHoy(com)
    setSeriesHoy(ser)
    setAgua(ag)
    const desde = fechaISO(new Date(Date.now() - 42 * 86_400_000))
    setHistorico(await repo.progresoEntre(desde, hoy))
    setCargando(false)
  }, [repo, hoy])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar]),
  )

  const refrescar = async () => {
    setRefrescando(true)
    await cargar()
    setRefrescando(false)
  }

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator color={colores.acento} />
      </View>
    )
  }

  // Sin plan todavía: estado vacío con una sola acción para montarlo.
  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colores.fondo }}>
        <View style={{ flex: 1, padding: espaciado.tres, justifyContent: 'center', gap: espaciado.dos }}>
          <Texto variante="titulo">{t('hoy.sinPlanTitulo')}</Texto>
          <Texto tono="secundario">{t('hoy.sinPlanTexto')}</Texto>
          <View style={{ height: espaciado.dos }} />
          <BotonPrimario texto={t('hoy.sinPlanBoton')} onPress={() => router.replace('/onboarding/bienvenida')} />
        </View>
      </SafeAreaView>
    )
  }

  const objetivo = objetivoDelDia(plan)
  const consumo = sumarConsumo(comidasHoy)
  const sesion = sesionDeHoy(plan, diaSemanaLunes0())
  const aguaObjetivo = plan.hidratacionMl ?? 2000
  const derivarSenales = plan.derivar || plan.seguridad.sinMaximas

  const alturaBarra = insets.top + 48
  const opacidadBarra = scrollY.interpolate({ inputRange: [24, 72], outputRange: [0, 1], extrapolate: 'clamp' })
  const opacidadTitulo = scrollY.interpolate({ inputRange: [0, 64], outputRange: [1, 0], extrapolate: 'clamp' })

  const macrosDeHueco = (comidaId: string, porDefecto: Macros): Macros => overrides[comidaId]?.macros ?? porDefecto
  const tituloDeHueco = (comidaId: string, alimentos: { id: string; macros: Macros }[]): string => {
    const items = overrides[comidaId]?.items ?? alimentos
    const principal = items.reduce<{ id: string; macros: Macros } | null>(
      (mejor, a) => (!mejor || a.macros.proteinaG > mejor.macros.proteinaG ? a : mejor),
      null,
    )
    return principal ? nombreAlimento(principal.id, locale) : ''
  }

  const alternarRegistro = async (comidaId: string, alimentos: { id: string; gramos: number; macros: Macros }[]) => {
    const registrada = comidasHoy.some((c) => c.comidaPlanId === comidaId)
    if (registrada) {
      await repo.borrarComidasDeHueco(hoy, comidaId)
    } else {
      const items = overrides[comidaId]?.items ?? alimentos
      for (const it of items) {
        await repo.registrarComida({ comidaPlanId: comidaId, alimentoId: it.id, gramos: it.gramos, macros: it.macros, fecha: hoy })
      }
    }
    setComidasHoy(await repo.comidasDeFecha(hoy))
  }

  const cambiarAgua = async (delta: number) => {
    tocar(delta > 0 ? 'seleccion' : 'ligero')
    setAgua(await repo.registrarAgua(hoy, delta))
  }

  const comidaSeleccionada = comidaSust

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      {/* Barra fina que aparece al desplazar: el título grande se colapsa aquí. */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: alturaBarra,
          paddingTop: insets.top,
          zIndex: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colores.fondo,
          borderBottomWidth: 1,
          borderBottomColor: colores.borde,
          opacity: opacidadBarra,
        }}>
        <Texto variante="seccion" fuerte>
          {t('hoy.titulo')}
        </Texto>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.acento} />}
        contentContainerStyle={{ paddingTop: insets.top + espaciado.uno, paddingBottom: insets.bottom + espaciado.seis, paddingHorizontal: espaciado.tres, gap: espaciado.tres }}>
        <Animated.View style={{ opacity: opacidadTitulo }}>
          <Texto variante="titulo" style={{ fontSize: 34, lineHeight: 40 }}>
            {t('hoy.titulo')}
          </Texto>
        </Animated.View>

        {/* Anillos del día, o mensaje si el plan esconde las cifras. */}
        {objetivo ? (
          <Anillos objetivo={objetivo} consumo={consumo} />
        ) : (
          <View style={{ padding: espaciado.tres, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.uno }}>
            <Texto variante="seccion" fuerte>
              {t('hoy.sinCifrasTitulo')}
            </Texto>
            <Texto tono="secundario">{t('hoy.sinCifrasTexto')}</Texto>
          </View>
        )}

        {derivarSenales ? <SenalesDeParada /> : null}

        {/* Entreno de hoy. */}
        {sesion.descanso ? (
          <View style={{ padding: espaciado.tres, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.media }}>
            <Texto variante="etiqueta" tono="secundario">
              {t('hoy.entrenoHoy')}
            </Texto>
            <Texto variante="seccion" fuerte>
              {t('hoy.descansoTitulo')}
            </Texto>
            <Texto tono="secundario">{t('hoy.descansoApoyo')}</Texto>
          </View>
        ) : (
          <TarjetaEntreno
            nombre={sesion.sesion.nombre}
            avance={avanceSesion(
              sesion.sesion.ejercicios,
              seriesHoy.filter((s) => sesion.sesion.ejercicios.some((e) => e.ejercicioId === s.ejercicioId)),
            )}
            onAbrir={() => {
              tocar()
              router.push('/entreno')
            }}
          />
        )}

        {/* Comidas del día. */}
        {objetivo && plan.comidas && plan.comidas.length > 0 ? (
          <View style={{ gap: espaciado.dos }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Texto variante="seccion" fuerte>
                {t('hoy.comidas')}
              </Texto>
              <Texto variante="etiqueta" tono="secundario" numerico>
                {t('hoy.totalDia').replace('{n}', numero(consumo.kcal, locale))}
              </Texto>
            </View>
            {plan.comidas.map((c) => {
              const m = macrosDeHueco(c.id, c.objetivo)
              return (
                <TarjetaComidaWrap
                  key={c.id}
                  momento={c.momento}
                  titulo={tituloDeHueco(c.id, c.alimentos)}
                  macros={m}
                  registrada={comidasHoy.some((r) => r.comidaPlanId === c.id)}
                  onRegistrar={() =>
                    void alternarRegistro(
                      c.id,
                      (overrides[c.id]?.items ?? c.alimentos).map((a) => ({ id: a.id, gramos: a.gramos, macros: a.macros })),
                    )
                  }
                  onSustituir={() => setComidaSust(c.id)}
                />
              )
            })}
          </View>
        ) : null}

        {/* Agua. */}
        <View style={{ padding: espaciado.dos, borderRadius: radios.l, backgroundColor: colores.tarjeta, flexDirection: 'row', alignItems: 'center', gap: espaciado.dos }}>
          <View style={{ width: 44, height: 44, borderRadius: radios.m, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.hoja }}>
            <Droplet size={22} color={colores.acentoContraste} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto variante="etiqueta" tono="secundario">
              {t('hoy.agua')}
            </Texto>
            <Texto fuerte numerico>
              {t('hoy.aguaResumen').replace('{n}', numero(agua, locale)).replace('{m}', numero(aguaObjetivo, locale))}
            </Texto>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('hoy.aguaQuitar')} onPress={() => void cambiarAgua(-VASO_ML)} style={botonRedondo(colores.hoja, colores.borde, radios.s)}>
            <Minus size={20} color={colores.texto} strokeWidth={2} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('hoy.aguaVaso')} onPress={() => void cambiarAgua(VASO_ML)} style={botonRedondo(colores.acento, colores.acento, radios.s)}>
            <Plus size={20} color={colores.sobreAcento} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Revisión semanal (hoja reutilizable; la pestaña Progreso completa llega en 2B). */}
        {objetivo ? (
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
        ) : null}

        {plan.derivar ? <AvisoMedico rotulo={t('seg.derivar.rotulo')} texto={t('seg.derivar.texto')} reforzado /> : null}
      </Animated.ScrollView>

      {/* Hojas inferiores. */}
      {perfil && comidaSeleccionada ? (
        <HojaSustitucionComida
          visible={comidaSust != null}
          onClose={() => setComidaSust(null)}
          plan={plan}
          perfil={perfil}
          comidaId={comidaSeleccionada}
          repo={repo}
          onAplicada={({ comidaId, items, macros }) => setOverrides((o) => ({ ...o, [comidaId]: { items, macros } }))}
        />
      ) : null}

      <HojaCheckin
        visible={checkinAbierto}
        onClose={() => setCheckinAbierto(false)}
        plan={plan}
        historico={historico}
        onAplicar={(ajuste) => void repo.guardarAjuste(ajuste)}
      />
    </View>
  )
}

function botonRedondo(fondo: string, borde: string, radio: number) {
  return {
    width: 44,
    height: 44,
    borderRadius: radio,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: fondo,
    borderWidth: 1,
    borderColor: borde,
  }
}

function TarjetaEntreno({
  nombre,
  avance,
  onAbrir,
}: {
  nombre: string
  avance: { hechas: number; total: number }
  onAbrir: () => void
}) {
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  const completo = avance.total > 0 && avance.hechas >= avance.total
  const empezado = avance.hechas > 0

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onAbrir}
      style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.dos, padding: espaciado.tres, borderRadius: radios.l, backgroundColor: colores.tarjeta }}>
      <View style={{ width: 48, height: 48, borderRadius: radios.m, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.hoja }}>
        <Dumbbell size={24} color={colores.texto} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: espaciado.media }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('hoy.entrenoHoy')}
        </Texto>
        <Texto variante="seccion" fuerte>
          {nombre}
        </Texto>
        <Texto variante="etiqueta" tono={completo ? 'exito' : 'secundario'} numerico>
          {completo ? t('hoy.entrenoHecho') : t('hoy.entrenoAvance').replace('{hechas}', String(avance.hechas)).replace('{total}', String(avance.total))}
        </Texto>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.media }}>
        <Texto fuerte style={{ color: colores.acentoContraste }}>
          {empezado && !completo ? t('hoy.entrenoSeguir') : t('hoy.entrenoEmpezar')}
        </Texto>
        <ChevronRight size={20} color={colores.acentoContraste} strokeWidth={2} />
      </View>
    </Pressable>
  )
}

// Envoltorio para no recalcular el formato de macros en cada tarjeta: solo pasa lo que pinta.
function TarjetaComidaWrap({
  momento,
  titulo,
  macros,
  registrada,
  onRegistrar,
  onSustituir,
}: {
  momento: string
  titulo: string
  macros: Macros
  registrada: boolean
  onRegistrar: () => void
  onSustituir: () => void
}) {
  return (
    <TarjetaComida
      momento={momento}
      titulo={titulo}
      kcal={macros.kcal}
      proteinaG={macros.proteinaG}
      carbosG={macros.carbosG}
      grasaG={macros.grasaG}
      registrada={registrada}
      onRegistrar={onRegistrar}
      onSustituir={onSustituir}
    />
  )
}
