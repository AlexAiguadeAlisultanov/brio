import type { Plan } from '@brio/motor'

// Lista de la compra de la semana. El plan trae las comidas de un día (la plantilla que se
// repite); para la semana se suman las cantidades de cada alimento y se multiplican por los días.
// No hay números del motor aquí, solo suma de gramos ya calculados por el plan.

export interface ItemCompra {
  alimentoId: string
  gramos: number
}

export function listaDeLaCompra(plan: Plan, dias = 7): ItemCompra[] {
  const comidas = plan.comidas ?? []
  const porAlimento = new Map<string, number>()
  for (const comida of comidas) {
    for (const alimento of comida.alimentos) {
      porAlimento.set(alimento.id, (porAlimento.get(alimento.id) ?? 0) + alimento.gramos)
    }
  }
  return [...porAlimento.entries()]
    .map(([alimentoId, gramosDia]) => ({ alimentoId, gramos: Math.round(gramosDia * dias) }))
    .filter((item) => item.gramos > 0)
    .sort((a, b) => b.gramos - a.gramos || a.alimentoId.localeCompare(b.alimentoId))
}
