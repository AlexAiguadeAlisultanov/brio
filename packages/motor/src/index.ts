import { calcularBmr } from './energia'
import { construirComidas } from './comidas'
import { construirEntrenamiento } from './entrenamiento'
import { calcularMacros, hidratacionMl } from './macros'
import { energiaBase, evaluarSeguridad, limitarKcal } from './seguridad'
import type { AvisoId, Energia, InformeSeguridad, Objetivo, Perfil, Plan } from './tipos'

// Punto de entrada del motor. `generarPlan` es la función que nunca puede lanzar: toda la
// lógica interna va envuelta de forma defensiva y la salida es siempre un Plan coherente.

export const VERSION_MOTOR = '1.0.0'

export * from './tipos'
export { evaluarSeguridad, limitarKcal, energiaBase } from './seguridad'
export { construirSobreComida, construirSobreEjercicio } from './sobre'
export {
  sustituirComidaDeterminista,
  sustituirEjercicioDeterminista,
  validarSustitucionComida,
  validarSustitucionEjercicio,
  alimentosValidos,
} from './sustitucion'
export { aplicarCheckIn, tendenciaPeso } from './checkin'
export { porcentajesPorComida, construirComidas } from './comidas'
export { calcularMacros } from './macros'
export {
  elegirSplit,
  prescripcion,
  volumenSemanal,
  objetivoVolumen,
  seleccionarEjercicios,
  construirEntrenamiento,
  estimar1RM,
  cargaTrabajo,
} from './entrenamiento'
export { progresar, ajustarPorFeedback } from './progresion'

const r = (x: number) => Math.round(x)
const r1 = (x: number) => Math.round(x * 10) / 10

function sueloSexo(sexo: Perfil['sexo']): number {
  return sexo === 'hombre' ? 1500 : 1200
}

function planBloqueado(perfil: Perfil, objetivo: Objetivo, informe: InformeSeguridad, generadoISO?: string): Plan {
  const plan: Plan = {
    version: VERSION_MOTOR,
    objetivoSolicitado: objetivo,
    objetivoEfectivo: informe.objetivoEfectivo,
    estado: 'bloqueado',
    bloqueado: true,
    ocultarCifras: true,
    derivar: informe.derivar,
    seguridad: informe,
    avisos: informe.avisos,
  }
  if (generadoISO) plan.generadoISO = generadoISO
  void perfil
  return plan
}

function planDeEmergencia(objetivo: Objetivo, generadoISO?: string): Plan {
  // Último recurso si algo inesperado falla: plan de bloqueo con derivación. Nunca se lanza.
  const seguridad: InformeSeguridad = {
    bloquea: true,
    objetivoEfectivo: 'mantenimiento',
    ocultarCifras: true,
    derivar: true,
    banderas: [],
    avisos: ['derivar_profesional'],
    modalidadesVetadas: [],
    recorteKcal: false,
    sinMaximas: true,
  }
  const plan: Plan = {
    version: VERSION_MOTOR,
    objetivoSolicitado: objetivo,
    objetivoEfectivo: 'mantenimiento',
    estado: 'bloqueado',
    bloqueado: true,
    ocultarCifras: true,
    derivar: true,
    seguridad,
    avisos: ['derivar_profesional'],
  }
  if (generadoISO) plan.generadoISO = generadoISO
  return plan
}

export function generarPlan(perfil: Perfil, objetivo: Objetivo, ctx?: { ahoraISO?: string }): Plan {
  const generadoISO = ctx?.ahoraISO
  try {
    const informe = evaluarSeguridad(perfil, objetivo)

    // Bloqueo duro (menor de edad, antropometría inválida): ni cifras ni rutina de carga.
    if (informe.bloquea) return planBloqueado(perfil, objetivo, informe, generadoISO)

    // Entrenamiento: se ofrece siempre que no haya bloqueo duro (orientación general incluida).
    const entrenamiento = construirEntrenamiento(perfil, informe)

    const avisos: AvisoId[] = [...informe.avisos]
    if (entrenamiento.sesiones.length > 0 && perfil.duracionSesionMin > 0 && !avisos.includes('hidratacion_entreno')) {
      avisos.push('hidratacion_entreno')
    }

    // TCA: solo pautas generales, nunca kcal ni déficit.
    if (informe.ocultarCifras) {
      const plan: Plan = {
        version: VERSION_MOTOR,
        objetivoSolicitado: objetivo,
        objetivoEfectivo: informe.objetivoEfectivo,
        estado: 'orientacion',
        bloqueado: false,
        ocultarCifras: true,
        derivar: informe.derivar,
        seguridad: informe,
        entrenamiento,
        avisos,
      }
      if (generadoISO) plan.generadoISO = generadoISO
      return plan
    }

    // Plan completo con cifras.
    const eb = energiaBase(perfil)
    const bmrRes = calcularBmr(perfil)
    const limite = limitarKcal(perfil, informe.objetivoEfectivo, eb)
    const suelo = Math.max(sueloSexo(perfil.sexo), eb.bmr * 0.9)
    const lbm = eb.masaMagraKg > 0 ? eb.masaMagraKg : 1

    const energia: Energia = {
      bmr: r(eb.bmr),
      tdee: r(eb.tdee),
      kcalObjetivo: limite.kcal,
      metodo: bmrRes.metodo,
      estimado: bmrRes.estimado,
      factorActividad: eb.tdee / (eb.bmr || 1),
      gastoEjercicioDiaKcal: r(eb.gastoEjercicioDiaKcal),
      masaMagraKg: r1(eb.masaMagraKg),
      energiaDisponible: r1((limite.kcal - eb.gastoEjercicioDiaKcal) / lbm),
      sueloKcal: r(suelo),
    }

    const macros = calcularMacros(perfil, limite.kcal, informe.objetivoEfectivo, informe.topeProteinaGkg)
    const comidas = construirComidas(perfil, macros)

    const plan: Plan = {
      version: VERSION_MOTOR,
      objetivoSolicitado: objetivo,
      objetivoEfectivo: informe.objetivoEfectivo,
      estado: informe.derivar ? 'orientacion' : 'completo',
      bloqueado: false,
      ocultarCifras: false,
      derivar: informe.derivar,
      seguridad: informe,
      energia,
      macros,
      fibraG: macros.fibraG,
      hidratacionMl: hidratacionMl(perfil),
      comidas,
      entrenamiento,
      avisos,
    }
    if (generadoISO) plan.generadoISO = generadoISO
    return plan
  } catch {
    return planDeEmergencia(objetivo, generadoISO)
  }
}
