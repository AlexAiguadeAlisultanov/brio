import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { energiaBase, type Sexo } from '@brio/motor'

import { CampoNumerico, ControlSegmentado, PantallaOnboarding, Texto } from '@/componentes'
import { useT } from '@/i18n'
import type { Unidades } from '@/db/repositorio'
import { construirPerfil, useOnboarding } from '@/onboarding/estado'
import { useTema } from '@/ui/proveedor'

// Paso 3: datos del cuerpo. Sexo y unidades segmentados, edad, altura y peso con stepper y
// teclado numérico. En cuanto hay datos suficientes mostramos el gasto estimado pidiéndoselo
// al motor, nunca calculándolo aquí. Validamos los rangos de entrada con un mensaje de
// corrección; los límites finos de seguridad los pone el motor al generar el plan.

const PULGADA_CM = 2.54
const LIBRA_KG = 0.453592

const cmAPulgadas = (cm: number) => Math.round(cm / PULGADA_CM)
const pulgadasACm = (inch: number) => Math.round(inch * PULGADA_CM)
const kgALibras = (kg: number) => Math.round(kg / LIBRA_KG)
const librasAKg = (lb: number) => Math.round(lb * LIBRA_KG * 10) / 10

export default function Cuerpo() {
  const router = useRouter()
  const t = useT()
  const { estado, actualizar } = useOnboarding()
  const { espaciado, colores, radios } = useTema()

  const imperial = estado.unidades === 'imperial'

  // Los campos se muestran en las unidades elegidas, pero el estado compartido guarda siempre
  // métrico. Derivamos el valor a mostrar del estado; al cambiar de unidades se reexpresa solo
  // sin perder el dato. La conversión a métrico ocurre al escribir.
  const alturaDisp = estado.alturaCm != null ? (imperial ? cmAPulgadas(estado.alturaCm) : estado.alturaCm) : undefined
  const pesoDisp = estado.pesoKg != null ? (imperial ? kgALibras(estado.pesoKg) : estado.pesoKg) : undefined

  const fijarAltura = (v: number | undefined) =>
    actualizar({ alturaCm: v == null ? undefined : imperial ? pulgadasACm(v) : v })
  const fijarPeso = (v: number | undefined) =>
    actualizar({ pesoKg: v == null ? undefined : imperial ? librasAKg(v) : v })

  // Validación de entrada (datos plausibles). El motor aplica después sus rangos exactos.
  const edadOk = estado.edadAnios != null && estado.edadAnios >= 1 && estado.edadAnios <= 120
  const alturaOk = estado.alturaCm != null && estado.alturaCm >= 100 && estado.alturaCm <= 250
  const pesoOk = estado.pesoKg != null && estado.pesoKg >= 25 && estado.pesoKg <= 400
  const completo = estado.sexo != null && edadOk && alturaOk && pesoOk

  const error = !edadOk && estado.edadAnios != null
    ? t('ob.cuerpo.errorEdad')
    : !alturaOk && estado.alturaCm != null
      ? t('ob.cuerpo.errorAltura')
      : !pesoOk && estado.pesoKg != null
        ? t('ob.cuerpo.errorPeso')
        : null

  // Gasto estimado en vivo: se lo pedimos al motor con una actividad neutra mientras no se
  // haya elegido la real en el paso siguiente.
  let gasto: number | null = null
  if (completo) {
    const perfil = { ...construirPerfil(estado), actividad: estado.actividad ?? 'moderado' }
    const tdee = energiaBase(perfil).tdee
    if (Number.isFinite(tdee) && tdee > 0) gasto = Math.round(tdee / 50) * 50
  }

  const sexos: { valor: Sexo; etiqueta: string }[] = [
    { valor: 'hombre', etiqueta: t('sexo.hombre') },
    { valor: 'mujer', etiqueta: t('sexo.mujer') },
  ]
  const unidades: { valor: Unidades; etiqueta: string }[] = [
    { valor: 'metrico', etiqueta: t('unidades.metrico') },
    { valor: 'imperial', etiqueta: t('unidades.imperial') },
  ]

  return (
    <PantallaOnboarding
      titulo={t('ob.cuerpo.titulo')}
      apoyo={t('ob.cuerpo.apoyo')}
      primario={{
        texto: t('comun.siguiente'),
        onPress: () => router.push('/onboarding/actividad'),
        desactivado: !completo,
      }}>
      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.cuerpo.sexo')}
        </Texto>
        <ControlSegmentado opciones={sexos} valor={estado.sexo} onChange={(v) => actualizar({ sexo: v })} />
      </View>

      <View style={{ gap: espaciado.uno }}>
        <Texto variante="etiqueta" tono="secundario">
          {t('ob.cuerpo.unidades')}
        </Texto>
        <ControlSegmentado opciones={unidades} valor={estado.unidades} onChange={(v) => actualizar({ unidades: v })} />
      </View>

      <CampoNumerico
        etiqueta={t('ob.cuerpo.edad')}
        valor={estado.edadAnios}
        onChange={(v) => actualizar({ edadAnios: v })}
        sufijo={t('comun.anios')}
        min={1}
        max={120}
      />
      <CampoNumerico
        etiqueta={t('ob.cuerpo.altura')}
        valor={alturaDisp}
        onChange={fijarAltura}
        sufijo={imperial ? t('comun.pulgadas') : t('comun.cm')}
        min={imperial ? 39 : 100}
        max={imperial ? 98 : 250}
      />
      <CampoNumerico
        etiqueta={t('ob.cuerpo.peso')}
        valor={pesoDisp}
        onChange={fijarPeso}
        sufijo={imperial ? t('comun.libras') : t('comun.kg')}
        min={imperial ? 55 : 25}
        max={imperial ? 880 : 400}
        decimales={!imperial}
      />

      {error ? (
        <Texto variante="etiqueta" tono="bloqueo">
          {error}
        </Texto>
      ) : null}

      {gasto != null ? (
        <View style={{ padding: espaciado.dos, borderRadius: radios.m, backgroundColor: colores.tarjeta }}>
          <Texto tono="secundario">{t('ob.cuerpo.gasto').replace('{n}', String(gasto))}</Texto>
        </View>
      ) : null}
    </PantallaOnboarding>
  )
}
