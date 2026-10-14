import { useRouter } from 'expo-router'
import { View } from 'react-native'
import type { Cribado } from '@brio/motor'

import { AvisoMedico, Chip, ControlSegmentado, PantallaOnboarding, Texto } from '@/componentes'
import { useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import { useOnboarding } from '@/onboarding/estado'
import { MEDICAMENTOS, ZONAS } from '@/onboarding/opciones'
import { useTema } from '@/ui/proveedor'

// Paso 7: cribado de salud (PAR-Q + SCOFF + condiciones declaradas). Son sí/no; una bandera no
// impide seguir, pero recomienda consultar y se refleja en el aviso reforzado. Las zonas que
// molestan pasan a filtro del motor para no cargar donde duele.

// Claves booleanas del cribado, agrupadas por bloque. El valor se guarda tal cual en el estado.
type ClaveBool = {
  [K in keyof Cribado]: Cribado[K] extends boolean ? K : never
}[keyof Cribado]

const PARQ: ClaveBool[] = ['problemaCorazon', 'dolorPecho', 'mareoDesmayo', 'problemaOseoArticular', 'tensionAlta']
const SCOFF: ClaveBool[] = ['scoffVomitar', 'scoffPerderControl', 'scoffPerdido6kg3meses', 'scoffSeVeGordo', 'scoffComidaDomina']
const CONDICIONES: ClaveBool[] = ['embarazoLactancia', 'enfermedadRenalHepatica', 'diabetes', 'enfermedadCardiovascular']

function PreguntaSiNo({
  texto,
  valor,
  onChange,
}: {
  texto: string
  valor: boolean
  onChange: (v: boolean) => void
}) {
  const t = useT()
  const { espaciado } = useTema()
  return (
    <View style={{ gap: espaciado.uno }}>
      <Texto variante="etiqueta">{texto}</Texto>
      <View style={{ maxWidth: 200 }}>
        <ControlSegmentado
          opciones={[
            { valor: 'no', etiqueta: t('comun.no') },
            { valor: 'si', etiqueta: t('comun.si') },
          ]}
          valor={valor ? 'si' : 'no'}
          onChange={(v) => onChange(v === 'si')}
        />
      </View>
    </View>
  )
}

export default function Salud() {
  const router = useRouter()
  const t = useT()
  const { estado, actualizar, actualizarCribado } = useOnboarding()
  const { espaciado, colores } = useTema()
  const c = estado.cribado

  const alternarMedicamento = (valor: (typeof MEDICAMENTOS)[number]['valor']) => {
    const actual = c.medicamentos
    actualizarCribado({
      medicamentos: actual.includes(valor) ? actual.filter((m) => m !== valor) : [...actual, valor],
    })
  }
  const alternarZona = (valor: (typeof ZONAS)[number]['valor']) => {
    const actual = estado.lesiones
    actualizar({ lesiones: actual.includes(valor) ? actual.filter((z) => z !== valor) : [...actual, valor] })
  }

  const scoffPositivos = SCOFF.reduce((n, k) => n + (c[k] ? 1 : 0), 0)
  const hayBandera =
    c.problemaCorazon ||
    c.dolorPecho ||
    c.mareoDesmayo ||
    c.tensionAlta ||
    c.embarazoLactancia ||
    c.enfermedadRenalHepatica ||
    c.enfermedadCardiovascular ||
    scoffPositivos >= 2

  const seccion = (titulo: string, claves: ClaveBool[]) => (
    <View style={{ gap: espaciado.dos }}>
      <Texto variante="etiqueta" tono="secundario" fuerte style={{ letterSpacing: 0.3 }}>
        {titulo.toUpperCase()}
      </Texto>
      {claves.map((k) => (
        <PreguntaSiNo
          key={k}
          texto={t(`salud.${k}` as ClaveI18n)}
          valor={c[k]}
          onChange={(v) => actualizarCribado({ [k]: v } as Partial<Cribado>)}
        />
      ))}
    </View>
  )

  return (
    <PantallaOnboarding
      titulo={t('ob.salud.titulo')}
      apoyo={t('ob.salud.apoyo')}
      primario={{ texto: t('comun.siguiente'), onPress: () => router.push('/onboarding/nutricion') }}
      pie={hayBandera ? <AvisoMedico rotulo={t('ob.salud.banderaRotulo')} texto={t('ob.salud.banderaTexto')} reforzado /> : undefined}>
      {seccion(t('ob.salud.parq'), PARQ)}

      <View style={{ height: 1, backgroundColor: colores.borde }} />
      {seccion(t('ob.salud.scoff'), SCOFF)}

      <View style={{ height: 1, backgroundColor: colores.borde }} />
      {seccion(t('ob.salud.condiciones'), CONDICIONES)}

      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.salud.medicamentos')}
        </Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
          {MEDICAMENTOS.map((m) => (
            <Chip
              key={m.valor}
              etiqueta={t(m.clave)}
              seleccionado={c.medicamentos.includes(m.valor)}
              onPress={() => alternarMedicamento(m.valor)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.salud.lesiones')}
        </Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
          {ZONAS.map((z) => (
            <Chip
              key={z.valor}
              etiqueta={t(z.clave)}
              seleccionado={estado.lesiones.includes(z.valor)}
              onPress={() => alternarZona(z.valor)}
            />
          ))}
        </View>
        <Texto variante="pie" tono="secundario">
          {t('ob.salud.lesionesNota')}
        </Texto>
      </View>
    </PantallaOnboarding>
  )
}
