import { ErrorApi } from './errores'

// Validación de las credenciales y traducción de los errores del servidor a un mensaje con voz
// humana. Es lógica pura (sin React ni red) para poder probarla y para que registro y acceso
// compartan exactamente las mismas reglas.

export type ClaveErrorAcceso =
  | 'emailInvalido'
  | 'passwordCorta'
  | 'emailUsado'
  | 'credenciales'
  | 'sinConexion'
  | 'generico'

export const LARGO_MINIMO_PASSWORD = 8

// Un correo con una arroba y un dominio con punto. No pretende validar el estándar entero: solo
// atrapar lo que es claramente un error de tecleo antes de molestar al servidor.
export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function passwordValida(password: string): boolean {
  return password.length >= LARGO_MINIMO_PASSWORD
}

// Revisa el formulario antes de enviarlo. Devuelve la primera clave de error, o null si todo va.
export function validarCredenciales(email: string, password: string): ClaveErrorAcceso | null {
  if (!emailValido(email)) return 'emailInvalido'
  if (!passwordValida(password)) return 'passwordCorta'
  return null
}

// Traduce lo que lanza la API a una clave de error. El correo ya en uso solo tiene sentido al
// registrarse; las credenciales inválidas, al entrar. El mensaje de credenciales es genérico a
// propósito (no decimos si falla el correo o la contraseña).
export function mapearErrorAcceso(error: unknown, modo: 'registro' | 'acceso'): ClaveErrorAcceso {
  if (error instanceof ErrorApi) {
    if (error.estado === 0) return 'sinConexion'
    if (modo === 'registro' && error.estado === 409) return 'emailUsado'
    if (modo === 'acceso' && (error.estado === 401 || error.estado === 400)) return 'credenciales'
  }
  return 'generico'
}
