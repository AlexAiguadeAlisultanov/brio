// Esquema de la base local de Brío. Todos los datos del cuerpo y de salud viven solo en el
// dispositivo; aquí no hay nada que viaje a un servidor.
//
// Criterios:
// - perfil y objetivo son de fila única (id siempre 1); guardan su forma completa como JSON
//   porque la fuente de verdad de esos tipos es @brio/motor y no queremos duplicar su
//   estructura en columnas que se desincronicen.
// - Los registros de entreno, comida y progreso sí van normalizados, con índices por fecha.
// - Las referencias a ids del catálogo (alimentos, ejercicios) se guardan como texto suelto
//   (no como claves foráneas duras) y los borrados de catálogo se marcan, no se eliminan,
//   para no dejar históricos huérfanos.

export const NOMBRE_BASE = 'brio.db'

// Versión del esquema. Sube de uno en uno; cada salto necesita su paso en migraciones.ts.
export const VERSION_ESQUEMA = 2

// Creación completa del esquema en su versión 1.
export const SQL_CREAR_V1 = `
CREATE TABLE IF NOT EXISTS perfil (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  json TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS objetivo (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  objetivo TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS restriccion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,            -- 'alergeno' | 'intolerancia' | 'dieta' | 'lesion' | 'equipo' | 'no_gusta' | ...
  valor TEXT NOT NULL,          -- alérgeno, zona, patrón dietético o id del catálogo
  dureza TEXT NOT NULL,         -- 'dura' | 'blanda'
  origen TEXT NOT NULL,         -- 'usuario' | 'cribado' | 'motor'
  borrado INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_motor TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  json TEXT NOT NULL,           -- Plan completo serializado tal cual lo devuelve el motor
  activo INTEGER NOT NULL DEFAULT 0,
  generado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registro_sesion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER,
  sesion_plan_id TEXT,          -- id de la sesión dentro del plan
  fecha TEXT NOT NULL,
  completada INTEGER NOT NULL DEFAULT 0,
  nota TEXT,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registro_serie (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sesion_id INTEGER NOT NULL,
  ejercicio_id TEXT NOT NULL,   -- id del catálogo (referencia blanda)
  numero_serie INTEGER NOT NULL,
  peso_kg REAL,
  reps INTEGER,
  rir REAL,
  completada INTEGER NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registro_comida (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comida_plan_id TEXT,          -- hueco del plan al que corresponde
  alimento_id TEXT NOT NULL,    -- id del catálogo (referencia blanda)
  gramos REAL NOT NULL,
  kcal REAL,
  proteina_g REAL,
  grasa_g REAL,
  carbos_g REAL,
  fecha TEXT NOT NULL,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registro_progreso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL UNIQUE,
  peso_kg REAL NOT NULL,
  cintura_cm REAL,
  nota TEXT,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ajuste (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER,
  fecha TEXT NOT NULL,
  delta_kcal INTEGER,
  kcal_anterior INTEGER,
  kcal_nueva INTEGER,
  confianza TEXT,
  json TEXT,                    -- AjusteSemanal serializado
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ajustes_app (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  locale TEXT NOT NULL DEFAULT 'es',
  unidades TEXT NOT NULL DEFAULT 'metrico',
  aviso_aceptado INTEGER NOT NULL DEFAULT 0,
  racha_dias INTEGER NOT NULL DEFAULT 0,
  consentimiento_llm INTEGER NOT NULL DEFAULT 0,
  actualizado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesion_fecha ON registro_sesion (fecha);
CREATE INDEX IF NOT EXISTS idx_serie_fecha ON registro_serie (fecha);
CREATE INDEX IF NOT EXISTS idx_serie_sesion ON registro_serie (sesion_id);
CREATE INDEX IF NOT EXISTS idx_comida_fecha ON registro_comida (fecha);
CREATE INDEX IF NOT EXISTS idx_progreso_fecha ON registro_progreso (fecha);
CREATE INDEX IF NOT EXISTS idx_ajuste_fecha ON ajuste (fecha);
CREATE INDEX IF NOT EXISTS idx_restriccion_activa ON restriccion (borrado);
CREATE INDEX IF NOT EXISTS idx_plan_activo ON plan (activo);
`

// Versión 2: la sensación con la que se cierra una sesión (alimenta la progresión del motor)
// y el agua bebida por día. El feedback va como columna de registro_sesion; el agua, en su
// propia tabla de fila única por fecha para poder ir sumando sorbos a lo largo del día.
export const SQL_CREAR_V2 = `
ALTER TABLE registro_sesion ADD COLUMN feedback TEXT;

CREATE TABLE IF NOT EXISTS registro_agua (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL UNIQUE,
  ml INTEGER NOT NULL DEFAULT 0,
  actualizado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agua_fecha ON registro_agua (fecha);
`

// Nombres de todas las tablas, para poder restablecer los datos locales (ruta de rescate).
export const TABLAS = [
  'perfil',
  'objetivo',
  'restriccion',
  'plan',
  'registro_sesion',
  'registro_serie',
  'registro_comida',
  'registro_progreso',
  'registro_agua',
  'ajuste',
  'ajustes_app',
] as const

// Borra todas las tablas. Se usa en el restablecimiento de datos locales y en el borrado RGPD.
export const SQL_BORRAR_TODO = TABLAS.map((t) => `DROP TABLE IF EXISTS ${t};`).join('\n')
