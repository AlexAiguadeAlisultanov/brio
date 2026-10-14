import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): porcentaje de grasa opcional (grasaPct). Si no se sabe, el motor lo estima.
export default function Grasa() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="Porcentaje de grasa"
      descripcion="Placeholder. Es opcional; el motor lo estima si no lo sabes."
      pie="TODO(app-designer): grasaPct opcional del Perfil.">
      <BotonPrimario texto={t('comun.siguiente')} onPress={() => router.push('/onboarding/entrenamiento')} />
    </Placeholder>
  )
}
