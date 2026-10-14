import { useMemo } from 'react'
import { View } from 'react-native'
import { aplicarCheckIn, tendenciaPeso, type AjusteSemanal, type Plan, type RegistroProgreso } from '@brio/motor'

import { useLocale, useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

import { Texto } from './base'
import { BotonPrimario } from './botones'
import { numero } from './formato'
import { HojaInferior } from './HojaInferior'
import { IndicadorOrigen } from './IndicadorOrigen'

// Hoja de check-in semanal: resume el peso medio y el ritmo real frente al objetivo, y explica
// en una frase el ajuste que propone el motor. El usuario confirma y se guarda. Es la pieza
// reutilizable; la pestaña Progreso completa llega en la Fase 2B. Todos los números salen del
// motor (tendencia y ajuste); aquí solo se visten para leerse.

function decimal(valor: number, locale: 'es' | 'ca' | 'en'): string {
  const abs = Math.abs(valor).toFixed(1)
  return locale === 'en' ? abs : abs.replace('.', ',')
}

export function HojaCheckin({
  visible,
  onClose,
  plan,
  historico,
  onAplicar,
}: {
  visible: boolean
  onClose: () => void
  plan: Plan
  historico: RegistroProgreso[]
  onAplicar: (ajuste: AjusteSemanal) => void
}) {
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  const { locale } = useLocale()

  const { tend, ajuste } = useMemo(
    () => ({ tend: tendenciaPeso(historico), ajuste: aplicarCheckIn(plan, historico) }),
    [plan, historico],
  )

  const ritmoFrase = () => {
    if (!tend.valido || tend.puntos < 2) return t('checkin.sinDatos')
    const r = ajuste.ritmoKgSemana
    if (Math.abs(r) < 0.05) return t('checkin.ritmoEstable')
    const clave = r < 0 ? 'checkin.ritmoBajando' : 'checkin.ritmoSubiendo'
    return t(clave).replace('{n}', decimal(r, locale))
  }

  const propuestaFrase = () => {
    if (ajuste.deltaKcal < 0) return t('checkin.propuestaBajar').replace('{n}', numero(Math.abs(ajuste.deltaKcal), locale))
    if (ajuste.deltaKcal > 0) return t('checkin.propuestaSubir').replace('{n}', numero(ajuste.deltaKcal, locale))
    return t('checkin.propuestaMantener')
  }

  const aplicar = () => {
    onAplicar(ajuste)
    onClose()
  }

  return (
    <HojaInferior visible={visible} onClose={onClose} titulo={t('checkin.titulo')}>
      <View style={{ gap: espaciado.dos, paddingBottom: espaciado.dos }}>
        <Texto tono="secundario">{t('checkin.apoyo')}</Texto>

        <View style={{ flexDirection: 'row', gap: espaciado.dos }}>
          <View style={{ flex: 1, padding: espaciado.dos, borderRadius: radios.m, backgroundColor: colores.tarjeta, gap: espaciado.media }}>
            <Texto variante="pie" tono="secundario">
              {t('checkin.pesoMedio')}
            </Texto>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
              <Texto variante="seccion" numerico>
                {tend.puntos > 0 ? decimal(tend.mediaReciente, locale) : '—'}
              </Texto>
              <Texto variante="pie" tono="secundario">
                {t('comun.kg')}
              </Texto>
            </View>
          </View>
        </View>

        <Texto fuerte>{ritmoFrase()}</Texto>
        <Texto>{propuestaFrase()}</Texto>
        {ajuste.confianza === 'baja' ? (
          <Texto variante="etiqueta" tono="secundario">
            {t('checkin.confianzaBaja')}
          </Texto>
        ) : null}

        <IndicadorOrigen origen="motor" />
        <BotonPrimario texto={t('checkin.aplicar')} onPress={aplicar} />
      </View>
    </HojaInferior>
  )
}
