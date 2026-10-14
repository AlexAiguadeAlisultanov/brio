import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): patrón dietético, alergias, intolerancias, comidas por día y alimentos
// que no gustan (por id de catálogo). Las duras se guardan con repo.guardarRestriccion().
export default function Nutricion() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="Cómo comes"
      descripcion="Placeholder."
      pie="TODO(app-designer): dieta, alergias, intolerancias y comidas/día → restricciones.">
      <BotonPrimario texto={t('comun.siguiente')} onPress={() => router.push('/onboarding/resumen')} />
    </Placeholder>
  )
}
