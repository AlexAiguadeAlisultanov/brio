import { useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { evaluarSeguridad } from '@brio/motor'
import type { Href } from 'expo-router'

import { AvisoMedico, BotonTexto, Chip, ChipRestriccion, PantallaOnboarding, Texto } from '@/componentes'
import { useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import { construirPerfil, useOnboarding } from '@/onboarding/estado'
import { useTema } from '@/ui/proveedor'

// Paso 9: resumen y aviso. Lista editable de todo lo contestado, con un enlace a cada paso, y
// el aviso médico integrado (reforzado si el cribado levantó alguna bandera). El botón lleva a
// generar el plan. Aquí ya consultamos al motor para decidir el énfasis del aviso.
export default function Resumen() {
  const router = useRouter()
  const t = useT()
  const { estado } = useOnboarding()
  const { espaciado, colores, radios } = useTema()

  const perfil = construirPerfil(estado)
  const informe = evaluarSeguridad(perfil, estado.objetivo ?? 'mantenimiento')
  const reforzado = informe.derivar || informe.bloquea || informe.ocultarCifras

  const imperial = estado.unidades === 'imperial'
  const altura = estado.alturaCm != null ? (imperial ? `${Math.round(estado.alturaCm / 2.54)} ${t('comun.pulgadas')}` : `${estado.alturaCm} ${t('comun.cm')}`) : '—'
  const peso = estado.pesoKg != null ? (imperial ? `${Math.round(estado.pesoKg / 0.453592)} ${t('comun.libras')}` : `${estado.pesoKg} ${t('comun.kg')}`) : '—'
  const cuerpo = `${estado.edadAnios ?? '—'} ${t('comun.anios')} · ${altura} · ${peso}`

  const grasa =
    estado.grasaModo === 'medido' && estado.grasaPct != null
      ? `${estado.grasaPct} %`
      : estado.grasaModo === 'estimar'
        ? t('ob.resumen.grasaEstimar')
        : t('ob.resumen.grasaNo')

  const entrenamiento = `${estado.experiencia ? t(`experiencia.${estado.experiencia}` as ClaveI18n) : '—'} · ${t(
    'ob.resumen.diasYduracion',
  )
    .replace('{dias}', String(estado.diasPorSemana ?? '—'))
    .replace('{min}', String(estado.duracionSesionMin ?? '—'))}`

  const c = estado.cribado
  const scoff = [c.scoffVomitar, c.scoffPerderControl, c.scoffPerdido6kg3meses, c.scoffSeVeGordo, c.scoffComidaDomina].filter(Boolean).length
  const bandera =
    c.problemaCorazon || c.dolorPecho || c.mareoDesmayo || c.tensionAlta || c.embarazoLactancia || c.enfermedadRenalHepatica || c.enfermedadCardiovascular || scoff >= 2
  const salud = bandera ? t('ob.resumen.saludRevisar') : t('ob.resumen.saludBien')

  const sinRestricciones =
    estado.patronDietetico.length === 0 && estado.alergias.length === 0 && estado.intolerancias.length === 0 && estado.noGustaIds.length === 0

  return (
    <PantallaOnboarding
      titulo={t('ob.resumen.titulo')}
      primario={{ texto: t('ob.resumen.boton'), onPress: () => router.push('/onboarding/plan') }}
      pie={<AvisoMedico rotulo={t('ob.resumen.avisoRotulo')} texto={t('ob.resumen.avisoTexto')} reforzado={reforzado} />}>
      <View style={{ borderRadius: radios.l, backgroundColor: colores.tarjeta, paddingHorizontal: espaciado.tres, paddingVertical: espaciado.uno }}>
        <Separador>
          <Fila titulo={t('ob.resumen.objetivo')} valor={estado.objetivo ? t(`objetivo.${estado.objetivo}` as ClaveI18n) : '—'} destino="/onboarding/objetivo" />
          <Fila titulo={t('ob.resumen.cuerpo')} valor={cuerpo} destino="/onboarding/cuerpo" />
          <Fila titulo={t('ob.resumen.actividad')} valor={estado.actividad ? t(`actividad.${estado.actividad}` as ClaveI18n) : '—'} destino="/onboarding/actividad" />
          <Fila titulo={t('ob.resumen.grasa')} valor={grasa} destino="/onboarding/grasa" />
          <Fila titulo={t('ob.resumen.entrenamiento')} valor={entrenamiento} destino="/onboarding/entrenamiento" />
          <Fila titulo={t('ob.resumen.salud')} valor={salud} destino="/onboarding/salud" />
          <Fila titulo={t('ob.resumen.nutricion')} destino="/onboarding/nutricion">
            {sinRestricciones ? (
              <Texto fuerte>{t('ob.resumen.sinRestricciones')}</Texto>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
                {estado.alergias.map((a) => (
                  <ChipRestriccion key={`al-${a}`} etiqueta={t(`alergeno.${a}` as ClaveI18n)} dureza="dura" />
                ))}
                {estado.intolerancias.map((a) => (
                  <ChipRestriccion key={`in-${a}`} etiqueta={t(`alergeno.${a}` as ClaveI18n)} dureza="dura" />
                ))}
                {estado.patronDietetico.map((d) => (
                  <Chip key={`d-${d}`} etiqueta={t(`dieta.${d}` as ClaveI18n)} seleccionado onPress={() => router.push('/onboarding/nutricion')} />
                ))}
                {estado.noGustaIds.map((id) => (
                  <ChipRestriccion key={`ng-${id}`} etiqueta={t(`alimento.${id}` as ClaveI18n)} dureza="blanda" />
                ))}
              </View>
            )}
          </Fila>
        </Separador>
      </View>
    </PantallaOnboarding>
  )
}

// Fila del resumen: etiqueta, valor (o contenido propio) y enlace para editar ese paso.
function Fila({ titulo, valor, destino, children }: { titulo: string; valor?: string; destino: Href; children?: ReactNode }) {
  const t = useT()
  const router = useRouter()
  const { espaciado } = useTema()
  return (
    <View style={{ gap: espaciado.uno, paddingVertical: espaciado.dos }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Texto variante="etiqueta" tono="secundario">
          {titulo}
        </Texto>
        <BotonTexto texto={t('comun.editar')} onPress={() => router.push(destino)} />
      </View>
      {valor ? <Texto fuerte>{valor}</Texto> : null}
      {children}
    </View>
  )
}

// Pinta líneas finas entre filas sin dibujarlas al final.
function Separador({ children }: { children: ReactNode }) {
  const { colores } = useTema()
  const items = Array.isArray(children) ? children : [children]
  return (
    <View>
      {items.map((hijo, i) => (
        <View key={i} style={i > 0 ? { borderTopWidth: 1, borderTopColor: colores.borde } : undefined}>
          {hijo}
        </View>
      ))}
    </View>
  )
}
