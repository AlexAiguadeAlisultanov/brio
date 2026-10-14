// Calendario de adherencia con racha indulgente. La idea: un día suelto sin registrar no tira
// la racha al suelo (así nadie abandona por fallar una vez), pero dos días seguidos en blanco sí
// la cierran. Los días que el usuario congela a propósito (vacaciones, enfermedad) no cuentan en
// contra. Función pura, sin fechas del reloj: hoy entra como parámetro.

export type EstadoDia = 'activo' | 'congelado' | 'vacio' | 'futuro'

export interface DiaAdherencia {
  fechaISO: string
  estado: EstadoDia
}

export interface Adherencia {
  rachaActual: number
  hoyActivo: boolean
  dias: DiaAdherencia[]
}

const DIA_MS = 86_400_000

function iso(fecha: number): string {
  return new Date(fecha).toISOString().slice(0, 10)
}

// Suma/resta días trabajando en UTC a partir de un ISO YYYY-MM-DD, sin arrastrar husos horarios.
function desplazar(fechaISO: string, dias: number): string {
  return iso(Date.parse(`${fechaISO}T00:00:00Z`) + dias * DIA_MS)
}

export function calcularAdherencia(
  diasActivos: Iterable<string>,
  diasCongelados: Iterable<string>,
  hoyISO: string,
  ventanaDias = 35,
): Adherencia {
  const activos = new Set(diasActivos)
  const congelados = new Set(diasCongelados)

  // Rejilla de la ventana, del más antiguo al más reciente, para pintar el calendario.
  const dias: DiaAdherencia[] = []
  for (let i = ventanaDias - 1; i >= 0; i--) {
    const fechaISO = desplazar(hoyISO, -i)
    const estado: EstadoDia = activos.has(fechaISO) ? 'activo' : congelados.has(fechaISO) ? 'congelado' : 'vacio'
    dias.push({ fechaISO, estado })
  }

  // Racha hacia atrás desde hoy. Hoy sin registrar aún no rompe nada (el día no ha acabado); un
  // hueco suelto se perdona; dos huecos seguidos cierran la racha.
  let racha = 0
  let huecosSeguidos = 0
  for (let i = 0; i < 366; i++) {
    const fechaISO = desplazar(hoyISO, -i)
    if (activos.has(fechaISO)) {
      racha++
      huecosSeguidos = 0
    } else if (congelados.has(fechaISO)) {
      huecosSeguidos = 0
    } else if (fechaISO === hoyISO) {
      // Hoy todavía no cuenta como fallo.
    } else {
      huecosSeguidos++
      if (huecosSeguidos >= 2) break
    }
  }

  return { rachaActual: racha, hoyActivo: activos.has(hoyISO), dias }
}
