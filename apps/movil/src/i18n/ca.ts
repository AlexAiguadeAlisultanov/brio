// Catalán. El `satisfies` obliga a tener exactamente las mismas claves que es.ts.

import type { DiccionarioI18n } from './es'

export const ca = {
  'app.nombre': 'Brío',

  'comun.siguiente': 'Següent',
  'comun.atras': 'Enrere',
  'comun.continuar': 'Continua',
  'comun.guardar': 'Desa',
  'comun.cancelar': 'Cancel·la',
  'comun.empezar': 'Comença',
  'comun.hecho': 'Fet',

  'tabs.hoy': 'Avui',
  'tabs.plan': 'Pla',
  'tabs.progreso': 'Progrés',
  'tabs.perfil': 'Perfil',
} satisfies DiccionarioI18n
