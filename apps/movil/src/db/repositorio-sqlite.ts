import type { SQLiteDatabase } from 'expo-sqlite'

import type { AjusteSemanal, Macros, Objetivo, Perfil, Plan, RegistroProgreso } from '@brio/motor'

import { restablecerDatosLocales } from './migraciones'
import {
  AJUSTES_APP_POR_DEFECTO,
  type AjustesApp,
  type ComidaGuardada,
  type FeedbackSesion,
  type NuevaComida,
  type NuevaRestriccion,
  type NuevaSerie,
  type NuevaSesion,
  type NuevoProgreso,
  type PlanGuardado,
  type Repositorio,
  type RestriccionGuardada,
  type SerieGuardada,
  type SesionGuardada,
  type Unidades,
} from './repositorio'

// Implementación de la capa de datos sobre expo-sqlite (dispositivo). Recibe la base ya
// abierta y migrada desde el proveedor; aquí solo hay consultas tipadas. El tipo SQLiteDatabase
// se importa como tipo (se borra al compilar), así que este módulo no arrastra expo-sqlite al
// empaquetado web, donde se usa el repositorio en memoria.

const ahora = () => new Date().toISOString()
const aBool = (n: number | null | undefined): boolean => n === 1
const aInt = (b: boolean | undefined): number => (b ? 1 : 0)

interface FilaJson {
  json: string
}
interface FilaObjetivo {
  objetivo: string
}
interface FilaConteo {
  n: number
}
interface FilaRestriccion {
  id: number
  tipo: string
  valor: string
  dureza: string
  origen: string
}
interface FilaPlan {
  id: number
  version_motor: string
  objetivo: string
  json: string
  activo: number
  generado_en: string
}
interface FilaProgreso {
  fecha: string
  peso_kg: number
}
interface FilaSesion {
  id: number
  plan_id: number | null
  sesion_plan_id: string | null
  fecha: string
  completada: number
  feedback: string | null
  nota: string | null
}
interface FilaSerie {
  id: number
  sesion_id: number
  ejercicio_id: string
  numero_serie: number
  peso_kg: number | null
  reps: number | null
  rir: number | null
  completada: number
  fecha: string
}
interface FilaComida {
  id: number
  comida_plan_id: string | null
  alimento_id: string
  gramos: number
  kcal: number | null
  proteina_g: number | null
  grasa_g: number | null
  carbos_g: number | null
  fecha: string
}
interface FilaAgua {
  ml: number
}
interface FilaAjustesApp {
  locale: string
  unidades: string
  aviso_aceptado: number
  racha_dias: number
  consentimiento_llm: number
}

export class RepositorioSQLite implements Repositorio {
  constructor(private readonly db: SQLiteDatabase) {}

  // --- Perfil y objetivo ---

  async guardarPerfil(perfil: Perfil): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO perfil (id, json, actualizado_en) VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET json = excluded.json, actualizado_en = excluded.actualizado_en`,
      JSON.stringify(perfil),
      ahora(),
    )
  }

  async cargarPerfil(): Promise<Perfil | null> {
    const fila = await this.db.getFirstAsync<FilaJson>('SELECT json FROM perfil WHERE id = 1')
    if (!fila) return null
    return JSON.parse(fila.json) as Perfil
  }

  async hayPerfilMinimo(): Promise<boolean> {
    const fila = await this.db.getFirstAsync<FilaConteo>('SELECT COUNT(*) AS n FROM perfil WHERE id = 1')
    return (fila?.n ?? 0) > 0
  }

  async guardarObjetivo(objetivo: Objetivo): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO objetivo (id, objetivo, actualizado_en) VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET objetivo = excluded.objetivo, actualizado_en = excluded.actualizado_en`,
      objetivo,
      ahora(),
    )
  }

  async cargarObjetivo(): Promise<Objetivo | null> {
    const fila = await this.db.getFirstAsync<FilaObjetivo>('SELECT objetivo FROM objetivo WHERE id = 1')
    return fila ? (fila.objetivo as Objetivo) : null
  }

  // --- Restricciones ---

  async guardarRestriccion(r: NuevaRestriccion): Promise<number> {
    const res = await this.db.runAsync(
      `INSERT INTO restriccion (tipo, valor, dureza, origen, borrado, creado_en)
       VALUES (?, ?, ?, ?, 0, ?)`,
      r.tipo,
      r.valor,
      r.dureza,
      r.origen,
      ahora(),
    )
    return res.lastInsertRowId
  }

  private async leerRestricciones(soloDuras: boolean): Promise<RestriccionGuardada[]> {
    const where = soloDuras ? "WHERE borrado = 0 AND dureza = 'dura'" : 'WHERE borrado = 0'
    const filas = await this.db.getAllAsync<FilaRestriccion>(
      `SELECT id, tipo, valor, dureza, origen FROM restriccion ${where} ORDER BY id`,
    )
    return filas.map((f) => ({
      id: f.id,
      tipo: f.tipo,
      valor: f.valor,
      dureza: f.dureza === 'dura' ? 'dura' : 'blanda',
      origen: f.origen,
    }))
  }

  restricciones(): Promise<RestriccionGuardada[]> {
    return this.leerRestricciones(false)
  }

  restriccionesDuras(): Promise<RestriccionGuardada[]> {
    return this.leerRestricciones(true)
  }

  async borrarRestriccion(id: number): Promise<void> {
    // Soft-delete: no se elimina la fila, se marca, para no dejar históricos huérfanos.
    await this.db.runAsync('UPDATE restriccion SET borrado = 1 WHERE id = ?', id)
  }

  // --- Plan ---

  async guardarPlan(plan: Plan): Promise<number> {
    let id = 0
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('UPDATE plan SET activo = 0 WHERE activo = 1')
      const res = await this.db.runAsync(
        `INSERT INTO plan (version_motor, objetivo, json, activo, generado_en)
         VALUES (?, ?, ?, 1, ?)`,
        plan.version,
        plan.objetivoEfectivo,
        JSON.stringify(plan),
        plan.generadoISO ?? ahora(),
      )
      id = res.lastInsertRowId
    })
    return id
  }

  async planActivo(): Promise<Plan | null> {
    const fila = await this.db.getFirstAsync<FilaJson>(
      'SELECT json FROM plan WHERE activo = 1 ORDER BY generado_en DESC LIMIT 1',
    )
    if (!fila) return null
    return JSON.parse(fila.json) as Plan
  }

  async historialPlanes(): Promise<PlanGuardado[]> {
    const filas = await this.db.getAllAsync<FilaPlan>(
      'SELECT id, version_motor, objetivo, json, activo, generado_en FROM plan ORDER BY generado_en DESC',
    )
    return filas.map((f) => ({
      id: f.id,
      versionMotor: f.version_motor,
      objetivo: f.objetivo as Objetivo,
      plan: JSON.parse(f.json) as Plan,
      activo: aBool(f.activo),
      generadoEn: f.generado_en,
    }))
  }

  // --- Registros diarios ---

  async registrarSesion(s: NuevaSesion): Promise<number> {
    const res = await this.db.runAsync(
      `INSERT INTO registro_sesion (plan_id, sesion_plan_id, fecha, completada, nota, creado_en)
       VALUES (?, ?, ?, ?, ?, ?)`,
      s.planId ?? null,
      s.sesionPlanId ?? null,
      s.fecha,
      aInt(s.completada),
      s.nota ?? null,
      ahora(),
    )
    return res.lastInsertRowId
  }

  async registrarSerie(s: NuevaSerie): Promise<number> {
    const res = await this.db.runAsync(
      `INSERT INTO registro_serie (sesion_id, ejercicio_id, numero_serie, peso_kg, reps, rir, completada, fecha, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      s.sesionId,
      s.ejercicioId,
      s.numeroSerie,
      s.pesoKg ?? null,
      s.reps ?? null,
      s.rir ?? null,
      aInt(s.completada),
      s.fecha,
      ahora(),
    )
    return res.lastInsertRowId
  }

  async registrarComida(c: NuevaComida): Promise<number> {
    const res = await this.db.runAsync(
      `INSERT INTO registro_comida (comida_plan_id, alimento_id, gramos, kcal, proteina_g, grasa_g, carbos_g, fecha, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      c.comidaPlanId ?? null,
      c.alimentoId,
      c.gramos,
      c.macros?.kcal ?? null,
      c.macros?.proteinaG ?? null,
      c.macros?.grasaG ?? null,
      c.macros?.carbosG ?? null,
      c.fecha,
      ahora(),
    )
    return res.lastInsertRowId
  }

  // --- Lectura del día ---

  private mapearSerie(f: FilaSerie): SerieGuardada {
    const s: SerieGuardada = {
      id: f.id,
      sesionId: f.sesion_id,
      ejercicioId: f.ejercicio_id,
      numeroSerie: f.numero_serie,
      completada: aBool(f.completada),
      fecha: f.fecha,
    }
    if (f.peso_kg != null) s.pesoKg = f.peso_kg
    if (f.reps != null) s.reps = f.reps
    if (f.rir != null) s.rir = f.rir
    return s
  }

  async comidasDeFecha(fechaISO: string): Promise<ComidaGuardada[]> {
    const filas = await this.db.getAllAsync<FilaComida>(
      `SELECT id, comida_plan_id, alimento_id, gramos, kcal, proteina_g, grasa_g, carbos_g, fecha
       FROM registro_comida WHERE fecha = ? ORDER BY id`,
      fechaISO,
    )
    return filas.map((f) => {
      const macros: Partial<Macros> = {}
      if (f.kcal != null) macros.kcal = f.kcal
      if (f.proteina_g != null) macros.proteinaG = f.proteina_g
      if (f.grasa_g != null) macros.grasaG = f.grasa_g
      if (f.carbos_g != null) macros.carbosG = f.carbos_g
      const c: ComidaGuardada = { id: f.id, alimentoId: f.alimento_id, gramos: f.gramos, macros, fecha: f.fecha }
      if (f.comida_plan_id != null) c.comidaPlanId = f.comida_plan_id
      return c
    })
  }

  async borrarComidasDeHueco(fechaISO: string, comidaPlanId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM registro_comida WHERE fecha = ? AND comida_plan_id = ?', fechaISO, comidaPlanId)
  }

  async seriesDeFecha(fechaISO: string): Promise<SerieGuardada[]> {
    const filas = await this.db.getAllAsync<FilaSerie>(
      `SELECT id, sesion_id, ejercicio_id, numero_serie, peso_kg, reps, rir, completada, fecha
       FROM registro_serie WHERE fecha = ? ORDER BY id`,
      fechaISO,
    )
    return filas.map((f) => this.mapearSerie(f))
  }

  async seriesDeSesion(sesionId: number): Promise<SerieGuardada[]> {
    const filas = await this.db.getAllAsync<FilaSerie>(
      `SELECT id, sesion_id, ejercicio_id, numero_serie, peso_kg, reps, rir, completada, fecha
       FROM registro_serie WHERE sesion_id = ? ORDER BY id`,
      sesionId,
    )
    return filas.map((f) => this.mapearSerie(f))
  }

  async ultimaSesionCompletada(sesionPlanId: string, antesDeFechaISO: string): Promise<SesionGuardada | null> {
    const f = await this.db.getFirstAsync<FilaSesion>(
      `SELECT id, plan_id, sesion_plan_id, fecha, completada, feedback, nota
       FROM registro_sesion WHERE sesion_plan_id = ? AND completada = 1 AND fecha < ?
       ORDER BY fecha DESC, id DESC LIMIT 1`,
      sesionPlanId,
      antesDeFechaISO,
    )
    if (!f) return null
    const s: SesionGuardada = { id: f.id, fecha: f.fecha, completada: aBool(f.completada) }
    if (f.plan_id != null) s.planId = f.plan_id
    if (f.sesion_plan_id != null) s.sesionPlanId = f.sesion_plan_id
    if (f.feedback === 'facil' || f.feedback === 'ok' || f.feedback === 'dificil') s.feedback = f.feedback
    if (f.nota != null) s.nota = f.nota
    return s
  }

  async borrarSerie(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM registro_serie WHERE id = ?', id)
  }

  async sesionDelDia(fechaISO: string, sesionPlanId: string): Promise<SesionGuardada | null> {
    const f = await this.db.getFirstAsync<FilaSesion>(
      `SELECT id, plan_id, sesion_plan_id, fecha, completada, feedback, nota
       FROM registro_sesion WHERE fecha = ? AND sesion_plan_id = ? ORDER BY id DESC LIMIT 1`,
      fechaISO,
      sesionPlanId,
    )
    if (!f) return null
    const s: SesionGuardada = {
      id: f.id,
      fecha: f.fecha,
      completada: aBool(f.completada),
    }
    if (f.plan_id != null) s.planId = f.plan_id
    if (f.sesion_plan_id != null) s.sesionPlanId = f.sesion_plan_id
    if (f.feedback === 'facil' || f.feedback === 'ok' || f.feedback === 'dificil') s.feedback = f.feedback
    if (f.nota != null) s.nota = f.nota
    return s
  }

  async guardarFeedbackSesion(sesionId: number, feedback: FeedbackSesion): Promise<void> {
    await this.db.runAsync('UPDATE registro_sesion SET feedback = ?, completada = 1 WHERE id = ?', feedback, sesionId)
  }

  // --- Agua del día ---

  async aguaDeFecha(fechaISO: string): Promise<number> {
    const fila = await this.db.getFirstAsync<FilaAgua>('SELECT ml FROM registro_agua WHERE fecha = ?', fechaISO)
    return fila?.ml ?? 0
  }

  async registrarAgua(fechaISO: string, deltaMl: number): Promise<number> {
    await this.db.runAsync(
      `INSERT INTO registro_agua (fecha, ml, actualizado_en) VALUES (?, MAX(0, ?), ?)
       ON CONFLICT(fecha) DO UPDATE SET ml = MAX(0, ml + ?), actualizado_en = excluded.actualizado_en`,
      fechaISO,
      Math.max(0, deltaMl),
      ahora(),
      deltaMl,
    )
    return this.aguaDeFecha(fechaISO)
  }

  // --- Progreso corporal ---

  async registrarProgreso(p: NuevoProgreso): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO registro_progreso (fecha, peso_kg, cintura_cm, nota, creado_en)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(fecha) DO UPDATE SET
         peso_kg = excluded.peso_kg,
         cintura_cm = excluded.cintura_cm,
         nota = excluded.nota`,
      p.fechaISO,
      p.pesoKg,
      p.cinturaCm ?? null,
      p.nota ?? null,
      ahora(),
    )
  }

  async progresoEntre(desdeISO: string, hastaISO: string): Promise<RegistroProgreso[]> {
    const filas = await this.db.getAllAsync<FilaProgreso>(
      'SELECT fecha, peso_kg FROM registro_progreso WHERE fecha BETWEEN ? AND ? ORDER BY fecha',
      desdeISO,
      hastaISO,
    )
    return filas.map((f) => ({ fechaISO: f.fecha, pesoKg: f.peso_kg }))
  }

  // --- Ajustes semanales ---

  async guardarAjuste(a: AjusteSemanal, planId?: number): Promise<number> {
    const res = await this.db.runAsync(
      `INSERT INTO ajuste (plan_id, fecha, delta_kcal, kcal_anterior, kcal_nueva, confianza, json, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      planId ?? null,
      ahora(),
      a.deltaKcal,
      a.kcalActual,
      a.kcalNueva,
      a.confianza,
      JSON.stringify(a),
      ahora(),
    )
    return res.lastInsertRowId
  }

  // --- Ajustes de la app ---

  async ajustesApp(): Promise<AjustesApp> {
    const fila = await this.db.getFirstAsync<FilaAjustesApp>(
      'SELECT locale, unidades, aviso_aceptado, racha_dias, consentimiento_llm FROM ajustes_app WHERE id = 1',
    )
    if (!fila) return { ...AJUSTES_APP_POR_DEFECTO }
    return {
      locale: (fila.locale as AjustesApp['locale']) ?? 'es',
      unidades: (fila.unidades as Unidades) ?? 'metrico',
      avisoAceptado: aBool(fila.aviso_aceptado),
      rachaDias: fila.racha_dias,
      consentimientoLlm: aBool(fila.consentimiento_llm),
    }
  }

  async guardarAjustesApp(parcial: Partial<AjustesApp>): Promise<void> {
    const actual = await this.ajustesApp()
    const fusion: AjustesApp = { ...actual, ...parcial }
    await this.db.runAsync(
      `INSERT INTO ajustes_app (id, locale, unidades, aviso_aceptado, racha_dias, consentimiento_llm, actualizado_en)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         locale = excluded.locale,
         unidades = excluded.unidades,
         aviso_aceptado = excluded.aviso_aceptado,
         racha_dias = excluded.racha_dias,
         consentimiento_llm = excluded.consentimiento_llm,
         actualizado_en = excluded.actualizado_en`,
      fusion.locale,
      fusion.unidades,
      aInt(fusion.avisoAceptado),
      fusion.rachaDias,
      aInt(fusion.consentimientoLlm),
      ahora(),
    )
  }

  // --- RGPD ---

  async borrarTodosMisDatos(): Promise<void> {
    // Recrea el esquema vacío: todo lo local desaparece sin dejar rastro.
    await restablecerDatosLocales(this.db)
  }
}
