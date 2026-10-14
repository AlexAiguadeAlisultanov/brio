// Español: diccionario canónico. Es la fuente de verdad de las claves de traducción.
// Añadir una clave aquí obliga (por el `satisfies` de ca.ts y en.ts) a traducirla en los
// otros idiomas, o el compilador falla. De momento solo hay claves base; cada pantalla
// irá sumando las suyas cuando el diseño las construya.

export const es = {
  'app.nombre': 'Brío',

  'comun.siguiente': 'Siguiente',
  'comun.atras': 'Atrás',
  'comun.continuar': 'Continuar',
  'comun.guardar': 'Guardar',
  'comun.cancelar': 'Cancelar',
  'comun.empezar': 'Empezar',
  'comun.hecho': 'Hecho',

  'tabs.hoy': 'Hoy',
  'tabs.plan': 'Plan',
  'tabs.progreso': 'Progreso',
  'tabs.perfil': 'Perfil',
} as const

export type ClaveI18n = keyof typeof es

// Forma que deben cumplir todos los idiomas: las mismas claves, con valores de texto.
export type DiccionarioI18n = Record<ClaveI18n, string>
