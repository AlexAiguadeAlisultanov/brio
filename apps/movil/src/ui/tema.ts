// Tokens de tema de Brío: color, espaciado, radios y tipografía. Solo valores y ayudas,
// ningún componente de pantalla. El diseño fino de la interfaz lo construye otro agente
// encima de estos tokens, para que todas las pantallas compartan el mismo lenguaje.
//
// Modo oscuro por defecto. El acento es Naranja vigor.

export type ModoTema = 'oscuro' | 'claro'

// Acento de marca. La variante oscura es para texto o iconos sobre fondos claros, donde el
// naranja puro no tiene contraste suficiente.
export const ACENTO = '#FB6A1E'
export const ACENTO_OSCURO = '#C85410'

// Colores semánticos, iguales en los dos modos para que el significado no cambie con el tema.
export const SEMANTICOS = {
  exito: '#3E9E6E',
  precaucion: '#C8922E',
  bloqueo: '#C0453A',
} as const

export interface ColoresTema {
  fondo: string
  tarjeta: string
  // Superficie de hojas inferiores y campos de formulario.
  hoja: string
  texto: string
  textoSecundario: string
  acento: string
  acentoContraste: string // acento legible sobre superficies claras
  exito: string
  precaucion: string
  bloqueo: string
  // Texto que va encima del acento (p. ej. dentro de un botón naranja).
  sobreAcento: string
  borde: string
}

const oscuro: ColoresTema = {
  fondo: '#0B0B0C',
  tarjeta: '#151517',
  hoja: '#1D1D20',
  texto: '#F5F5F7',
  textoSecundario: '#9A9AA0',
  acento: ACENTO,
  acentoContraste: ACENTO,
  exito: SEMANTICOS.exito,
  precaucion: SEMANTICOS.precaucion,
  bloqueo: SEMANTICOS.bloqueo,
  sobreAcento: '#0B0B0C',
  borde: '#26262A',
}

const claro: ColoresTema = {
  fondo: '#FAFAFA',
  tarjeta: '#FFFFFF',
  hoja: '#FFFFFF',
  texto: '#1D1D1F',
  textoSecundario: '#6B6B70',
  acento: ACENTO,
  acentoContraste: ACENTO_OSCURO,
  exito: SEMANTICOS.exito,
  precaucion: SEMANTICOS.precaucion,
  bloqueo: SEMANTICOS.bloqueo,
  sobreAcento: '#FFFFFF',
  borde: '#E4E4E8',
}

export const COLORES: Record<ModoTema, ColoresTema> = { oscuro, claro }

// Rejilla de 8. `media` es el medio paso (4) para ajustes finos.
export const ESPACIADO = {
  media: 4,
  uno: 8,
  dos: 16,
  tres: 24,
  cuatro: 32,
  cinco: 40,
  seis: 48,
  ocho: 64,
} as const

// Radios 8 / 12 / 20, más un redondeo completo para pastillas.
export const RADIOS = {
  s: 8,
  m: 12,
  l: 20,
  completo: 999,
} as const

// Tipografía del sistema. Tamaños y pesos base; el resto lo define cada pantalla.
export const TIPOGRAFIA = {
  titulo: { tamano: 28, peso: '700' as const, interlineado: 34 },
  seccion: { tamano: 20, peso: '600' as const, interlineado: 26 },
  cuerpo: { tamano: 16, peso: '400' as const, interlineado: 22 },
  etiqueta: { tamano: 14, peso: '500' as const, interlineado: 18 },
  pie: { tamano: 12, peso: '400' as const, interlineado: 16 },
} as const

export interface Tema {
  modo: ModoTema
  colores: ColoresTema
  espaciado: typeof ESPACIADO
  radios: typeof RADIOS
  tipografia: typeof TIPOGRAFIA
}

export function construirTema(modo: ModoTema): Tema {
  return {
    modo,
    colores: COLORES[modo],
    espaciado: ESPACIADO,
    radios: RADIOS,
    tipografia: TIPOGRAFIA,
  }
}
