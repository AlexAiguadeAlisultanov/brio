import { ALIMENTOS, alimentoPorId, type Alimento } from './datos/alimentos'
import { EJERCICIOS, ejercicioPorId, type Ejercicio } from './datos/ejercicios'
import type {
  Alergeno,
  Equipo,
  Macros,
  MotivoValidacion,
  PatronDietetico,
  PropuestaComida,
  PropuestaEjercicio,
  Rango,
  ResultadoValidacion,
  SobreComida,
  SobreEjercicio,
  SustitucionComida,
  SustitucionEjercicio,
  Zona,
} from './tipos'

// Respaldo determinista cuando el LLM no está disponible o su propuesta no valida, más los
// validadores que revisan cualquier propuesta contra el mismo sobre. Las exclusiones duras
// (alérgeno, intolerancia, dieta, equipo, lesión, modalidad vetada) son sagradas: ninguna
// rama devuelve jamás un item que las viole.

const GRAMOS_MIN = 15
const GRAMOS_MAX = 500

// --- Filtros de exclusión (compartidos con comidas.ts y sobre.ts) ---

export function alimentoViolaDura(al: Alimento, excluidos: Alergeno[], dietas: PatronDietetico[]): boolean {
  if (al.obsoleto) return true
  if (al.alergenos.some((a) => excluidos.includes(a))) return true
  // La dieta es una conjunción: el alimento debe cumplir TODAS las dietas declaradas.
  if (!dietas.every((d) => al.dietas.includes(d))) return true
  return false
}

// Alimentos del catálogo válidos para un conjunto de exclusiones. Los `noGusta` son blandos:
// se dejan fuera salvo que `incluirNoGusta` sea true (último recurso para no dejar el hueco).
export function alimentosValidos(
  excluidos: Alergeno[],
  dietas: PatronDietetico[],
  noGustaIds: string[],
  incluirNoGusta = false,
): Alimento[] {
  return ALIMENTOS.filter((al) => {
    if (alimentoViolaDura(al, excluidos, dietas)) return false
    if (!incluirNoGusta && noGustaIds.includes(al.id)) return false
    return true
  })
}

export function ejercicioViolaDura(
  ej: Ejercicio,
  equipoDisponible: Equipo[],
  contraindicados: Zona[],
  modalidadesVetadas: SobreEjercicio['modalidadesVetadas'],
): boolean {
  if (ej.obsoleto) return true
  if (!ej.equipo.some((e) => equipoDisponible.includes(e))) return true
  if (ej.contraindica.some((z) => contraindicados.includes(z))) return true
  if (ej.modalidades.some((m) => modalidadesVetadas.includes(m))) return true
  return false
}

// --- Utilidades de macros ---

export function macrosDeAlimento(al: Alimento, gramos: number): Macros {
  const f = gramos / 100
  return {
    kcal: Math.round(al.kcal * f),
    proteinaG: Math.round(al.proteinaG * f),
    grasaG: Math.round(al.grasaG * f),
    carbosG: Math.round(al.carbosG * f),
    fibraG: Math.round(al.fibraG * f),
  }
}

function sumarMacros(lista: Macros[]): Macros {
  return lista.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteinaG: acc.proteinaG + m.proteinaG,
      grasaG: acc.grasaG + m.grasaG,
      carbosG: acc.carbosG + m.carbosG,
      fibraG: acc.fibraG + m.fibraG,
    }),
    { kcal: 0, proteinaG: 0, grasaG: 0, carbosG: 0, fibraG: 0 },
  )
}

function centro(r: Rango): number {
  return (r.min + r.max) / 2
}

interface CentroComida {
  kcal: number
  proteinaG: number
  carbosG: number
  grasaG: number
}

function centroComida(sobre: SobreComida): CentroComida {
  return {
    kcal: centro(sobre.kcal),
    proteinaG: centro(sobre.proteinaG),
    carbosG: centro(sobre.carbosG),
    grasaG: centro(sobre.grasaG),
  }
}

function dentroRango(v: number, r: Rango): boolean {
  return v >= r.min && v <= r.max
}

function comidaEnRango(m: Macros, sobre: SobreComida): boolean {
  return (
    dentroRango(m.kcal, sobre.kcal) &&
    dentroRango(m.proteinaG, sobre.proteinaG) &&
    dentroRango(m.carbosG, sobre.carbosG) &&
    dentroRango(m.grasaG, sobre.grasaG)
  )
}

function clampGramos(g: number): number {
  if (!Number.isFinite(g) || g <= 0) return GRAMOS_MIN
  return Math.min(Math.max(Math.round(g / 5) * 5, GRAMOS_MIN), GRAMOS_MAX)
}

// Factor de escala óptimo (mínimos cuadrados normalizados) para acercar un alimento al centro.
function gramosOptimos(al: Alimento, c: CentroComida): number {
  const pares: Array<[number, number]> = [
    [al.kcal, c.kcal],
    [al.proteinaG, c.proteinaG],
    [al.carbosG, c.carbosG],
    [al.grasaG, c.grasaG],
  ]
  let num = 0
  let den = 0
  for (const [por100, objetivo] of pares) {
    if (objetivo > 0 && por100 > 0) {
      const r = por100 / objetivo
      num += r
      den += r * r
    }
  }
  if (den === 0) return GRAMOS_MIN
  const f = num / den // g = f * 100
  return clampGramos(f * 100)
}

function errorComida(m: Macros, c: CentroComida): number {
  const term = (v: number, o: number) => (o > 0 ? ((v - o) / o) ** 2 : 0)
  return term(m.kcal, c.kcal) + term(m.proteinaG, c.proteinaG) + term(m.carbosG, c.carbosG) + term(m.grasaG, c.grasaG)
}

function deltaComida(m: Macros, c: CentroComida) {
  return {
    kcalPct: c.kcal > 0 ? (m.kcal - c.kcal) / c.kcal : 0,
    proteinaG: m.proteinaG - c.proteinaG,
    carbosG: m.carbosG - c.carbosG,
    grasaG: m.grasaG - c.grasaG,
  }
}

function vacioComida(): SustitucionComida {
  return {
    vacio: true,
    items: [],
    macros: { kcal: 0, proteinaG: 0, grasaG: 0, carbosG: 0, fibraG: 0 },
    aproximado: false,
    mensajeId: 'sin_candidatos',
    derivar: true,
  }
}

interface ItemElegido {
  al: Alimento
  gramos: number
  macros: Macros
}

function armarComida(items: ItemElegido[], c: CentroComida, aproximado: boolean): SustitucionComida {
  const macros = sumarMacros(items.map((i) => i.macros))
  const salida: SustitucionComida = {
    vacio: false,
    items: items.map((i) => ({ id: i.al.id, gramos: i.gramos, macros: i.macros })),
    macros,
    aproximado,
  }
  if (aproximado) salida.delta = deltaComida(macros, c)
  return salida
}

// Candidatos duros-válidos, con `noGusta` como preferencia blanda (se incluyen solo si hace
// falta para no dejar el hueco vacío). Siempre se reaplican los filtros duros, aunque el
// sobre ya traiga candidatos, como defensa en profundidad.
function poolComida(sobre: SobreComida): Alimento[] {
  const base = sobre.candidatos.length > 0 ? sobre.candidatos : ALIMENTOS.map((a) => a.id)
  const resolver = (incluirNoGusta: boolean): Alimento[] => {
    const salida: Alimento[] = []
    for (const id of base) {
      const al = alimentoPorId(id)
      if (!al) continue
      if (alimentoViolaDura(al, sobre.excluidos, sobre.dieta)) continue
      if (!incluirNoGusta && sobre.noGustaIds.includes(al.id)) continue
      salida.push(al)
    }
    return salida
  }
  const sinNoGusta = resolver(false)
  return sinNoGusta.length > 0 ? sinNoGusta : resolver(true)
}

export function sustituirComidaDeterminista(sobre: SobreComida): SustitucionComida {
  const pool = poolComida(sobre)
  if (pool.length === 0) return vacioComida()

  const c = centroComida(sobre)

  // 1. Mejor opción de un solo alimento.
  let mejor: ItemElegido | null = null
  let mejorError = Infinity
  for (const al of pool) {
    const gramos = gramosOptimos(al, c)
    const macros = macrosDeAlimento(al, gramos)
    if (comidaEnRango(macros, sobre)) return armarComida([{ al, gramos, macros }], c, false)
    const e = errorComida(macros, c)
    if (e < mejorError) {
      mejorError = e
      mejor = { al, gramos, macros }
    }
  }

  // 2. Combinación de dos alimentos (proteína dominante + fuente de energía).
  const combo = buscarCombo(pool, sobre, c)
  if (combo) return armarComida(combo, c, false)

  // 3. Mejor aproximación, marcada con su delta. Nunca se disfraza de dentro de rango.
  if (mejor) return armarComida([mejor], c, true)
  return vacioComida()
}

function buscarCombo(pool: Alimento[], sobre: SobreComida, c: CentroComida): ItemElegido[] | null {
  const porProteina = [...pool].sort((a, b) => b.proteinaG - a.proteinaG || a.id.localeCompare(b.id)).slice(0, 6)
  const porEnergia = [...pool]
    .sort((a, b) => b.carbosG + b.grasaG - (a.carbosG + a.grasaG) || a.id.localeCompare(b.id))
    .slice(0, 8)

  for (const p of porProteina) {
    const g1 = p.proteinaG > 0 ? clampGramos((c.proteinaG / p.proteinaG) * 100) : gramosOptimos(p, c)
    const m1 = macrosDeAlimento(p, g1)
    const remCarbos = c.carbosG - m1.carbosG
    const remKcal = c.kcal - m1.kcal
    for (const s of porEnergia) {
      if (s.id === p.id) continue
      let g2: number
      if (remCarbos > 0 && s.carbosG > 0) g2 = clampGramos((remCarbos / s.carbosG) * 100)
      else if (remKcal > 0 && s.kcal > 0) g2 = clampGramos((remKcal / s.kcal) * 100)
      else continue
      const m2 = macrosDeAlimento(s, g2)
      const total = sumarMacros([m1, m2])
      if (comidaEnRango(total, sobre)) {
        return [
          { al: p, gramos: g1, macros: m1 },
          { al: s, gramos: g2, macros: m2 },
        ]
      }
    }
  }
  return null
}

// --- Sustitución de ejercicio ---

function poolEjercicio(sobre: SobreEjercicio): Ejercicio[] {
  const base = sobre.candidatos.length > 0 ? sobre.candidatos : EJERCICIOS.map((e) => e.id)
  const salida: Ejercicio[] = []
  for (const id of base) {
    const ej = ejercicioPorId(id)
    if (!ej) continue
    if (ejercicioViolaDura(ej, sobre.equipoDisponible, sobre.contraindicados, sobre.modalidadesVetadas)) continue
    salida.push(ej)
  }
  return salida
}

export function sustituirEjercicioDeterminista(sobre: SobreEjercicio): SustitucionEjercicio {
  const pool = poolEjercicio(sobre)
  if (pool.length === 0) {
    return { vacio: true, aproximado: false, mensajeId: 'sin_candidatos', derivar: true }
  }
  // Prioridad: mismo patrón y grupo; si no hay, al menos el mismo grupo.
  const exacto = pool.find((e) => e.grupo === sobre.grupo && e.patron === sobre.patron)
  const mismoGrupo = pool.find((e) => e.grupo === sobre.grupo)
  const elegido = exacto ?? mismoGrupo ?? pool[0]
  if (!elegido) return { vacio: true, aproximado: false, mensajeId: 'sin_candidatos', derivar: true }

  const seriesCentro = Math.round(centro(sobre.series))
  const series = Math.min(Math.max(seriesCentro, sobre.series.min), sobre.series.max)
  const aproximado = !exacto // si cambia el patrón, se avisa de que es aproximado
  return { vacio: false, ejercicioId: elegido.id, series, reps: sobre.reps, rir: sobre.rir, aproximado }
}

// --- Validadores de propuestas del LLM ---

export function validarSustitucionComida(sobre: SobreComida, prop: PropuestaComida): ResultadoValidacion {
  const motivos: MotivoValidacion[] = []
  if (!prop.items || prop.items.length === 0) {
    return { ok: false, motivos: ['propuesta_vacia'] }
  }

  const parciales: Macros[] = []
  for (const item of prop.items) {
    const al = alimentoPorId(item.id)
    if (!al || al.obsoleto) {
      if (!motivos.includes('id_desconocido')) motivos.push('id_desconocido')
      continue
    }
    if (al.alergenos.some((a) => sobre.excluidos.includes(a))) {
      if (!motivos.includes('alergeno')) motivos.push('alergeno')
    }
    if (!sobre.dieta.every((d) => al.dietas.includes(d))) {
      if (!motivos.includes('dieta')) motivos.push('dieta')
    }
    const gramos = Number.isFinite(item.gramos) ? Math.max(0, item.gramos) : 0
    parciales.push(macrosDeAlimento(al, gramos))
  }

  const total = sumarMacros(parciales)
  if (!dentroRango(total.kcal, sobre.kcal)) motivos.push('fuera_rango_kcal')
  if (!dentroRango(total.proteinaG, sobre.proteinaG)) motivos.push('fuera_rango_proteina')
  if (!dentroRango(total.carbosG, sobre.carbosG)) motivos.push('fuera_rango_carbos')
  if (!dentroRango(total.grasaG, sobre.grasaG)) motivos.push('fuera_rango_grasa')

  return { ok: motivos.length === 0, motivos }
}

export function validarSustitucionEjercicio(sobre: SobreEjercicio, prop: PropuestaEjercicio): ResultadoValidacion {
  const motivos: MotivoValidacion[] = []
  const ej = ejercicioPorId(prop.ejercicioId)
  if (!ej || ej.obsoleto) return { ok: false, motivos: ['id_desconocido'] }

  if (ej.grupo !== sobre.grupo) motivos.push('grupo_distinto')
  if (ej.patron !== sobre.patron) motivos.push('patron_distinto')
  if (!ej.equipo.some((e) => sobre.equipoDisponible.includes(e))) motivos.push('equipo_no_disponible')
  if (ej.contraindica.some((z) => sobre.contraindicados.includes(z))) motivos.push('zona_contraindicada')
  if (ej.modalidades.some((m) => sobre.modalidadesVetadas.includes(m))) motivos.push('modalidad_vetada')
  if (!dentroRango(prop.series, sobre.series)) motivos.push('fuera_rango_series')
  if (!dentroRango(prop.reps, sobre.reps)) motivos.push('fuera_rango_reps')

  return { ok: motivos.length === 0, motivos }
}
