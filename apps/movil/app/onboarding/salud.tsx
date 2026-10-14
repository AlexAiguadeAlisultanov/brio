import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): cribado de salud (PAR-Q + SCOFF + condiciones y medicamentos). Es
// sensible: señales de parada destacadas y derivación cuando el motor lo marque.
export default function Salud() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="Unas preguntas de salud"
      descripcion="Placeholder."
      pie="TODO(app-designer): cribado PAR-Q + SCOFF + condiciones → Cribado del Perfil.">
      <BotonPrimario texto={t('comun.siguiente')} onPress={() => router.push('/onboarding/nutricion')} />
    </Placeholder>
  )
}
