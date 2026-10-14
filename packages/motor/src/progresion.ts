import type { Experiencia, GrupoMuscular, Rango } from './tipos'

// Progresión de cargas. Novato: lineal con incrementos fijos. Intermedio/avanzado: doble
// progresión (primero reps hasta el tope del rango, luego carga). Ningún salto supera el 10%.
// Descarga programada al encadenar dos estancamientos.

const SALTO_MAXIMO = 0.1 // 10%
const GRUPOS_TREN_INFERIOR: GrupoMuscular[] = ['cuadriceps', 'isquios', 'gluteos', 'gemelos']

export type CambioProgresion = 'subir_carga' | 'subir_reps' | 'mantener' | 'descarga' | 'bajar_estimulo'

export interface EstadoEjercicio {
  ejercicioId: string
  grupo: GrupoMuscular
  pesoKg: number
  repsConseguidas: number // reps logradas en la serie principal de la última sesión
  repsObjetivo: Rango
  rirObjetivo: number
  estancamientos: number // estancamientos consecutivos acumulados
}

export interface ResultadoProgresion {
  pesoKg: number
  repsObjetivo: number // reps a buscar en la próxima sesión
  descarga: boolean
  cambio: CambioProgresion
  estancamientos: number
}

function redondearCarga(kg: number): number {
  // A pasos de 0.25 kg (microdiscos de 1.25/0.25 habituales).
  return Math.max(0, Math.round(kg * 4) / 4)
}

export function esTrenInferior(grupo: GrupoMuscular): boolean {
  return GRUPOS_TREN_INFERIOR.includes(grupo)
}

// Incremento de carga absoluto por tipo de ejercicio, acotado al 10% del peso actual.
export function incrementoCarga(grupo: GrupoMuscular, pesoKg: number): number {
  const absoluto = esTrenInferior(grupo) ? 2.5 : 1.25
  const tope = pesoKg * SALTO_MAXIMO
  // Con cargas muy bajas el tope del 10% manda; nunca se supera.
  return tope > 0 ? Math.min(absoluto, tope) : absoluto
}

export function progresar(estado: EstadoEjercicio, experiencia: Experiencia): ResultadoProgresion {
  // Dos estancamientos seguidos: descarga (bajar carga ~10% y reiniciar reps).
  if (estado.estancamientos >= 2) {
    return {
      pesoKg: redondearCarga(estado.pesoKg * 0.9),
      repsObjetivo: estado.repsObjetivo.min,
      descarga: true,
      cambio: 'descarga',
      estancamientos: 0,
    }
  }

  const alcanzoTope = estado.repsConseguidas >= estado.repsObjetivo.max
  const fallo = estado.repsConseguidas < estado.repsObjetivo.min

  if (fallo) {
    // No llegó ni al mínimo del rango: estímulo mantenido y se cuenta un estancamiento.
    return {
      pesoKg: estado.pesoKg,
      repsObjetivo: estado.repsObjetivo.min,
      descarga: false,
      cambio: 'mantener',
      estancamientos: estado.estancamientos + 1,
    }
  }

  if (alcanzoTope) {
    // Tope de reps al RIR objetivo: sube la carga y reinicia reps al mínimo del rango.
    // Novato (lineal) e intermedio/avanzado (doble progresión) comparten este paso; cambia
    // el incremento, siempre acotado al 10%.
    const incremento = incrementoCarga(estado.grupo, estado.pesoKg)
    void experiencia // el incremento ya depende del grupo; la rama queda explícita para el lector
    return {
      pesoKg: redondearCarga(estado.pesoKg + incremento),
      repsObjetivo: estado.repsObjetivo.min,
      descarga: false,
      cambio: 'subir_carga',
      estancamientos: 0,
    }
  }

  // Dentro del rango pero sin llegar al tope: se sube una repetición (doble progresión).
  return {
    pesoKg: estado.pesoKg,
    repsObjetivo: Math.min(estado.repsConseguidas + 1, estado.repsObjetivo.max),
    descarga: false,
    cambio: 'subir_reps',
    estancamientos: 0,
  }
}

// Ajuste rápido según la sensación de la sesión. 'dificil' baja el estímulo (menos carga),
// 'facil' lo sube un paso, 'ok' lo mantiene.
export function ajustarPorFeedback(estado: EstadoEjercicio, feedback: 'facil' | 'ok' | 'dificil'): ResultadoProgresion {
  if (feedback === 'dificil') {
    return {
      pesoKg: redondearCarga(estado.pesoKg * 0.95),
      repsObjetivo: estado.repsObjetivo.min,
      descarga: false,
      cambio: 'bajar_estimulo',
      estancamientos: estado.estancamientos,
    }
  }
  if (feedback === 'facil') {
    const incremento = incrementoCarga(estado.grupo, estado.pesoKg)
    return {
      pesoKg: redondearCarga(estado.pesoKg + incremento),
      repsObjetivo: estado.repsObjetivo.min,
      descarga: false,
      cambio: 'subir_carga',
      estancamientos: 0,
    }
  }
  return {
    pesoKg: estado.pesoKg,
    repsObjetivo: estado.repsObjetivo.min,
    descarga: false,
    cambio: 'mantener',
    estancamientos: estado.estancamientos,
  }
}
