import { useRouter } from 'expo-router'

import { BotonPrimario, Placeholder } from '@/componentes/placeholder'
import { useT } from '@/i18n'

// TODO(app-designer): elección de objetivo del motor
// (ganar_musculo | perder_grasa | mantenimiento | fuerza). Guardar con repo.guardarObjetivo().
export default function Objetivo() {
  const router = useRouter()
  const t = useT()
  return (
    <Placeholder
      titulo="¿Qué quieres conseguir?"
      descripcion="Placeholder."
      pie="TODO(app-designer): selector de objetivo → repo.guardarObjetivo().">
      <BotonPrimario texto={t('comun.siguiente')} onPress={() => router.push('/onboarding/cuerpo')} />
    </Placeholder>
  )
}
