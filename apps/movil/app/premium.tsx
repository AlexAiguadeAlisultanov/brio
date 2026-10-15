import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CalendarCheck, Check, ShoppingBasket, Sparkles, Target, Trophy, X, type LucideIcon } from 'lucide-react-native'

import { useAuth } from '@/auth/contexto'
import { BotonPrimario, BotonTexto, Hero, HojaInferior, InsigniaPremium, Texto, tocar } from '@/componentes'
import { useRepositorio } from '@/db/provider'
import { useLocale, useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import { HERO_PREMIUM } from '@/ui/imagenes'
import { useTema } from '@/ui/proveedor'

// Muro de pago. Enseña lo que suma Premium frente a lo que ya es gratis, deja aceptar los
// términos y la renovación automática (obligatorio antes de pagar) y permite pagar: suscripción
// mensual por Stripe o un pase de 30 días por Bizum, que no admite cobros recurrentes. Si el
// servidor no tiene el pago configurado, los botones se apagan con una nota. El estado premium lo
// actualiza useAuth al volver; si ya eres premium, esta pantalla lo celebra en vez de vender.

const VENTAJAS: { icono: LucideIcon; titulo: ClaveI18n; desc: ClaveI18n }[] = [
  { icono: Sparkles, titulo: 'premium.v.ia.titulo', desc: 'premium.v.ia.desc' },
  { icono: CalendarCheck, titulo: 'premium.v.checkin.titulo', desc: 'premium.v.checkin.desc' },
  { icono: Target, titulo: 'premium.v.objetivo.titulo', desc: 'premium.v.objetivo.desc' },
  { icono: ShoppingBasket, titulo: 'premium.v.compra.titulo', desc: 'premium.v.compra.desc' },
  { icono: Trophy, titulo: 'premium.v.prs.titulo', desc: 'premium.v.prs.desc' },
]

function fechaCorta(iso: string, locale: 'es' | 'ca' | 'en'): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  return locale === 'en' ? `${yy}-${mm}-${dd}` : `${dd}/${mm}/${yy}`
}

export default function Premium() {
  const router = useRouter()
  const t = useT()
  const { locale } = useLocale()
  const repo = useRepositorio()
  const { colores, espaciado, radios } = useTema()
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const { esPremium, usuario, comprarPremium } = useAuth()

  const [comprando, setComprando] = useState<'suscripcion' | 'pase' | null>(null)
  const [sinPago, setSinPago] = useState(false)
  const [aceptado, setAceptado] = useState(false)
  const [terminosAbiertos, setTerminosAbiertos] = useState(false)

  // Al abrir, recuperamos si ya aceptó los términos para dejar la casilla marcada.
  useFocusEffect(
    useCallback(() => {
      let vivo = true
      repo
        .ajustesApp()
        .then((a) => vivo && setAceptado(Boolean(a.terminosAceptadosEn)))
        .catch(() => {})
      return () => {
        vivo = false
      }
    }, [repo]),
  )

  const alternarAceptado = async () => {
    tocar()
    const nuevo = !aceptado
    setAceptado(nuevo)
    await repo.guardarAjustesApp({ terminosAceptadosEn: nuevo ? new Date().toISOString() : null })
  }

  const cerrar = () => {
    tocar()
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/perfil')
  }

  const comprar = async (modo: 'suscripcion' | 'pase') => {
    setComprando(modo)
    try {
      const r = await comprarPremium(modo)
      if (r.sinPago) setSinPago(true)
    } catch {
      // Si el pago falla (servidor caído, Stripe mal configurado, sin conexión), no dejamos el
      // botón cargando para siempre: avisamos de que ahora mismo no se puede.
      setSinPago(true)
    } finally {
      setComprando(null)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, espaciado.tres) }}>
        <Hero imagen={HERO_PREMIUM} altura={Math.max(240, height * 0.34)}>
          <InsigniaPremium texto={t('premium.insignia')} />
          <Texto variante="titulo">{t('premium.titulo')}</Texto>
          <Texto tono="secundario">{t('premium.apoyo')}</Texto>
        </Hero>

        <View style={{ padding: espaciado.tres, gap: espaciado.tres }}>
          {esPremium ? (
            <View style={{ padding: espaciado.tres, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.uno }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.uno }}>
                <Sparkles size={20} color={colores.oro} strokeWidth={2} />
                <Texto variante="seccion" fuerte>
                  {t('premium.yaTitulo')}
                </Texto>
              </View>
              <Texto tono="secundario">{t('premium.yaApoyo')}</Texto>
              {usuario?.premiumHasta ? (
                <Texto variante="etiqueta" style={{ color: colores.oro }} numerico>
                  {t('premium.hasta').replace('{fecha}', fechaCorta(usuario.premiumHasta, locale))}
                </Texto>
              ) : null}
            </View>
          ) : (
            <>
              {/* Ventajas de Premium, destacadas con icono. */}
              <View style={{ gap: espaciado.dos }}>
                <Texto variante="seccion" fuerte>
                  {t('premium.ventajasTitulo')}
                </Texto>
                <View style={{ gap: espaciado.dos }}>
                  {VENTAJAS.map((v) => (
                    <View key={v.titulo} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: espaciado.dos }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: radios.m,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colores.oro + '1F',
                        }}>
                        <v.icono size={20} color={colores.oro} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1, gap: espaciado.media }}>
                        <Texto fuerte>{t(v.titulo)}</Texto>
                        <Texto variante="etiqueta" tono="secundario">
                          {t(v.desc)}
                        </Texto>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Qué sigue siendo gratis, para que se note el salto. */}
              <View style={{ padding: espaciado.dos, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.media }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.uno }}>
                  <Check size={18} color={colores.textoSecundario} strokeWidth={2.4} />
                  <Texto fuerte>{t('premium.gratisResumenTitulo')}</Texto>
                </View>
                <Texto variante="etiqueta" tono="secundario">
                  {t('premium.gratisResumen')}
                </Texto>
              </View>

              {/* Precio + consentimiento + pago. */}
              <View style={{ gap: espaciado.dos }}>
                <Texto variante="titulo" numerico>
                  {t('premium.premiumApoyo')}
                </Texto>

                {/* Renovación automática: prominente (tamaño y peso, no solo color). */}
                <View style={{ padding: espaciado.dos, borderRadius: radios.m, borderWidth: 1, borderColor: colores.borde }}>
                  <Texto fuerte>{t('premium.renovacion')}</Texto>
                </View>

                {/* Casilla obligatoria antes de pagar la suscripción. */}
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: aceptado }}
                  onPress={() => void alternarAceptado()}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: espaciado.uno, paddingVertical: espaciado.media }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: radios.s,
                      borderWidth: 1,
                      borderColor: aceptado ? colores.acento : colores.borde,
                      backgroundColor: aceptado ? colores.acento : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}>
                    {aceptado ? <Check size={16} color={colores.sobreAcento} strokeWidth={3} /> : null}
                  </View>
                  <Texto style={{ flex: 1 }}>{t('premium.acepto')}</Texto>
                </Pressable>
                <View style={{ alignSelf: 'flex-start' }}>
                  <BotonTexto texto={t('premium.verTerminos')} onPress={() => setTerminosAbiertos(true)} />
                </View>

                {sinPago ? (
                  <>
                    <BotonPrimario texto={t('premium.suscripcion')} onPress={() => {}} desactivado />
                    <Texto variante="etiqueta" tono="precaucion">
                      {t('premium.sinPago')}
                    </Texto>
                  </>
                ) : (
                  <>
                    <BotonPrimario
                      texto={t('premium.suscripcion')}
                      tono="oro"
                      onPress={() => void comprar('suscripcion')}
                      cargando={comprando === 'suscripcion'}
                      desactivado={!aceptado || comprando === 'pase'}
                    />
                    <BotonPrimario
                      texto={t('premium.pase')}
                      onPress={() => void comprar('pase')}
                      cargando={comprando === 'pase'}
                      desactivado={comprando === 'suscripcion'}
                    />
                    <Texto variante="etiqueta" tono="secundario">
                      {t('premium.paseNota')}
                    </Texto>
                  </>
                )}
                <Texto variante="pie" tono="secundario">
                  {t('premium.privacidad')}
                </Texto>
              </View>
            </>
          )}

          <View style={{ alignItems: 'center' }}>
            <BotonTexto texto={esPremium ? t('comun.hecho') : t('premium.volver')} onPress={cerrar} />
          </View>
        </View>
      </ScrollView>

      {/* Cerrar, arriba a la derecha, respetando el área segura del modal. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('premium.volver')}
        onPress={cerrar}
        style={{
          position: 'absolute',
          top: insets.top + espaciado.uno,
          right: espaciado.dos,
          width: 44,
          height: 44,
          borderRadius: radios.completo,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(11,11,12,0.5)',
        }}>
        <X size={22} color={colores.texto} strokeWidth={2} />
      </Pressable>

      {/* Términos, como plantilla fácil de editar. */}
      <HojaInferior visible={terminosAbiertos} onClose={() => setTerminosAbiertos(false)} titulo={t('premium.terminos.titulo')}>
        <View style={{ paddingBottom: espaciado.dos }}>
          <Texto tono="secundario">{t('premium.terminos.cuerpo')}</Texto>
        </View>
      </HojaInferior>
    </View>
  )
}
