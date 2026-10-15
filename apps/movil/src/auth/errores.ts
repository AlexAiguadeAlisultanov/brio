// Error de la API de cuentas. Vive aparte, sin depender de la red ni de Expo, para que la
// validación (y sus tests) puedan razonar sobre él sin arrastrar el cliente entero.

export class ErrorApi extends Error {
  constructor(
    public codigo: string,
    public estado: number,
  ) {
    super(codigo)
  }
}
