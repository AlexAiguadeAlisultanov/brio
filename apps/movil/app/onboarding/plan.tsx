import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { generarPlan, type Plan } from '@brio/motor'

import { AvisoMedico, PantallaOnboarding, TarjetaResumenPlan, Texto } from '@/componentes'
import { useRepositorio } from '@/db/provider'
import { useT } from '@/i18n'
import { construirPerfil, useOnboarding } from '@/onboarding/estado'
import { useTema } from '@/ui/proveedor'

// Paso 10: el plan (la recompensa). Pide el plan al motor y respeta sus estados de seguridad:
// bloqueado (menor de edad o datos inválidos) lleva a una pantalla de derivación sin cifras;
// ocultar cifras (señal de TCA o perder grasa con IMC bajo) a una parada con recursos de ayuda
// y pautas generales; derivar (embarazo, PAR-Q en rojo, patología) enseña el plan como
// orientación con el aviso reforzado. Solo al terminar bien se persiste el perfil y se entra.
export default function PantallaPlan() {
  const router = useRouter()
  const t = useT()
  const repo = useRepositorio()
  const { estado } = useOnboarding()
  const { espaciado } = useTema()
  const [guardando, setGuardando] = useState(false)

  const objetivo = estado.objetivo ?? 'mantenimiento'
  // El plan se calcula una vez. El motor es determinista, así que no cambia entre renders.
  const { perfil, plan } = useMemo(() => {
    const p = construirPerfil(estado)
    return { perfil: p, plan: generarPlan(p, objetivo) }
  }, [estado, objetivo])

  const entrar = async () => {
    setGuardando(true)
    try {
      await repo.guardarPerfil(perfil)
      await repo.guardarObjetivo(objetivo)
      await repo.guardarPlan(plan)
      router.replace('/(tabs)/hoy')
    } catch {
      // Si el guardado falla no dejamos a medias: la pantalla sigue en pie para reintentar.
      setGuardando(false)
    }
  }

  if (plan.bloqueado) return <PantallaBloqueo plan={plan} />
  if (plan.ocultarCifras) return <PantallaParada />

  // Plan con cifras (completo u orientación). Si hay que derivar, el aviso va reforzado.
  return (
    <PantallaOnboarding
      titulo={t('ob.plan.titulo')}
      apoyo={t('ob.plan.apoyo')}
      primario={{ texto: t('ob.plan.boton'), onPress: entrar, cargando: guardando }}
      pie={plan.derivar ? <AvisoMedico rotulo={t('seg.derivar.rotulo')} texto={t('seg.derivar.texto')} reforzado /> : undefined}>
      <View style={{ gap: espaciado.dos }}>
        <TarjetaResumenPlan plan={plan} />
      </View>
    </PantallaOnboarding>
  )
}

// Derivación dura: ni cifras ni rutina de carga. El texto cambia según el motivo del motor.
function PantallaBloqueo({ plan }: { plan: Plan }) {
  const router = useRouter()
  const t = useT()
  const { espaciado } = useTema()
  const menor = plan.seguridad.motivoBloqueo === 'menor_edad'

  return (
    <PantallaOnboarding
      titulo={menor ? t('seg.menor.titulo') : t('seg.datos.titulo')}
      primario={{ texto: menor ? t('seg.menor.boton') : t('seg.datos.boton'), onPress: () => router.replace('/onboarding/cuerpo') }}>
      <View style={{ gap: espaciado.dos }}>
        <Texto tono="secundario">{menor ? t('seg.menor.texto') : t('seg.datos.texto')}</Texto>
      </View>
    </PantallaOnboarding>
  )
}

// Parada por señal de TCA: nada de kcal, déficit ni encuadre de adelgazar. Recursos de ayuda
// según el locale y, como mucho, pautas generales. No se entra a la app ni se persiste nada.
function PantallaParada() {
  const router = useRouter()
  const t = useT()
  const { espaciado, colores, radios } = useTema()

  return (
    <PantallaOnboarding
      titulo={t('seg.tca.titulo')}
      primario={{ texto: t('seg.tca.boton'), onPress: () => router.replace('/onboarding/bienvenida') }}>
      <View style={{ gap: espaciado.dos }}>
        <Texto tono="secundario">{t('seg.tca.texto')}</Texto>
        <View style={{ padding: espaciado.tres, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.uno }}>
          <Texto variante="pie" fuerte tono="precaucion" style={{ letterSpacing: 0.4 }}>
            {t('seg.tca.recursosRotulo').toUpperCase()}
          </Texto>
          <Texto tono="secundario">{t('seg.tca.recursos')}</Texto>
        </View>
        <Texto tono="secundario">{t('seg.tca.pautas')}</Texto>
      </View>
    </PantallaOnboarding>
  )
}
