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

// Oro premium. Toque reservado para lo de pago (insignia premium, muro): acompaña al naranja
// sin robarle el papel, para que "premium" se lea sin ensuciar la marca. Se usa muy poco.
export const ORO = '#E8B866'
export const ORO_OSCURO = '#B38A3E'

// Colores semánticos, iguales en los dos modos para que el significado no cambie con el tema.
export const SEMANTICOS = {
  exito: '#3E9E6E',
  precaucion: '#C8922E',
  bloqueo: '#C0453A',
} as const

// Familias de fuente. Sora es geométrica humanista, legible en cuerpo y con carácter en los
// titulares grandes. Dos pesos de trabajo (regular y semibold) más un bold reservado para el
// display, según la guía: una sola familia, el peso construye la jerarquía. Los nombres salen
// de @expo-google-fonts/sora; se cargan en el layout raíz antes de pintar.
export const FUENTES = {
  regular: 'Sora_400Regular',
  medium: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
} as const

// Elige la familia por el peso pedido. Antes de que las fuentes carguen (o si fallan), el
// fontWeight que acompaña deja un fallback del sistema razonable.
export function familiaPorPeso(peso: string): string {
  if (peso === '700') return FUENTES.bold
  if (peso === '600' || peso === '500') return FUENTES.medium
  return FUENTES.regular
}

// Degradados sutiles para dar profundidad sin romper el minimalismo: capas de un mismo tono,
// nunca arcoíris. El de marca viste el botón y el hero; el de superficie eleva una tarjeta.
export const GRADIENTES = {
  marca: ['#FB6A1E', '#E5500F'] as const,
  oro: ['#E8B866', '#B38A3E'] as const,
  // Velo oscuro de abajo arriba para que el texto se lea sobre una foto de hero.
  veloHero: ['rgba(11,11,12,0)', 'rgba(11,11,12,0.55)', 'rgba(11,11,12,0.96)'] as const,
  // Realce muy suave para tarjetas destacadas en modo oscuro.
  tarjetaOscura: ['#1A1A1D', '#121214'] as const,
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
  oro: string // toque premium, legible en el modo actual
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
  oro: ORO,
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
  oro: ORO_OSCURO,
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

// Tipografía. Tamaños y pesos base; el resto lo define cada pantalla. El `display` es el
// titular grande de las portadas (hero, plan listo, muro de pago): manda la jerarquía. El
// `tracking` cierra un poco las mayúsculas grandes, que es lo que da el aire caro.
export const TIPOGRAFIA = {
  display: { tamano: 40, peso: '700' as const, interlineado: 46, tracking: -0.8 },
  titulo: { tamano: 28, peso: '700' as const, interlineado: 34, tracking: -0.4 },
  seccion: { tamano: 20, peso: '600' as const, interlineado: 26, tracking: -0.2 },
  cuerpo: { tamano: 16, peso: '400' as const, interlineado: 22, tracking: 0 },
  etiqueta: { tamano: 14, peso: '500' as const, interlineado: 18, tracking: 0 },
  pie: { tamano: 12, peso: '400' as const, interlineado: 16, tracking: 0 },
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
