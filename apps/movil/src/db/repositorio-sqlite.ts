import type { SQLiteDatabase } from 'expo-sqlite'

import type { AjusteSemanal, Objetivo, Perfil, Plan, RegistroProgreso } from '@brio/motor'

import { restablecerDatosLocales } from './migraciones'
import {
  AJUSTES_APP_POR_DEFECTO,
  type AjustesApp,
  type NuevaComida,
  type NuevaRestriccion,
  type NuevaSerie,
  type NuevaSesion,
  type NuevoProgreso,
  type PlanGuardado,
  type Repositorio,
  type RestriccionGuardada,
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
