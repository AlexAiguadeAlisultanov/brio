// Cortafuegos de coste. Cuenta las peticiones al LLM por día natural y, al superar el
// tope, abre el circuito: el proxy deja de llamar al modelo y responde que la app use su
// respaldo local. Protege contra un abuso distribuido que dispare el gasto de la API.

const TOPE = Number(process.env.TOPE_PETICIONES_DIA ?? 500)

let diaActual = ''
let contador = 0

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

function reiniciarSiCambiaElDia(): void {
  const d = hoy()
  if (d !== diaActual) {
    diaActual = d
    contador = 0
  }
}

// ¿Hay cupo para una llamada más al LLM hoy?
export function hayCupo(): boolean {
  reiniciarSiCambiaElDia()
  return contador < TOPE
}

// Registra una llamada consumida.
export function registrarLlamada(): void {
  reiniciarSiCambiaElDia()
  contador++
}

export function estadoCircuito(): { usadas: number; tope: number; abierto: boolean } {
  reiniciarSiCambiaElDia()
  return { usadas: contador, tope: TOPE, abierto: contador >= TOPE }
}
