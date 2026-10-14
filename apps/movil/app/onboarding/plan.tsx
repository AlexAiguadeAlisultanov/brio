import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): generar el plan con generarPlan(perfil, objetivo) del motor, guardarlo
// con repo.guardarPlan() y entrar a las pestañas. De momento solo navega. Hasta que se guarde
// un perfil de verdad, la pantalla índice volverá a mandar al onboarding al reabrir la app.
export default function PlanOnboarding() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="Tu plan"
      descripcion="Placeholder."
      pie="TODO(app-designer): generarPlan() → repo.guardarPlan() → entrar a Hoy.">
      <BotonPrimario texto={t('comun.empezar')} onPress={() => router.replace('/(tabs)/hoy')} />
    </Placeholder>
  )
}
