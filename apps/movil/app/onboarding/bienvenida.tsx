import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): pantalla de bienvenida. Presentar Brío, el aviso médico destacado por
// jerarquía tipográfica (no solo color) y el consentimiento para empezar.
export default function Bienvenida() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="Te damos la bienvenida"
      descripcion="Placeholder. El diseño real de esta pantalla llega después."
      pie="TODO(app-designer): intro + aviso médico + consentimiento.">
      <BotonPrimario texto={t('comun.empezar')} onPress={() => router.push('/onboarding/objetivo')} />
    </Placeholder>
  )
}
