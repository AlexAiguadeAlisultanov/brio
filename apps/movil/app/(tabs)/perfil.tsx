import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, Switch, View } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import { VERSION_MOTOR, generarPlan, type Objetivo, type Perfil } from '@brio/motor'

import {
  AvisoMedico,
  BotonTexto,
  ChipRestriccion,
  ControlSegmentado,
  EstadoVacio,
  HojaInferior,
  PantallaScroll,
  Texto,
  numero,
  tocar,
  type OpcionSegmento,
} from '@/componentes'
import type { AjustesApp, RestriccionGuardada, Unidades } from '@/db/repositorio'
import { AJUSTES_APP_POR_DEFECTO } from '@/db/repositorio'
import { useRepositorio } from '@/db/provider'
import { useLocale, useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import type { Locale } from '@brio/motor'
import { useTema } from '@/ui/proveedor'

// Perfil y ajustes: datos del cuerpo, objetivo (al cambiarlo se recalcula el plan), lo que
// cuidamos (alergias y zonas, siempre a la vista), idioma, unidades, suscripción (maqueta),
// consentimiento de IA (opt-in, apagado de serie) y borrar todos mis datos. El aviso médico vive
// al final, permanente. Ninguna cifra se recalcula aquí: el objetivo nuevo lo resuelve el motor.

const OBJETIVOS: Objetivo[] = ['ganar_musculo', 'perder_grasa', 'mantenimiento', 'fuerza']

export default function Perfil() {
  const repo = useRepositorio()
  const router = useRouter()
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  const { locale, cambiarLocale } = useLocale()

  const [cargando, setCargando] = useState(true)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null)
  const [ajustes, setAjustes] = useState<AjustesApp>(AJUSTES_APP_POR_DEFECTO)
  const [duras, setDuras] = useState<RestriccionGuardada[]>([])
  const [mensajeObjetivo, setMensajeObjetivo] = useState('')
  const [borrarAbierto, setBorrarAbierto] = useState(false)

  const cargar = useCallback(async () => {
    const [perf, obj, aj, rest] = await Promise.all([repo.cargarPerfil(), repo.cargarObjetivo(), repo.ajustesApp(), repo.restriccionesDuras()])
    setPerfil(perf)
    setObjetivo(obj)
    setAjustes(aj)
    setDuras(rest)
    setCargando(false)
  }, [repo])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar]),
  )

  const cambiarObjetivo = async (nuevo: Objetivo) => {
    if (!perfil || nuevo === objetivo) return
    tocar()
    setObjetivo(nuevo)
    const plan = generarPlan(perfil, nuevo)
    await repo.guardarObjetivo(nuevo)
    await repo.guardarPlan(plan)
    setMensajeObjetivo(t('perfil.objetivo.recalculado'))
  }

  const cambiarIdioma = async (l: Locale) => {
    cambiarLocale(l)
    setAjustes((a) => ({ ...a, locale: l }))
    await repo.guardarAjustesApp({ locale: l })
  }

  const cambiarUnidades = async (u: Unidades) => {
    setAjustes((a) => ({ ...a, unidades: u }))
    await repo.guardarAjustesApp({ unidades: u })
  }

  const cambiarConsentimiento = async (valor: boolean) => {
    tocar()
    setAjustes((a) => ({ ...a, consentimientoLlm: valor }))
    await repo.guardarAjustesApp({ consentimientoLlm: valor })
  }

  const borrarTodo = async () => {
    setBorrarAbierto(false)
    await repo.borrarTodosMisDatos()
    router.replace('/onboarding/bienvenida')
  }

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator color={colores.acento} />
      </View>
    )
  }

  if (!perfil) {
    return (
      <EstadoVacio
        titulo={t('hoy.sinPlanTitulo')}
        texto={t('hoy.sinPlanTexto')}
        accion={{ texto: t('hoy.sinPlanBoton'), onPress: () => router.replace('/onboarding/bienvenida') }}
      />
    )
  }

  const objetivoOpciones: OpcionSegmento<Objetivo>[] = OBJETIVOS.map((o) => ({ valor: o, etiqueta: t(`objetivo.${o}` as ClaveI18n) }))
  const idiomaOpciones: OpcionSegmento<Locale>[] = (['es', 'ca', 'en'] as const).map((l) => ({ valor: l, etiqueta: t(`idioma.${l}` as ClaveI18n) }))
  const unidadesOpciones: OpcionSegmento<Unidades>[] = (['metrico', 'imperial'] as const).map((u) => ({ valor: u, etiqueta: t(`unidades.${u}` as ClaveI18n) }))

  const restricciones = etiquetasDuras(perfil, duras, t)

  return (
    <PantallaScroll titulo={t('perfil.titulo')} onRefresh={cargar}>
      {/* Datos del cuerpo. */}
      <Seccion titulo={t('perfil.cuerpo.titulo')}>
        <View style={{ padding: espaciado.dos, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.uno }}>
          <FilaDato etiqueta={t('ob.cuerpo.sexo')} valor={t(`sexo.${perfil.sexo}` as ClaveI18n)} />
          <FilaDato etiqueta={t('ob.cuerpo.edad')} valor={`${numero(perfil.edadAnios, locale)} ${t('comun.anios')}`} />
          <FilaDato etiqueta={t('ob.cuerpo.altura')} valor={`${numero(perfil.alturaCm, locale)} ${t('comun.cm')}`} />
          <FilaDato etiqueta={t('ob.cuerpo.peso')} valor={`${numero(perfil.pesoKg, locale)} ${t('comun.kg')}`} />
        </View>
        <BotonTexto texto={t('perfil.cuerpo.rehacer')} onPress={() => router.replace('/onboarding/bienvenida')} />
      </Seccion>

      {/* Objetivo. */}
      <Seccion titulo={t('perfil.objetivo.titulo')} apoyo={t('perfil.objetivo.apoyo')}>
        <ControlSegmentado opciones={objetivoOpciones} valor={objetivo ?? undefined} onChange={(o) => void cambiarObjetivo(o)} />
        {mensajeObjetivo ? (
          <Texto variante="etiqueta" tono="exito">
            {mensajeObjetivo}
          </Texto>
        ) : null}
      </Seccion>

      {/* Lo que cuidamos: alergias y zonas, siempre visibles. */}
      <Seccion titulo={t('perfil.restricciones.titulo')} apoyo={t('perfil.restricciones.apoyo')}>
        {restricciones.length === 0 ? (
          <Texto tono="secundario">{t('perfil.restricciones.vacio')}</Texto>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.uno }}>
            {restricciones.map((etiqueta) => (
              <ChipRestriccion key={etiqueta} etiqueta={etiqueta} dureza="dura" />
            ))}
          </View>
        )}
      </Seccion>

      {/* Idioma. */}
      <Seccion titulo={t('perfil.idioma.titulo')}>
        <ControlSegmentado opciones={idiomaOpciones} valor={locale} onChange={(l) => void cambiarIdioma(l)} />
      </Seccion>

      {/* Unidades. */}
      <Seccion titulo={t('perfil.unidades.titulo')}>
        <ControlSegmentado opciones={unidadesOpciones} valor={ajustes.unidades} onChange={(u) => void cambiarUnidades(u)} />
      </Seccion>

      {/* Suscripción (maqueta). */}
      <Seccion titulo={t('perfil.suscripcion.titulo')}>
        <View style={{ padding: espaciado.dos, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.media }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Texto fuerte>{t('perfil.suscripcion.plan')}</Texto>
            <View style={{ paddingVertical: 2, paddingHorizontal: espaciado.uno, borderRadius: radios.s, backgroundColor: colores.acento + '24' }}>
              <Texto variante="pie" fuerte style={{ color: colores.acentoContraste }}>
                {t('comun.hecho')}
              </Texto>
            </View>
          </View>
          <Texto variante="etiqueta" tono="secundario">
            {t('perfil.suscripcion.planApoyo')}
          </Texto>
        </View>
        <View style={{ padding: espaciado.dos, borderRadius: radios.l, borderWidth: 1, borderColor: colores.borde, gap: espaciado.media }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Texto fuerte>{t('perfil.suscripcion.pro')}</Texto>
            <Texto variante="pie" tono="secundario">
              {t('perfil.suscripcion.proximamente')}
            </Texto>
          </View>
          <Texto variante="etiqueta" tono="secundario">
            {t('perfil.suscripcion.proApoyo')}
          </Texto>
        </View>
      </Seccion>

      {/* Consentimiento de IA: opt-in, apagado de serie. */}
      <Seccion titulo={t('perfil.ia.titulo')}>
        <View style={{ padding: espaciado.dos, borderRadius: radios.l, backgroundColor: colores.tarjeta, gap: espaciado.uno }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.dos }}>
            <Texto fuerte style={{ flex: 1 }}>
              {ajustes.consentimientoLlm ? t('perfil.ia.activado') : t('perfil.ia.desactivado')}
            </Texto>
            <Switch
              value={ajustes.consentimientoLlm}
              onValueChange={(v) => void cambiarConsentimiento(v)}
              trackColor={{ false: colores.borde, true: colores.acento }}
              thumbColor={colores.texto}
              ios_backgroundColor={colores.borde}
            />
          </View>
          <Texto variante="etiqueta" tono="secundario">
            {t('perfil.ia.apoyo')}
          </Texto>
        </View>
      </Seccion>

      {/* Borrar todos mis datos y cerrar sesión. */}
      <Seccion titulo={t('perfil.borrar.titulo')} apoyo={t('perfil.borrar.apoyo')}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            tocar()
            setBorrarAbierto(true)
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: espaciado.uno,
            minHeight: 52,
            borderRadius: radios.m,
            borderWidth: 1,
            borderColor: colores.bloqueo,
          }}>
          <Trash2 size={20} color={colores.bloqueo} strokeWidth={2} />
          <Texto fuerte style={{ color: colores.bloqueo }}>
            {t('perfil.borrar.titulo')}
          </Texto>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <BotonTexto texto={t('perfil.cerrarSesion')} onPress={() => router.replace('/onboarding/bienvenida')} />
        </View>
      </Seccion>

      {/* Aviso médico permanente. */}
      <AvisoMedico rotulo={t('perfil.avisoRotulo')} texto={t('ob.bienvenida.avisoTexto')} />

      <Texto variante="pie" tono="secundario" centrado>
        {t('perfil.motor').replace('{v}', VERSION_MOTOR)}
      </Texto>

      <HojaInferior visible={borrarAbierto} onClose={() => setBorrarAbierto(false)} titulo={t('perfil.borrar.confirmarTitulo')}>
        <View style={{ gap: espaciado.dos, paddingBottom: espaciado.dos }}>
          <Texto tono="secundario">{t('perfil.borrar.confirmarTexto')}</Texto>
          <Pressable
            accessibilityRole="button"
            onPress={() => void borrarTodo()}
            style={{
              minHeight: 52,
              borderRadius: radios.m,
              backgroundColor: colores.bloqueo,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: espaciado.uno,
            }}>
            <Trash2 size={20} color={colores.sobreAcento} strokeWidth={2} />
            <Texto fuerte style={{ color: colores.sobreAcento }}>
              {t('perfil.borrar.confirmar')}
            </Texto>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <BotonTexto texto={t('comun.cancelar')} onPress={() => setBorrarAbierto(false)} />
          </View>
        </View>
      </HojaInferior>
    </PantallaScroll>
  )
}

function Seccion({ titulo, apoyo, children }: { titulo: string; apoyo?: string; children: ReactNode }) {
  const { espaciado } = useTema()
  return (
    <View style={{ gap: espaciado.dos }}>
      <View style={{ gap: espaciado.media }}>
        <Texto variante="seccion" fuerte>
          {titulo}
        </Texto>
        {apoyo ? (
          <Texto variante="etiqueta" tono="secundario">
            {apoyo}
          </Texto>
        ) : null}
      </View>
      {children}
    </View>
  )
}

function FilaDato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const { espaciado } = useTema()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: espaciado.media }}>
      <Texto tono="secundario">{etiqueta}</Texto>
      <Texto fuerte numerico>
        {valor}
      </Texto>
    </View>
  )
}

// Reúne las restricciones duras para los chips: alergias, intolerancias y lesiones del perfil,
// más las que el usuario fue guardando desde las hojas de sustitución. Sin repetir etiquetas.
function etiquetasDuras(perfil: Perfil, duras: RestriccionGuardada[], t: (c: ClaveI18n) => string): string[] {
  const set = new Set<string>()
  for (const a of perfil.alergias) set.add(t(`alergeno.${a}` as ClaveI18n))
  for (const i of perfil.intolerancias) set.add(t(`alergeno.${i}` as ClaveI18n))
  for (const z of perfil.lesiones) set.add(t(`zona.${z}` as ClaveI18n))
  for (const r of duras) {
    const clave =
      r.tipo === 'lesion'
        ? `zona.${r.valor}`
        : r.tipo === 'alergeno' || r.tipo === 'intolerancia'
          ? `alergeno.${r.valor}`
          : r.tipo === 'equipo'
            ? `equipo.${r.valor}`
            : r.tipo === 'dieta'
              ? `dieta.${r.valor}`
              : null
    if (clave) set.add(t(clave as ClaveI18n))
  }
  return [...set]
}
