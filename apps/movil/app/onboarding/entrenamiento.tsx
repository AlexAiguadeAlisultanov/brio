import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): experiencia, días por semana, duración de sesión y equipo disponible.
export default function Entrenamiento() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="Tu entrenamiento"
      descripcion="Placeholder."
      pie="TODO(app-designer): experiencia, días, duración y equipo del Perfil.">
      <BotonPrimario texto={t('comun.siguiente')} onPress={() => router.push('/onboarding/salud')} />
    </Placeholder>
  )
}
