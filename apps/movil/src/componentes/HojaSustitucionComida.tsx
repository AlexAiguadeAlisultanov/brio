import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { construirSobreComida, type ItemComida, type Macros, type Perfil, type Plan } from '@brio/motor'

import { useAuth } from '@/auth/contexto'
import { nombreAlimento } from '@/datos/nombres'
import type { DurezaRestriccion, Repositorio } from '@/db/repositorio'
import { alternativasComida, deltaFrenteObjetivo, type AlternativaComida, type ObjetivoDia } from '@/dia/logica'
import { adaptarComida } from '@/llm/adaptar'
import { useLocale, useT } from '@/i18n'
import type { ClaveI18n } from '@/i18n/es'
import { useTema } from '@/ui/proveedor'

import { Texto, tocar } from './base'
import { numero } from './formato'
import { HojaInferior } from './HojaInferior'
import { IndicadorOrigen, type Origen } from './IndicadorOrigen'
import { SelectorMotivoCambio, type MotivoOpcion } from './SelectorMotivoCambio'

// Hoja de sustitución de comida. Paso 1: el motivo. "No puedo con esto" (permanente) pregunta el
// tipo y persiste una restricción; "hoy no me apetece" solo afecta a hoy. Paso 2: las
// alternativas. El motor es siempre la red de seguridad y sale al instante; si el usuario activó
// la adaptación con IA, se intenta además una propuesta adaptada que el propio motor revalida
// antes de enseñarla. El indicador de origen dice de dónde viene lo que se muestra (motor, IA o
// respaldo sin conexión). Si el conjunto queda vacío tras las exclusiones, se mantiene el hueco y
// se deriva: nunca se sirve algo que viole una exclusión.

type Paso = 'motivo' | 'tipo' | 'lista'

interface TipoPermanente {
  id: string
  dureza: DurezaRestriccion
  tipoRestriccion: string
}

const TIPOS: Record<string, TipoPermanente> = {
  alergia: { id: 'alergia', dureza: 'dura', tipoRestriccion: 'alergeno' },
  intolerancia: { id: 'intolerancia', dureza: 'dura', tipoRestriccion: 'intolerancia' },
  dieta: { id: 'dieta', dureza: 'blanda', tipoRestriccion: 'dieta' },
  ingrediente: { id: 'ingrediente', dureza: 'blanda', tipoRestriccion: 'no_gusta' },
}

export function HojaSustitucionComida({
  visible,
  onClose,
  plan,
  perfil,
  comidaId,
  repo,
  onAplicada,
}: {
  visible: boolean
  onClose: () => void
  plan: Plan
  perfil: Perfil
  comidaId: string
  repo: Repositorio
  onAplicada: (resultado: { comidaId: string; items: ItemComida[]; macros: Macros }) => void
}) {
  const { colores, espaciado, radios } = useTema()
  const t = useT()
  const { locale } = useLocale()
  const { esPremium } = useAuth()
  const [paso, setPaso] = useState<Paso>('motivo')
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [origen, setOrigen] = useState<Origen>('motor')
  const [adaptada, setAdaptada] = useState<AlternativaComida | null>(null)

  const comida = plan.comidas?.find((c) => c.id === comidaId)
  const objetivo = useMemo<ObjetivoDia>(
    () =>
      comida
        ? { kcal: comida.objetivo.kcal, proteinaG: comida.objetivo.proteinaG, carbosG: comida.objetivo.carbosG, grasaG: comida.objetivo.grasaG }
        : { kcal: 0, proteinaG: 0, carbosG: 0, grasaG: 0 },
    [comida],
  )

  // Alimento principal del hueco (el de más proteína): es lo que se quita al cambiar.
  const principal = useMemo(() => {
    const items = comida?.alimentos ?? []
    return items.reduce<(typeof items)[number] | null>((mejor, a) => (!mejor || a.macros.proteinaG > mejor.macros.proteinaG ? a : mejor), null)
  }, [comida])

  const sobre = useMemo(() => {
    const noGusta = excluirId ? [...perfil.noGustaIds, excluirId] : perfil.noGustaIds
    return construirSobreComida(plan, comidaId, { ...perfil, noGustaIds: noGusta })
  }, [plan, comidaId, perfil, excluirId])

  const alternativas = useMemo(() => {
    if (!comida) return { vacio: true, opciones: [] as AlternativaComida[] }
    return alternativasComida(sobre, objetivo)
  }, [comida, sobre, objetivo])

  // Al llegar a la lista: el motor ya dio sus opciones. Si hay consentimiento de IA, se intenta
  // una adaptación (el motor la revalida dentro de adaptarComida) y se marca el origen real.
  useEffect(() => {
    if (!visible || paso !== 'lista' || !comida || alternativas.vacio) return
    let vivo = true
    void (async () => {
      setAdaptada(null)
      setOrigen('motor')
      // La vía IA es premium: los gratis se quedan con el motor local, que cumple igual todas
      // las restricciones. Sin consentimiento, tampoco se intenta.
      if (!esPremium) return
      let consentimientoLlm = false
      try {
        consentimientoLlm = (await repo.ajustesApp()).consentimientoLlm
      } catch {
        consentimientoLlm = false
      }
      if (!vivo || !consentimientoLlm) return
      const res = await adaptarComida(sobre, { consentimientoLlm: true, idRechazado: principal?.id ?? '' })
      if (!vivo) return
      if (res.origen === 'llm' && !res.sustitucion.vacio && res.sustitucion.items.length > 0) {
        setOrigen('ia')
        setAdaptada({
          id: 'ia',
          items: res.sustitucion.items,
          macros: res.sustitucion.macros,
          delta: deltaFrenteObjetivo(res.sustitucion.macros, objetivo),
          aproximado: res.sustitucion.aproximado,
        })
      } else if (res.origen === 'offline') {
        setOrigen('local')
      }
    })()
    return () => {
      vivo = false
    }
  }, [visible, paso, comida, alternativas.vacio, sobre, objetivo, principal, repo, esPremium])

  const reiniciar = () => {
    setPaso('motivo')
    setExcluirId(null)
    setOrigen('motor')
    setAdaptada(null)
  }

  const cerrar = () => {
    reiniciar()
    onClose()
  }

  const motivos: MotivoOpcion[] = [
    { id: 'noPuedo', titulo: t('motivo.noPuedo'), descripcion: t('motivo.noPuedoDesc'), permanente: true },
    { id: 'hoyNo', titulo: t('motivo.hoyNo'), descripcion: t('motivo.hoyNoDesc') },
  ]

  const tipos: MotivoOpcion[] = (['alergia', 'intolerancia', 'dieta', 'ingrediente'] as const).map((id) => ({
    id,
    titulo: t(`motivoComida.${id}` as ClaveI18n),
    permanente: true,
  }))

  const elegirMotivo = (id: string) => {
    if (id === 'noPuedo') setPaso('tipo')
    else {
      // Puntual: solo afecta a hoy, sin persistir nada.
      setExcluirId(principal?.id ?? null)
      setPaso('lista')
    }
  }

  const elegirTipo = async (tipoId: string) => {
    const tipo = TIPOS[tipoId]
    if (principal && tipo) {
      try {
        await repo.guardarRestriccion({ tipo: tipo.tipoRestriccion, valor: principal.id, dureza: tipo.dureza, origen: 'usuario' })
      } catch {
        // Si el guardado falla no bloqueamos el cambio del día: la restricción se reintenta luego.
      }
    }
    setExcluirId(principal?.id ?? null)
    setPaso('lista')
  }

  const aplicar = (op: AlternativaComida) => {
    tocar('exito')
    onAplicada({ comidaId, items: op.items, macros: op.macros })
    cerrar()
  }

  const etiquetaOpcion = (op: AlternativaComida): string => op.items.map((i) => nombreAlimento(i.id, locale)).join(' + ')

  const deltaTexto = (op: AlternativaComida): string => {
    const partes: string[] = []
    const d = op.delta
    partes.push(d.kcal === 0 ? t('sust.igualKcal') : `${d.kcal > 0 ? '+' : '-'}${numero(Math.abs(d.kcal), locale)} ${t('comun.kcal')}`)
    if (Math.abs(d.proteinaG) >= 1) {
      partes.push(`${d.proteinaG > 0 ? '+' : '-'}${numero(Math.abs(d.proteinaG), locale)} ${t('comun.gramos')} ${t('macro.proteina').charAt(0)}`)
    }
    return partes.join(' · ')
  }

  // La propuesta de la IA va primero, marcada; detrás, las del motor.
  const opciones = adaptada ? [adaptada, ...alternativas.opciones] : alternativas.opciones

  return (
    <HojaInferior visible={visible} onClose={cerrar} titulo={paso === 'motivo' ? t('motivo.titulo') : t('sust.comidaTitulo')}>
      <View style={{ gap: espaciado.dos, paddingBottom: espaciado.dos }}>
        {paso === 'motivo' ? <SelectorMotivoCambio opciones={motivos} onElegir={elegirMotivo} /> : null}
        {paso === 'tipo' ? <SelectorMotivoCambio opciones={tipos} onElegir={(id) => void elegirTipo(id)} /> : null}

        {paso === 'lista' ? (
          alternativas.vacio ? (
            <View style={{ gap: espaciado.uno }}>
              <Texto variante="seccion" fuerte>
                {t('sust.vacioComidaTitulo')}
              </Texto>
              <Texto tono="secundario">{t('sust.vacioComidaTexto')}</Texto>
            </View>
          ) : (
            <View style={{ gap: espaciado.uno }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Texto variante="etiqueta" tono="secundario">
                  {t('sust.elige')}
                </Texto>
                <IndicadorOrigen origen={origen} />
              </View>
              {origen === 'local' ? (
                <Texto variante="etiqueta" tono="secundario">
                  {t('origen.localNota')}
                </Texto>
              ) : null}
              {opciones.map((op) => {
                const esIa = op.id === 'ia'
                return (
                  <Pressable
                    key={op.id}
                    accessibilityRole="button"
                    onPress={() => aplicar(op)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: espaciado.dos,
                      padding: espaciado.dos,
                      borderRadius: radios.m,
                      borderWidth: 1,
                      borderColor: esIa ? colores.acento : colores.borde,
                      backgroundColor: colores.tarjeta,
                    }}>
                    <View style={{ flex: 1, gap: espaciado.media }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaciado.media }}>
                        {esIa ? <Sparkles size={15} color={colores.acentoContraste} strokeWidth={2} /> : null}
                        <Texto fuerte>{etiquetaOpcion(op)}</Texto>
                      </View>
                      <Texto variante="etiqueta" tono="secundario" numerico>
                        {deltaTexto(op)}
                      </Texto>
                    </View>
                    {op.aproximado ? (
                      <View style={{ paddingVertical: 2, paddingHorizontal: espaciado.uno, borderRadius: radios.s, backgroundColor: colores.precaucion + '1F' }}>
                        <Texto variante="pie" fuerte style={{ color: colores.precaucion }}>
                          {t('sust.aproximado')}
                        </Texto>
                      </View>
                    ) : null}
                  </Pressable>
                )
              })}
            </View>
          )
        ) : null}
      </View>
    </HojaInferior>
  )
}
