import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): nivel de actividad (sedentario..muy_activo) del Perfil.
export default function Actividad() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="¿Cuánto te mueves?"
      descripcion="Placeholder."
      pie="TODO(app-designer): nivel de actividad del Perfil.">
      <BotonPrimario texto={t('comun.siguiente')} onPress={() => router.push('/onboarding/grasa')} />
    </Placeholder>
  )
}
