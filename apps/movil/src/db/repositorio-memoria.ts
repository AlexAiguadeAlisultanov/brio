import type { AjusteSemanal, Objetivo, Perfil, Plan, RegistroProgreso } from '@brio/motor'

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
  sesiones: (NuevaSesion & { id: number })[]
  series: (NuevaSerie & { id: number })[]
  comidas: (NuevaComida & { id: number })[]
  progreso: NuevoProgreso[]
  ajustes: (AjusteSemanal & { id: number; planId?: number })[]
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
    ajustesApp: { ...AJUSTES_APP_POR_DEFECTO },
    secuencia: 0,
  }
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
