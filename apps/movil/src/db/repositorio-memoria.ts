import type { AjusteSemanal, Objetivo, Perfil, Plan, RegistroProgreso } from '@brio/motor'

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
  reducirMarcas,
} from './repositorio'

// Repositorio en memoria, con el MISMO contrato que el de SQLite. Se usa en web, donde
// expo-sqlite todavía es alpha y no da garantías de persistencia. Si el navegador tiene
// localStorage, los datos sobreviven a recargas; si no, viven solo en memoria. En cualquier
// caso NO es almacenamiento fiable: es una degradación para poder probar la app en el navegador.

const CLAVE = 'brio.datos.v1'

interface EstadoMemoria {
  perfil: Perfil | null
  objetivo: Objetivo | null
  restricciones: (RestriccionGuardada & { borrado: boolean })[]
  planes: PlanGuardado[]
  sesiones: (NuevaSesion & { id: number; feedback?: FeedbackSesion })[]
  series: (NuevaSerie & { id: number })[]
  comidas: (NuevaComida & { id: number })[]
  progreso: NuevoProgreso[]
  ajustes: (AjusteSemanal & { id: number; planId?: number })[]
  agua: Record<string, number>
  congelados: string[]
  ajustesApp: AjustesApp
  secuencia: number
}

function estadoVacio(): EstadoMemoria {
  return {
    perfil: null,
    objetivo: null,
    restricciones: [],
    planes: [],
    sesiones: [],
    series: [],
    comidas: [],
    progreso: [],
    ajustes: [],
    agua: {},
    congelados: [],
    ajustesApp: { ...AJUSTES_APP_POR_DEFECTO },
    secuencia: 0,
  }
}

function macrosParciales(c: NuevaComida): ComidaGuardada['macros'] {
  const m: ComidaGuardada['macros'] = {}
  if (c.macros?.kcal != null) m.kcal = c.macros.kcal
  if (c.macros?.proteinaG != null) m.proteinaG = c.macros.proteinaG
  if (c.macros?.grasaG != null) m.grasaG = c.macros.grasaG
  if (c.macros?.carbosG != null) m.carbosG = c.macros.carbosG
  return m
}

function aSerieGuardada(s: NuevaSerie & { id: number }): SerieGuardada {
  const g: SerieGuardada = {
    id: s.id,
    sesionId: s.sesionId,
    ejercicioId: s.ejercicioId,
    numeroSerie: s.numeroSerie,
    completada: s.completada ?? false,
    fecha: s.fecha,
  }
  if (s.pesoKg != null) g.pesoKg = s.pesoKg
  if (s.reps != null) g.reps = s.reps
  if (s.rir != null) g.rir = s.rir
  return g
}

type Almacen = { leer: () => EstadoMemoria; escribir: (e: EstadoMemoria) => void }

function construirAlmacen(): Almacen {
  const ls: Storage | undefined = typeof globalThis !== 'undefined' ? (globalThis as { localStorage?: Storage }).localStorage : undefined

  if (!ls) {
    let estado = estadoVacio()
    return { leer: () => estado, escribir: (e) => { estado = e } }
  }

  return {
    leer: () => {
      try {
        const bruto = ls.getItem(CLAVE)
        if (!bruto) return estadoVacio()
        return { ...estadoVacio(), ...(JSON.parse(bruto) as EstadoMemoria) }
      } catch {
        return estadoVacio()
      }
    },
    escribir: (e) => {
      try {
        ls.setItem(CLAVE, JSON.stringify(e))
      } catch {
        // Cuota llena o modo privado: nos quedamos sin persistir, pero la sesión sigue.
      }
    },
  }
}

export function crearRepositorioMemoria(): Repositorio {
  // Aviso único: la persistencia en web no es fiable.
  if (typeof console !== 'undefined') {
    console.warn(
      'Brío: usando almacenamiento en memoria/localStorage (web). La persistencia no es fiable; ' +
        'los datos del cuerpo y de salud solo se guardan de verdad en el dispositivo.',
    )
  }

  const almacen = construirAlmacen()
  let estado = almacen.leer()
  const guardar = () => almacen.escribir(estado)
  const siguienteId = () => {
    estado.secuencia += 1
    return estado.secuencia
  }

  return {
    async guardarPerfil(perfil) {
      estado.perfil = perfil
      guardar()
    },
    async cargarPerfil() {
      return estado.perfil
    },
    async hayPerfilMinimo() {
      return estado.perfil !== null
    },
    async guardarObjetivo(objetivo) {
      estado.objetivo = objetivo
      guardar()
    },
    async cargarObjetivo() {
      return estado.objetivo
    },

    async guardarRestriccion(r: NuevaRestriccion) {
      const id = siguienteId()
      estado.restricciones.push({ id, ...r, borrado: false })
      guardar()
      return id
    },
    async restricciones() {
      return estado.restricciones.filter((r) => !r.borrado).map(({ borrado: _b, ...resto }) => resto)
    },
    async restriccionesDuras() {
      return estado.restricciones
        .filter((r) => !r.borrado && r.dureza === 'dura')
        .map(({ borrado: _b, ...resto }) => resto)
    },
    async borrarRestriccion(id) {
      const r = estado.restricciones.find((x) => x.id === id)
      if (r) r.borrado = true
      guardar()
    },

    async guardarPlan(plan: Plan) {
      const id = siguienteId()
      estado.planes.forEach((p) => (p.activo = false))
      estado.planes.push({
        id,
        versionMotor: plan.version,
        objetivo: plan.objetivoEfectivo,
        plan,
        activo: true,
        generadoEn: plan.generadoISO ?? new Date().toISOString(),
      })
      guardar()
      return id
    },
    async planActivo() {
      const activo = [...estado.planes].reverse().find((p) => p.activo)
      return activo ? activo.plan : null
    },
    async historialPlanes() {
      return [...estado.planes].sort((a, b) => b.generadoEn.localeCompare(a.generadoEn))
    },

    async registrarSesion(s) {
      const id = siguienteId()
      estado.sesiones.push({ id, ...s })
      guardar()
      return id
    },
    async registrarSerie(s) {
      const id = siguienteId()
      estado.series.push({ id, ...s })
      guardar()
      return id
    },
    async registrarComida(c) {
      const id = siguienteId()
      estado.comidas.push({ id, ...c })
      guardar()
      return id
    },

    async comidasDeFecha(fechaISO) {
      return estado.comidas
        .filter((c) => c.fecha === fechaISO)
        .map<ComidaGuardada>((c) => {
          const g: ComidaGuardada = { id: c.id, alimentoId: c.alimentoId, gramos: c.gramos, macros: macrosParciales(c), fecha: c.fecha }
          if (c.comidaPlanId != null) g.comidaPlanId = c.comidaPlanId
          return g
        })
    },
    async borrarComidasDeHueco(fechaISO, comidaPlanId) {
      estado.comidas = estado.comidas.filter((c) => !(c.fecha === fechaISO && c.comidaPlanId === comidaPlanId))
      guardar()
    },
    async seriesDeFecha(fechaISO) {
      return estado.series.filter((s) => s.fecha === fechaISO).map(aSerieGuardada)
    },
    async seriesDeSesion(sesionId) {
      return estado.series.filter((s) => s.sesionId === sesionId).map(aSerieGuardada)
    },
    async ultimaSesionCompletada(sesionPlanId, antesDeFechaISO) {
      const candidatas = estado.sesiones
        .filter((s) => s.sesionPlanId === sesionPlanId && s.completada && s.fecha < antesDeFechaISO)
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
      const encontrada = candidatas[0]
      if (!encontrada) return null
      const g: SesionGuardada = { id: encontrada.id, fecha: encontrada.fecha, completada: encontrada.completada ?? false }
      if (encontrada.planId != null) g.planId = encontrada.planId
      if (encontrada.sesionPlanId != null) g.sesionPlanId = encontrada.sesionPlanId
      if (encontrada.feedback) g.feedback = encontrada.feedback
      if (encontrada.nota != null) g.nota = encontrada.nota
      return g
    },
    async borrarSerie(id) {
      estado.series = estado.series.filter((s) => s.id !== id)
      guardar()
    },
    async sesionDelDia(fechaISO, sesionPlanId) {
      const encontrada = [...estado.sesiones].reverse().find((s) => s.fecha === fechaISO && s.sesionPlanId === sesionPlanId)
      if (!encontrada) return null
      const g: SesionGuardada = { id: encontrada.id, fecha: encontrada.fecha, completada: encontrada.completada ?? false }
      if (encontrada.planId != null) g.planId = encontrada.planId
      if (encontrada.sesionPlanId != null) g.sesionPlanId = encontrada.sesionPlanId
      if (encontrada.feedback) g.feedback = encontrada.feedback
      if (encontrada.nota != null) g.nota = encontrada.nota
      return g
    },
    async guardarFeedbackSesion(sesionId, feedback) {
      const s = estado.sesiones.find((x) => x.id === sesionId)
      if (s) {
        s.feedback = feedback
        s.completada = true
      }
      guardar()
    },

    async aguaDeFecha(fechaISO) {
      return estado.agua[fechaISO] ?? 0
    },
    async registrarAgua(fechaISO, deltaMl) {
      const total = Math.max(0, (estado.agua[fechaISO] ?? 0) + deltaMl)
      estado.agua[fechaISO] = total
      guardar()
      return total
    },

    async registrarProgreso(p: NuevoProgreso) {
      const existente = estado.progreso.find((x) => x.fechaISO === p.fechaISO)
      if (existente) Object.assign(existente, p)
      else estado.progreso.push(p)
      guardar()
    },
    async progresoEntre(desdeISO, hastaISO) {
      return estado.progreso
        .filter((p) => p.fechaISO >= desdeISO && p.fechaISO <= hastaISO)
        .sort((a, b) => a.fechaISO.localeCompare(b.fechaISO))
        .map<RegistroProgreso>((p) => ({ fechaISO: p.fechaISO, pesoKg: p.pesoKg }))
    },

    async diasConActividad(desdeISO, hastaISO) {
      const dentro = (f: string) => f >= desdeISO && f <= hastaISO
      const dias = new Set<string>()
      estado.sesiones.filter((s) => s.completada && dentro(s.fecha)).forEach((s) => dias.add(s.fecha))
      estado.series.filter((s) => dentro(s.fecha)).forEach((s) => dias.add(s.fecha))
      estado.comidas.filter((c) => dentro(c.fecha)).forEach((c) => dias.add(c.fecha))
      return [...dias].sort()
    },
    async mejoresMarcas() {
      const filas = estado.series
        .filter((s) => (s.completada ?? false) && s.pesoKg != null)
        .map((s) => ({ ejercicioId: s.ejercicioId, pesoKg: s.pesoKg as number, reps: s.reps ?? null, fechaISO: s.fecha }))
      return reducirMarcas(filas)
    },
    async diasCongelados(desdeISO, hastaISO) {
      return estado.congelados.filter((f) => f >= desdeISO && f <= hastaISO).sort()
    },
    async congelarDia(fechaISO) {
      if (!estado.congelados.includes(fechaISO)) estado.congelados.push(fechaISO)
      guardar()
    },
    async descongelarDia(fechaISO) {
      estado.congelados = estado.congelados.filter((f) => f !== fechaISO)
      guardar()
    },

    async guardarAjuste(a: AjusteSemanal, planId?: number) {
      const id = siguienteId()
      estado.ajustes.push({ id, planId, ...a })
      guardar()
      return id
    },

    async ajustesApp() {
      return { ...estado.ajustesApp }
    },
    async guardarAjustesApp(parcial) {
      estado.ajustesApp = { ...estado.ajustesApp, ...parcial }
      guardar()
    },

    async borrarTodosMisDatos() {
      estado = estadoVacio()
      guardar()
    },
  }
}
