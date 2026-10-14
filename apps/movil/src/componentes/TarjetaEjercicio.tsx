import { View } from 'react-native'
import { PlayCircle, Repeat } from 'lucide-react-native'

import { useT } from '@/i18n'
import { useTema } from '@/ui/proveedor'

import { Texto } from './base'
import { BotonTexto } from './botones'
import { FilaSerie, type DatosSerie } from './FilaSerie'
import { TemporizadorDescanso } from './TemporizadorDescanso'

// Tarjeta de un ejercicio de la sesión: el nombre, lo prescrito (series, reps, RIR y, si procede,
// el %1RM), la carga sugerida para hoy a partir de la progresión, el registro serie a serie, el
// temporizador de descanso y los accesos a la demostración y a cambiar el ejercicio. Las cifras
// vienen del plan y de la progresión del motor; la tarjeta solo las muestra.

export function TarjetaEjercicio({
  nombre,
  objetivoTexto,
  rirTexto,
  pct1rmTexto,
  sugeridoTexto,
  series,
  pesoSugerido,
  repsSugeridas,
  descansoSegundos,
  autoDescanso,
  onCambioSerie,
  onDemo,
  onSustituir,
}: {
  nombre: string
  objetivoTexto: string
  rirTexto: string
  pct1rmTexto?: string
  sugeridoTexto?: string
  series: DatosSerie[]
  pesoSugerido?: number
  repsSugeridas?: number
  descansoSegundos: number
  autoDescanso: number
  onCambioSerie: (indice: number, datos: DatosSerie) => void
  onDemo?: () => void
  onSustituir: () => void
}) {
  const { colores, espaciado, radios } = useTema()
  const t = useT()

  return (
    <View style={{ padding: espaciado.dos, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.dos }}>
      <View style={{ gap: espaciado.media }}>
        <Texto variante="seccion" fuerte>
          {nombre}
        </Texto>
        <Texto variante="etiqueta" tono="secundario" numerico>
          {objetivoTexto} · {pct1rmTexto ? pct1rmTexto : rirTexto}
        </Texto>
        {sugeridoTexto ? (
          <Texto variante="etiqueta" numerico style={{ color: colores.acentoContraste }}>
            {sugeridoTexto}
          </Texto>
        ) : null}
      </View>

      <View style={{ gap: espaciado.uno }}>
        {series.map((s, i) => (
          <FilaSerie
            key={i}
            numero={i + 1}
            datos={s}
            pesoSugerido={pesoSugerido}
            repsSugeridas={repsSugeridas}
            onCambio={(datos) => onCambioSerie(i, datos)}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaciado.dos }}>
        <TemporizadorDescanso segundos={descansoSegundos} autoIniciar={autoDescanso} />
      </View>

      <View style={{ flexDirection: 'row', gap: espaciado.tres, flexWrap: 'wrap' }}>
        {onDemo ? <BotonTexto texto={t('entreno.verDemo')} icono={PlayCircle} onPress={onDemo} /> : null}
        <BotonTexto texto={t('entreno.cambiar')} icono={Repeat} onPress={onSustituir} />
      </View>
    </View>
  )
}
