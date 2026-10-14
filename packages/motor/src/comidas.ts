import type { Alimento } from './datos/alimentos'
import { alimentosValidos, macrosDeAlimento } from './sustitucion'
import type { AlimentoEnComida, ComidaPlan, Macros, Perfil } from './tipos'

// Reparto del total diario en huecos y selección de alimentos válidos para cada uno. El
// motor propone un punto de partida coherente; el ajuste fino lo hace el LLM dentro del sobre.

const MOMENTOS: Record<number, string[]> = {
  3: ['Desayuno', 'Comida', 'Cena'],
  4: ['Desayuno', 'Comida', 'Merienda', 'Cena'],
  5: ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena'],
  6: ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena', 'Recena'],
}

const PORCENTAJES: Record<number, number[]> = {
  3: [30, 40, 30],
  4: [25, 35, 25, 15],
  5: [25, 30, 20, 15, 10],
  6: [20, 25, 20, 15, 10, 10],
}

export function clampComidas(n: number): number {
  if (!Number.isFinite(n)) return 3
  return Math.min(Math.max(Math.round(n), 3), 6)
}

// Porcentaje del total diario por hueco. Siempre suma 100.
export function porcentajesPorComida(n: number): number[] {
  const nn = clampComidas(n)
  return PORCENTAJES[nn] ?? PORCENTAJES[3]!
}

function momentos(n: number): string[] {
  return MOMENTOS[clampComidas(n)] ?? MOMENTOS[3]!
}

// Reparte un total de macros en `n` huecos de forma que la suma por hueco reconstruye el
// total exacto (el último hueco absorbe el resto del redondeo).
function repartirMacros(total: Macros, porcentajes: number[]): Macros[] {
  const campos: Array<keyof Macros> = ['kcal', 'proteinaG', 'grasaG', 'carbosG', 'fibraG']
  const salida: Macros[] = porcentajes.map(() => ({ kcal: 0, proteinaG: 0, grasaG: 0, carbosG: 0, fibraG: 0 }))
  for (const campo of campos) {
    let acumulado = 0
    for (let i = 0; i < porcentajes.length; i++) {
      const esUltimo = i === porcentajes.length - 1
      const valor = esUltimo ? total[campo] - acumulado : Math.round((total[campo] * (porcentajes[i] ?? 0)) / 100)
      salida[i]![campo] = Math.max(0, valor)
      acumulado += valor
    }
  }
  return salida
}

function clampGramos(g: number): number {
  if (!Number.isFinite(g) || g <= 0) return 0
  return Math.min(Math.max(Math.round(g / 5) * 5, 0), 400)
}

// Selecciona una combinación sencilla y determinista para aproximar el hueco: una fuente de
// proteína, una de carbohidrato y una verdura, siempre entre los alimentos válidos.
function elegirAlimentos(objetivo: Macros, validos: Alimento[]): AlimentoEnComida[] {
  if (validos.length === 0) return []
  const items: AlimentoEnComida[] = []
  const usados = new Set<string>()

  const prote = [...validos].sort((a, b) => b.proteinaG - a.proteinaG || a.id.localeCompare(b.id))[0]
  if (prote && objetivo.proteinaG > 0 && prote.proteinaG > 0) {
    const g = clampGramos((objetivo.proteinaG / prote.proteinaG) * 100)
    if (g >= 15) {
      items.push({ id: prote.id, gramos: g, macros: macrosDeAlimento(prote, g) })
      usados.add(prote.id)
    }
  }

  const carbo = [...validos].sort((a, b) => b.carbosG - a.carbosG || a.id.localeCompare(b.id)).find((a) => !usados.has(a.id))
  if (carbo && carbo.carbosG > 0) {
    const yaCarbos = items.reduce((s, i) => s + i.macros.carbosG, 0)
    const rem = Math.max(0, objetivo.carbosG - yaCarbos)
    const g = clampGramos((rem / carbo.carbosG) * 100)
    if (g >= 15) {
      items.push({ id: carbo.id, gramos: g, macros: macrosDeAlimento(carbo, g) })
      usados.add(carbo.id)
    }
  }

  const verdura = validos.find((a) => a.categoria === 'verdura' && !usados.has(a.id))
  if (verdura) {
    const g = 100
    items.push({ id: verdura.id, gramos: g, macros: macrosDeAlimento(verdura, g) })
    usados.add(verdura.id)
  }

  // Si nada encajó (p. ej. objetivos minúsculos), al menos deja un alimento válido.
  if (items.length === 0 && validos[0]) {
    const al = validos[0]
    items.push({ id: al.id, gramos: 50, macros: macrosDeAlimento(al, 50) })
  }
  return items
}

export function construirComidas(perfil: Perfil, total: Macros): ComidaPlan[] {
  const n = clampComidas(perfil.comidasPorDia)
  const pct = porcentajesPorComida(n)
  const etiquetas = momentos(n)
  const objetivos = repartirMacros(total, pct)

  const excluidos = [...perfil.alergias, ...perfil.intolerancias]
  let validos = alimentosValidos(excluidos, perfil.patronDietetico, perfil.noGustaIds)
  if (validos.length === 0) validos = alimentosValidos(excluidos, perfil.patronDietetico, perfil.noGustaIds, true)

  const comidas: ComidaPlan[] = []
  for (let i = 0; i < n; i++) {
    const objetivo = objetivos[i] ?? { kcal: 0, proteinaG: 0, grasaG: 0, carbosG: 0, fibraG: 0 }
    comidas.push({
      id: `comida_${i + 1}`,
      momento: etiquetas[i] ?? `Comida ${i + 1}`,
      porcentaje: pct[i] ?? 0,
      objetivo,
      alimentos: elegirAlimentos(objetivo, validos),
    })
  }
  return comidas
}
