import { View } from 'react-native'

import type { Feedback } from '@/dia/logica'
import { useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

import { Texto } from './base'
import { BotonPrimario, BotonSecundario } from './botones'
import { HojaInferior } from './HojaInferior'

// Hoja de cierre de la sesión: cómo ha ido. La respuesta se guarda y alimenta la progresión del
// motor para la próxima vez (subir, mantener o bajar la carga). "En su punto" es la acción
// primaria porque es la respuesta más común; las otras dos van en secundario.

export function HojaFeedbackSesion({
  visible,
  onClose,
  onElegir,
}: {
  visible: boolean
  onClose: () => void
  onElegir: (feedback: Feedback) => void
}) {
  const { espaciado } = useTema()
  const t = useT()

  const elegir = (f: Feedback) => {
    onElegir(f)
    onClose()
  }

  return (
    <HojaInferior visible={visible} onClose={onClose} titulo={t('feedback.titulo')}>
      <View style={{ gap: espaciado.dos, paddingBottom: espaciado.dos }}>
        <Texto tono="secundario">{t('feedback.apoyo')}</Texto>
        <BotonSecundario texto={t('feedback.facil')} onPress={() => elegir('facil')} />
        <BotonPrimario texto={t('feedback.ok')} onPress={() => elegir('ok')} />
        <BotonSecundario texto={t('feedback.dificil')} onPress={() => elegir('dificil')} />
      </View>
    </HojaInferior>
  )
}
