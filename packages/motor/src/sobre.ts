import { type Alimento } from './datos/alimentos'
import { EJERCICIOS } from './datos/ejercicios'
import { alimentosValidos, ejercicioViolaDura } from './sustitucion'
import type { EjercicioPlan, Locale, Macros, Perfil, Plan, Rango, SobreComida, SobreEjercicio } from './tipos'

// Construye el sobre de restricciones: límites numéricos cerrados, exclusiones y candidatos
// del catálogo que YA encajan, ordenados por cercanía. Es el único contrato que ve el LLM;
// nunca recibe el perfil crudo ni cifras fuera de rango.

const LOCALE_POR_DEFECTO: Locale = 'es'

// Banda alrededor de un valor objetivo. kcal ±8% (coherente con la sustitución); los macros
// con algo más de holgura para que exista combinación viable sin violar exclusiones.
function banda(valor: number, fraccion: number, anchoMin = 0): Rango {
  const v = Math.max(0, valor)
  const min = Math.max(0, Math.round(v * (1 - fraccion)))
  const max = Math.max(Math.round(v * (1 + fraccion)), min + anchoMin)
  return { min, max }
}

function distanciaMacros(al: Alimento, objetivo: Macros): number {
  // Distancia por 100 g al objetivo, con la proteína pesando más que carbos y grasa.
  const norm = (a: number, b: number) => (b > 0 ? ((a - b) / b) ** 2 : a > 0 ? 1 : 0)
  return 2 * norm(al.proteinaG, objetivo.proteinaG) + norm(al.carbosG, objetivo.carbosG) + norm(al.grasaG, objetivo.grasaG)
}

export function construirSobreComida(plan: Plan, momentoId: string, perfil: Perfil): SobreComida {
  const excluidos = [...perfil.alergias, ...perfil.intolerancias]
  const dieta = perfil.patronDietetico
  const comida = plan.comidas?.find((c) => c.id === momentoId)

  const base: SobreComida = {
    id: momentoId,
    tipo: 'comida',
    momento: comida?.momento ?? momentoId,
    kcal: { min: 0, max: 0 },
    proteinaG: { min: 0, max: 0 },
    carbosG: { min: 0, max: 0 },
    grasaG: { min: 0, max: 0 },
    excluidos,
    dieta,
    noGustaIds: perfil.noGustaIds,
    locale: LOCALE_POR_DEFECTO,
    candidatos: [],
  }

  if (!comida) return base

  const obj = comida.objetivo
  base.kcal = banda(obj.kcal, 0.08, 20)
  base.proteinaG = banda(obj.proteinaG, 0.2, 5)
  base.carbosG = banda(obj.carbosG, 0.3, 10)
  base.grasaG = banda(obj.grasaG, 0.35, 5)

  const validos = alimentosValidos(excluidos, dieta, perfil.noGustaIds)
  base.candidatos = [...validos]
    .sort((a, b) => distanciaMacros(a, obj) - distanciaMacros(b, obj) || a.id.localeCompare(b.id))
    .map((a) => a.id)

  return base
}

function buscarEjercicioPlan(plan: Plan, ejercicioId: string): EjercicioPlan | undefined {
  for (const s of plan.entrenamiento?.sesiones ?? []) {
    for (const e of s.ejercicios) {
      if (e.id === ejercicioId || e.ejercicioId === ejercicioId) return e
    }
  }
  return undefined
}

export function construirSobreEjercicio(plan: Plan, ejercicioId: string, perfil: Perfil): SobreEjercicio {
  const vetadas = plan.seguridad.modalidadesVetadas
  const ep = buscarEjercicioPlan(plan, ejercicioId)

  const base: SobreEjercicio = {
    id: ejercicioId,
    tipo: 'ejercicio',
    grupo: ep?.grupo ?? 'pecho',
    patron: ep?.patron ?? 'empuje_horizontal',
    series: ep ? { min: Math.max(1, ep.series - 1), max: ep.series + 1 } : { min: 2, max: 4 },
    reps: ep ? { ...ep.reps } : { min: 8, max: 12 },
    rir: ep ? { ...ep.rir } : { min: 1, max: 3 },
    equipoDisponible: perfil.equipo,
    contraindicados: perfil.lesiones,
    modalidadesVetadas: vetadas,
    locale: LOCALE_POR_DEFECTO,
    candidatos: [],
  }

  if (!ep) return base

  // Candidatos: mismo grupo, válidos por equipo/lesión/modalidad, distintos del actual.
  // El mismo patrón va primero (sustitución más fiel), luego el resto del grupo.
  base.candidatos = EJERCICIOS.filter(
    (e) => e.grupo === base.grupo && e.id !== ep.ejercicioId && !ejercicioViolaDura(e, perfil.equipo, perfil.lesiones, vetadas),
  )
    .sort((a, b) => {
      const mismo = (p: string) => (p === base.patron ? 0 : 1)
      return mismo(a.patron) - mismo(b.patron) || a.id.localeCompare(b.id)
    })
    .map((e) => e.id)

  return base
}
