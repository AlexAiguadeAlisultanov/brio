import { calcularBmr, calcularTDEE, gastoEjercicioKcal, imc, kcalObjetivoCrudo, masaMagra } from './energia'
import type { AvisoId, Bandera, Cribado, InformeSeguridad, Objetivo, Perfil } from './tipos'

// La seguridad se evalúa ANTES de emitir cualquier cifra. Sus banderas y límites condicionan
// todo lo que viene después: energía, macros y entrenamiento leen este informe.

const SUELO_KCAL = { hombre: 1500, mujer: 1200 } as const
const UMBRAL_EA = 30 // energía disponible mínima (kcal/kg de masa magra) antes de RED-S
const EDAD_MINIMA = 18
const EDAD_MAYOR = 65

// Modalidades que se vetan cuando hay riesgo cardiovascular o PAR-Q en rojo.
const MODALIDADES_RIESGO_CARDIO = ['valsalva', 'isometrico_intenso', 'carga_axial'] as const

function cuentaScoff(c: Cribado): number {
  let n = 0
  if (c.scoffVomitar) n++
  if (c.scoffPerderControl) n++
  if (c.scoffPerdido6kg3meses) n++
  if (c.scoffSeVeGordo) n++
  if (c.scoffComidaDomina) n++
  return n
}

function enRango(valor: number, min: number, max: number): boolean {
  return Number.isFinite(valor) && valor >= min && valor <= max
}

export interface LimiteKcal {
  kcal: number
  recorte: boolean
  banderas: Bandera[]
  avisos: AvisoId[]
  objetivoEfectivo: Objetivo
}

export interface EnergiaBase {
  bmr: number
  tdee: number
  masaMagraKg: number
  gastoEjercicioDiaKcal: number
}

export function energiaBase(perfil: Perfil): EnergiaBase {
  const { bmr } = calcularBmr(perfil)
  const tdee = calcularTDEE(bmr, perfil.actividad)
  return {
    bmr,
    tdee,
    masaMagraKg: masaMagra(perfil),
    gastoEjercicioDiaKcal: gastoEjercicioKcal(perfil),
  }
}

// Aplica los límites calóricos de seguridad sobre la energía objetivo cruda. Determinista:
// la misma entrada da siempre la misma salida. Nunca por debajo del suelo ni de BMR*0.9, ni
// un déficit mayor del 25% ni un superávit mayor del 20%, y respeta la energía disponible.
export function limitarKcal(perfil: Perfil, objetivo: Objetivo, energia: EnergiaBase): LimiteKcal {
  const banderas: Bandera[] = []
  const avisos: AvisoId[] = []
  let objetivoEfectivo = objetivo
  let recorte = false

  const suelo = SUELO_KCAL[perfil.sexo] ?? SUELO_KCAL.mujer
  const sueloEfectivo = Math.max(suelo, energia.bmr * 0.9)
  let kcal = kcalObjetivoCrudo(energia.tdee, objetivo)

  if (sueloEfectivo > energia.tdee) {
    // El suelo calórico está por encima del gasto: no se puede crear déficit sin bajar de un
    // umbral seguro. Probable bajo peso o dato erróneo: mantenimiento y derivación.
    objetivoEfectivo = 'mantenimiento'
    kcal = sueloEfectivo
    recorte = true
    banderas.push('suelo_sobre_tdee')
    avisos.push('suelo_calorico', 'derivar_profesional')
  } else {
    const minKcal = energia.tdee * 0.75 // déficit máximo 25%
    const maxKcal = energia.tdee * 1.2 // superávit máximo 20%
    if (kcal < minKcal) {
      kcal = minKcal
      recorte = true
      avisos.push('deficit_recortado')
    }
    if (kcal > maxKcal) {
      kcal = maxKcal
      recorte = true
      avisos.push('superavit_recortado')
    }
    if (kcal < sueloEfectivo) {
      kcal = sueloEfectivo
      recorte = true
      if (!avisos.includes('suelo_calorico')) avisos.push('suelo_calorico')
    }
  }

  // Energía disponible: si cae por debajo del umbral RED-S, se frena el déficit subiendo la
  // ingesta hasta recuperar EA 30, sin pasar del mantenimiento.
  const lbm = energia.masaMagraKg
  if (lbm > 0) {
    const ea = (kcal - energia.gastoEjercicioDiaKcal) / lbm
    if (ea < UMBRAL_EA) {
      const necesaria = UMBRAL_EA * lbm + energia.gastoEjercicioDiaKcal
      const tope = Math.max(energia.tdee, sueloEfectivo)
      const nueva = Math.min(necesaria, tope)
      if (nueva > kcal) {
        kcal = nueva
        recorte = true
        banderas.push('energia_disponible_baja')
        avisos.push('energia_disponible')
      }
    }
  }

  if (recorte && !banderas.includes('recorte_kcal')) banderas.push('recorte_kcal')
  return { kcal: Math.round(kcal), recorte, banderas, avisos, objetivoEfectivo }
}

export function evaluarSeguridad(perfil: Perfil, objetivo: Objetivo): InformeSeguridad {
  const banderas: Bandera[] = []
  const avisos: AvisoId[] = []
  const modalidades = new Set<InformeSeguridad['modalidadesVetadas'][number]>()
  const c = perfil.cribado

  // 1. Edad mínima: menor de 18 => bloqueo y derivación a pediatra.
  if (Number.isFinite(perfil.edadAnios) && perfil.edadAnios < EDAD_MINIMA) {
    return {
      bloquea: true,
      motivoBloqueo: 'menor_edad',
      objetivoEfectivo: 'mantenimiento',
      ocultarCifras: true,
      derivar: true,
      banderas: ['menor_edad'],
      avisos: ['derivar_pediatra'],
      modalidadesVetadas: [],
      recorteKcal: false,
      sinMaximas: true,
    }
  }

  // 2. Antropometría válida: fuera de rango es error de datos, no un perfil.
  const antropometriaOk =
    enRango(perfil.alturaCm, 120, 220) && enRango(perfil.pesoKg, 30, 300) && enRango(perfil.edadAnios, 18, 100)
  if (!antropometriaOk) {
    return {
      bloquea: true,
      motivoBloqueo: 'antropometria_invalida',
      objetivoEfectivo: 'mantenimiento',
      ocultarCifras: true,
      derivar: false,
      banderas: ['antropometria_invalida'],
      avisos: ['datos_invalidos'],
      modalidadesVetadas: [],
      recorteKcal: false,
      sinMaximas: true,
    }
  }

  let objetivoEfectivo: Objetivo = objetivo
  let ocultarCifras = false
  let derivar = false
  let sinMaximas = false
  let topeProteinaGkg: number | undefined

  const indiceMasa = imc(perfil.pesoKg, perfil.alturaCm)

  // 3. Señal de TCA: SCOFF >=2 o perder_grasa con IMC < 20. Ocultar cifras y derivar.
  const tca = cuentaScoff(c) >= 2 || (objetivo === 'perder_grasa' && indiceMasa < 20)
  if (tca) {
    ocultarCifras = true
    derivar = true
    objetivoEfectivo = 'mantenimiento'
    banderas.push('tca')
    avisos.push('recursos_tca')
  }

  // 4. Embarazo/lactancia: ni cortes ni volúmenes. Mantenimiento y derivación.
  if (c.embarazoLactancia) {
    objetivoEfectivo = 'mantenimiento'
    derivar = true
    banderas.push('embarazo_lactancia')
    avisos.push('embarazo_consultar', 'lactancia_necesidades')
  }

  // 5. PAR-Q en rojo: dolor de pecho, problema de corazón o mareo/desmayo.
  const parqRojo = c.dolorPecho || c.problemaCorazon || c.mareoDesmayo
  if (parqRojo) {
    derivar = true
    sinMaximas = true
    banderas.push('parq_rojo')
    avisos.push('parq_consultar_medico', 'sin_maximas')
    for (const m of MODALIDADES_RIESGO_CARDIO) modalidades.add(m)
  }

  // 6. Patología cardiovascular o tensión alta no controlada: vetar modalidades de riesgo.
  if (c.enfermedadCardiovascular) {
    sinMaximas = true
    banderas.push('cardiovascular')
    for (const m of MODALIDADES_RIESGO_CARDIO) modalidades.add(m)
  }
  if (c.tensionAlta) {
    sinMaximas = true
    banderas.push('tension_alta')
    for (const m of MODALIDADES_RIESGO_CARDIO) modalidades.add(m)
  }

  // 7. Medicamentos con implicaciones de seguridad.
  if (c.medicamentos.includes('betabloqueante')) {
    banderas.push('betabloqueante')
    avisos.push('rpe_fc_no_fiable')
  }
  if (c.medicamentos.includes('insulina') || c.medicamentos.includes('antidiabetico_oral')) {
    banderas.push('insulina_antidiabetico')
    avisos.push('hipoglucemia_timing')
  }

  // 8. Enfermedad renal/hepática: proteína tope 1.2 g/kg y derivación.
  if (c.enfermedadRenalHepatica) {
    topeProteinaGkg = 1.2
    derivar = true
    banderas.push('renal_hepatica')
    avisos.push('renal_proteina_limitada')
  }

  // 9. Edad >= 65: sin máximas, fuerza submáxima por RIR, menor fiabilidad del BMR estimado.
  const energia = energiaBase(perfil)
  if (perfil.edadAnios >= EDAD_MAYOR) {
    sinMaximas = true
    banderas.push('edad_avanzada')
    avisos.push('edad_fuerza_submaxima')
    avisos.push('bmr_menos_fiable')
  }

  // Límites calóricos (puede forzar mantenimiento si el suelo supera al TDEE).
  const limite = limitarKcal(perfil, objetivoEfectivo, energia)
  objetivoEfectivo = limite.objetivoEfectivo
  for (const b of limite.banderas) if (!banderas.includes(b)) banderas.push(b)
  for (const a of limite.avisos) if (!avisos.includes(a)) avisos.push(a)

  return {
    bloquea: false,
    objetivoEfectivo,
    ocultarCifras,
    derivar,
    banderas,
    avisos,
    modalidadesVetadas: [...modalidades],
    recorteKcal: limite.recorte,
    topeProteinaGkg,
    sinMaximas,
  }
}
