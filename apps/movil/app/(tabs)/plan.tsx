import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { ChevronRight, Dumbbell, ShoppingBasket } from 'lucide-react-native'
import type { Perfil, Plan, SesionPlan } from '@brio/motor'

import {
  ControlSegmentado,
  EstadoVacio,
  HojaInferior,
  PantallaScroll,
  Texto,
  numero,
  tocar,
  type OpcionSegmento,
} from '@/componentes'
import { nombreAlimento, nombreEjercicio } from '@/datos/nombres'
import { useRepositorio } from '@/db/provider'
import { sesionDeHoy } from '@/dia/logica'
import { listaDeLaCompra } from '@/plan/compra'
import { useLocale, useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import { useTema } from '@/ui/proveedor'

// Plan de la semana: conmutador entre el entreno por días y las comidas, más la lista de la
// compra de toda la semana. El detalle de cada día o cada comida se abre en una hoja inferior,
// sin salir de la pestaña. Todo sale del plan activo del motor; aquí solo se ordena y se enseña.

type Vista = 'entreno' | 'comidas'

const DIAS: ClaveI18n[] = ['dia.lunes', 'dia.martes', 'dia.miercoles', 'dia.jueves', 'dia.viernes', 'dia.sabado', 'dia.domingo']

export default function PlanTab() {
  const repo = useRepositorio()
  const router = useRouter()
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  const { locale } = useLocale()

  const [cargando, setCargando] = useState(true)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [, setPerfil] = useState<Perfil | null>(null)
  const [vista, setVista] = useState<Vista>('entreno')
  const [sesionDetalle, setSesionDetalle] = useState<SesionPlan | null>(null)
  const [comidaDetalle, setComidaDetalle] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const [p, perf] = await Promise.all([repo.planActivo(), repo.cargarPerfil()])
    setPlan(p)
    setPerfil(perf)
    setCargando(false)
  }, [repo])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar]),
  )

  const compra = useMemo(() => (plan ? listaDeLaCompra(plan, 7) : []), [plan])

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator color={colores.acento} />
      </View>
    )
  }

  if (!plan) {
    return (
      <EstadoVacio
        titulo={t('hoy.sinPlanTitulo')}
        texto={t('hoy.sinPlanTexto')}
        accion={{ texto: t('hoy.sinPlanBoton'), onPress: () => router.replace('/onboarding/bienvenida') }}
      />
    )
  }

  const opciones: OpcionSegmento<Vista>[] = [
    { valor: 'entreno', etiqueta: t('plan.seg.entreno') },
    { valor: 'comidas', etiqueta: t('plan.seg.comidas') },
  ]

  const comidas = plan.comidas ?? []
  const comida = comidas.find((c) => c.id === comidaDetalle)

  return (
    <PantallaScroll titulo={t('plan.titulo')} onRefresh={cargar}>
      <ControlSegmentado opciones={opciones} valor={vista} onChange={setVista} />

      {vista === 'entreno' ? (
        <View style={{ gap: espaciado.dos }}>
          <Texto variante="etiqueta" tono="secundario">
            {t('plan.tocaDia')}
          </Texto>
          <View style={{ gap: espaciado.uno }}>
            {DIAS.map((claveDia, i) => {
              const deDia = sesionDeHoy(plan, i)
              const descanso = deDia.descanso
              return (
                <Pressable
                  key={claveDia}
                  accessibilityRole="button"
                  disabled={descanso}
                  onPress={() => {
                    if (descanso) return
                    tocar()
                    setSesionDetalle(deDia.sesion)
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: espaciado.dos,
                    padding: espaciado.dos,
                    borderRadius: radios.m,
                    backgroundColor: colores.tarjeta,
                    opacity: descanso ? 0.6 : 1,
                  }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radios.s,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colores.hoja,
                    }}>
                    <Dumbbell size={20} color={descanso ? colores.textoSecundario : colores.texto} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, gap: espaciado.media }}>
                    <Texto variante="etiqueta" tono="secundario">
                      {t(claveDia)}
                    </Texto>
                    <Texto fuerte>{descanso ? t('plan.diaDescanso') : deDia.sesion.nombre}</Texto>
                    {!descanso ? (
                      <Texto variante="pie" tono="secundario" numerico>
                        {t('plan.nEjercicios').replace('{n}', String(deDia.sesion.ejercicios.length))}
                      </Texto>
                    ) : null}
                  </View>
                  {!descanso ? <ChevronRight size={20} color={colores.textoSecundario} strokeWidth={2} /> : null}
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : (
        <View style={{ gap: espaciado.tres }}>
          <View style={{ gap: espaciado.dos }}>
            <View style={{ gap: espaciado.media }}>
              <Texto variante="seccion" fuerte>
                {t('plan.comidasCadaDia')}
              </Texto>
              <Texto variante="etiqueta" tono="secundario">
                {t('plan.repiteSemana')}
              </Texto>
            </View>
            {comidas.length === 0 ? (
              <Texto tono="secundario">{t('hoy.sinCifrasTexto')}</Texto>
            ) : (
              <View style={{ gap: espaciado.uno }}>
                {comidas.map((c) => {
                  const principal = c.alimentos.reduce<(typeof c.alimentos)[number] | null>(
                    (mejor, a) => (!mejor || a.macros.proteinaG > mejor.macros.proteinaG ? a : mejor),
                    null,
                  )
                  return (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      onPress={() => {
                        tocar()
                        setComidaDetalle(c.id)
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: espaciado.dos,
                        padding: espaciado.dos,
                        borderRadius: radios.m,
                        backgroundColor: colores.tarjeta,
                      }}>
                      <View style={{ flex: 1, gap: espaciado.media }}>
                        <Texto variante="etiqueta" tono="secundario">
                          {c.momento}
                        </Texto>
                        <Texto fuerte>{principal ? nombreAlimento(principal.id, locale) : ''}</Texto>
                        <Texto variante="pie" tono="secundario" numerico>
                          {numero(c.objetivo.kcal, locale)} {t('comun.kcal')} · {t('macro.proteina').charAt(0)} {numero(c.objetivo.proteinaG, locale)}{' '}
                          {t('comun.gramos')}
                        </Texto>
                      </View>
                      <ChevronRight size={20} color={colores.textoSecundario} strokeWidth={2} />
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>

          {compra.length > 0 ? (
            <View style={{ gap: espaciado.dos }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.uno }}>
                <ShoppingBasket size={20} color={colores.acentoContraste} strokeWidth={2} />
                <View style={{ flex: 1, gap: espaciado.media }}>
                  <Texto variante="seccion" fuerte>
                    {t('plan.compra.titulo')}
                  </Texto>
                  <Texto variante="pie" tono="secundario">
                    {t('plan.compra.semana')}
                  </Texto>
                </View>
              </View>
              <View style={{ borderRadius: radios.l, backgroundColor: colores.tarjeta, overflow: 'hidden' }}>
                {compra.map((item, i) => (
                  <View
                    key={item.alimentoId}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: espaciado.dos,
                      paddingHorizontal: espaciado.dos,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colores.borde,
                    }}>
                    <Texto>{nombreAlimento(item.alimentoId, locale)}</Texto>
                    <Texto fuerte numerico>
                      {numero(item.gramos, locale)} {t('comun.gramos')}
                    </Texto>
                  </View>
                ))}
              </View>
              <Texto variante="etiqueta" tono="secundario">
                {t('plan.compra.prep')}
              </Texto>
            </View>
          ) : null}
        </View>
      )}

      {/* Hojas de detalle. */}
      <HojaInferior visible={sesionDetalle != null} onClose={() => setSesionDetalle(null)} titulo={sesionDetalle?.nombre ?? ''}>
        <View style={{ gap: espaciado.uno, paddingBottom: espaciado.dos }}>
          {sesionDetalle?.ejercicios.map((ej) => (
            <View key={ej.id} style={{ padding: espaciado.dos, borderRadius: radios.m, backgroundColor: colores.tarjeta, gap: espaciado.media }}>
              <Texto fuerte>{nombreEjercicio(ej.ejercicioId, locale)}</Texto>
              <Texto variante="etiqueta" tono="secundario" numerico>
                {t('entreno.objetivo').replace('{series}', String(ej.series)).replace('{min}', String(ej.reps.min)).replace('{max}', String(ej.reps.max))}
                {' · '}
                {t('entreno.rirObjetivo').replace('{min}', String(ej.rir.min)).replace('{max}', String(ej.rir.max))}
              </Texto>
            </View>
          ))}
        </View>
      </HojaInferior>

      <HojaInferior visible={comidaDetalle != null} onClose={() => setComidaDetalle(null)} titulo={comida?.momento ?? t('plan.detalleComida')}>
        <View style={{ gap: espaciado.uno, paddingBottom: espaciado.dos }}>
          {comida?.alimentos.map((a) => (
            <View
              key={a.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: espaciado.dos,
                borderRadius: radios.m,
                backgroundColor: colores.tarjeta,
              }}>
              <Texto>{nombreAlimento(a.id, locale)}</Texto>
              <Texto fuerte numerico>
                {numero(a.gramos, locale)} {t('comun.gramos')}
              </Texto>
            </View>
          ))}
          {comida ? (
            <Texto variante="etiqueta" tono="secundario" numerico>
              {numero(comida.objetivo.kcal, locale)} {t('comun.kcal')} · {t('macro.proteina')} {numero(comida.objetivo.proteinaG, locale)}{' '}
              {t('comun.gramos')} · {t('macro.carbos')} {numero(comida.objetivo.carbosG, locale)} {t('comun.gramos')} · {t('macro.grasa')}{' '}
              {numero(comida.objetivo.grasaG, locale)} {t('comun.gramos')}
            </Texto>
          ) : null}
        </View>
      </HojaInferior>
    </PantallaScroll>
  )
}
