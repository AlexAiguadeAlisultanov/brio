import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): repaso de lo introducido antes de generar el plan. Aquí se construye el
// Perfil completo y se guarda con repo.guardarPerfil() + repo.guardarObjetivo().
export default function Resumen() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="Resumen"
      descripcion="Placeholder."
      pie="TODO(app-designer): repasar y guardar Perfil + Objetivo.">
      <BotonPrimario texto={t('comun.continuar')} onPress={() => router.push('/onboarding/plan')} />
    </Placeholder>
  )
}
