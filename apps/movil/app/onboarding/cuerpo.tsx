import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): datos de cuerpo (sexo, edad, altura, peso). Alimentan el Perfil del motor.
export default function Cuerpo() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="Tus datos de cuerpo"
      descripcion="Placeholder."
      pie="TODO(app-designer): sexo, edad, altura y peso del Perfil.">
      <BotonPrimario texto={t('comun.siguiente')} onPress={() => router.push('/onboarding/actividad')} />
    </Placeholder>
  )
}
