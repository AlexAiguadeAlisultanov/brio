// English. El `satisfies` obliga a tener exactamente las mismas claves que es.ts.

import type { DiccionarioI18n } from './es'

export const en = {
  'app.nombre': 'Brío',

  'comun.siguiente': 'Next',
  'comun.atras': 'Back',
  'comun.continuar': 'Continue',
  'comun.guardar': 'Save',
  'comun.cancelar': 'Cancel',
  'comun.empezar': 'Start',
  'comun.hecho': 'Done',

  'tabs.hoy': 'Today',
  'tabs.plan': 'Plan',
  'tabs.progreso': 'Progress',
  'tabs.perfil': 'Profile',
} satisfies DiccionarioI18n
