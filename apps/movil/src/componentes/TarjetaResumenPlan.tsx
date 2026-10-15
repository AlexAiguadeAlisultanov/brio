import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Dumbbell, Flame } from 'lucide-react-native'
import type { Plan } from '@brio/motor'

import { useLocale, useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import { GRADIENTES } from '@/ui/tema'
import { useTema } from '@/ui/proveedor'

import { Texto } from './base'
import { numero } from './formato'

// Tarjeta de resumen del plan: el premio al terminar el onboarding. Muestra el gasto diario y
// el objetivo calórico, el reparto de macros en gramos con una barra proporcional por su
// aporte energético, y qué entreno toca esta semana. Todas las cifras vienen del motor.

const SPLIT_CLAVE: Record<string, ClaveI18n> = {
  descanso: 'plan.split.descanso',
  full_body: 'plan.split.full_body',
  full_body_aba: 'plan.split.full_body',
  torso_pierna: 'plan.split.torso_pierna',
  torso_pierna_ppl: 'plan.split.torso_pierna_ppl',
  ppl: 'plan.split.ppl',
}

export function TarjetaResumenPlan({ plan }: { plan: Plan }) {
  const { colores, radios, espaciado } = useTema()
  const t = useT()
  const { locale } = useLocale()

  const energia = plan.energia
  const macros = plan.macros
  const entreno = plan.entrenamiento

  return (
    <View style={{ gap: espaciado.dos }}>
      {energia ? (
        <LinearGradient
          colors={GRADIENTES.tarjetaOscura}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flexDirection: 'row',
            gap: espaciado.dos,
            padding: espaciado.tres,
            borderRadius: radios.l,
            borderWidth: 1,
            borderColor: colores.borde,
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radios.m,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colores.acento + '1A',
            }}>
            <Flame size={24} color={colores.acentoContraste} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto variante="etiqueta" tono="secundario">
              {t('plan.objetivoCalorico')}
            </Texto>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaciado.media }}>
              <Texto variante="titulo" numerico>
                {numero(energia.kcalObjetivo, locale)}
              </Texto>
              <Texto tono="secundario" fuerte>
                {t('plan.kcalDia')}
              </Texto>
            </View>
            <Texto variante="pie" tono="secundario">
              {t('plan.tuGasto')} {numero(energia.tdee, locale)} {t('comun.kcal')}
            </Texto>
          </View>
        </LinearGradient>
      ) : null}

      {macros ? (
        <View style={{ padding: espaciado.tres, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.dos }}>
          <Texto variante="etiqueta" tono="secundario">
            {t('plan.repartoMacros')}
          </Texto>
          <BarraMacros proteinaG={macros.proteinaG} carbosG={macros.carbosG} grasaG={macros.grasaG} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Macro etiqueta={t('macro.proteina')} gramos={macros.proteinaG} color={colores.acento} locale={locale} sufijo={t('comun.gramos')} />
            <Macro etiqueta={t('macro.carbos')} gramos={macros.carbosG} color={colores.exito} locale={locale} sufijo={t('comun.gramos')} />
            <Macro etiqueta={t('macro.grasa')} gramos={macros.grasaG} color={colores.precaucion} locale={locale} sufijo={t('comun.gramos')} />
          </View>
        </View>
      ) : null}

      {entreno && entreno.sesiones.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            gap: espaciado.dos,
            padding: espaciado.tres,
            borderRadius: radios.l,
            backgroundColor: colores.tarjeta,
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radios.m,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colores.hoja,
            }}>
            <Dumbbell size={24} color={colores.texto} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto variante="etiqueta" tono="secundario">
              {t('plan.tuEntreno')}
            </Texto>
            <Texto fuerte>
              {t('plan.diasSemana').replace('{n}', String(entreno.diasPorSemana))}
            </Texto>
            <Texto variante="pie" tono="secundario">
              {t(SPLIT_CLAVE[entreno.split] ?? 'plan.split.full_body')}
            </Texto>
          </View>
        </View>
      ) : null}
    </View>
  )
}

function BarraMacros({ proteinaG, carbosG, grasaG }: { proteinaG: number; carbosG: number; grasaG: number }) {
  const { colores, radios } = useTema()
  const kProt = proteinaG * 4
  const kCarb = carbosG * 4
  const kGrasa = grasaG * 9
  const total = kProt + kCarb + kGrasa || 1
  return (
    <View style={{ flexDirection: 'row', height: 10, borderRadius: radios.s, overflow: 'hidden', backgroundColor: colores.hoja }}>
      <View style={{ flex: kProt / total, backgroundColor: colores.acento }} />
      <View style={{ flex: kCarb / total, backgroundColor: colores.exito }} />
      <View style={{ flex: kGrasa / total, backgroundColor: colores.precaucion }} />
    </View>
  )
}

function Macro({
  etiqueta,
  gramos,
  color,
  locale,
  sufijo,
}: {
  etiqueta: string
  gramos: number
  color: string
  locale: Parameters<typeof numero>[1]
  sufijo: string
}) {
  const { espaciado } = useTema()
  return (
    <View style={{ gap: espaciado.media }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.media }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Texto variante="pie" tono="secundario">
          {etiqueta}
        </Texto>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Texto variante="seccion" numerico>
          {numero(gramos, locale)}
        </Texto>
        <Texto variante="pie" tono="secundario">
          {sufijo}
        </Texto>
      </View>
    </View>
  )
}
