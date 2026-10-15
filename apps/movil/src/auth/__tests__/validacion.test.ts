import { describe, expect, it } from 'vitest'

import { ErrorApi } from '../errores'
import { emailValido, mapearErrorAcceso, passwordValida, validarCredenciales } from '../validacion'

describe('validación de credenciales', () => {
  it('acepta correos con forma válida y rechaza los que no', () => {
    expect(emailValido('ana@correo.com')).toBe(true)
    expect(emailValido('ana+etiqueta@sub.correo.es')).toBe(true)
    expect(emailValido('ana@correo')).toBe(false)
    expect(emailValido('ana correo.com')).toBe(false)
    expect(emailValido('')).toBe(false)
  })

  it('exige al menos 8 caracteres de contraseña', () => {
    expect(passwordValida('1234567')).toBe(false)
    expect(passwordValida('12345678')).toBe(true)
  })

  it('validarCredenciales devuelve la primera pega, o null si todo va', () => {
    expect(validarCredenciales('mal', 'x')).toBe('emailInvalido')
    expect(validarCredenciales('ana@correo.com', 'corta')).toBe('passwordCorta')
    expect(validarCredenciales('ana@correo.com', 'contrasenalarga')).toBeNull()
  })
})

describe('mapeo de errores del servidor', () => {
  it('sin conexión (estado 0) en los dos modos', () => {
    expect(mapearErrorAcceso(new ErrorApi('sin_conexion', 0), 'registro')).toBe('sinConexion')
    expect(mapearErrorAcceso(new ErrorApi('sin_conexion', 0), 'acceso')).toBe('sinConexion')
  })

  it('correo ya en uso solo al registrarse', () => {
    expect(mapearErrorAcceso(new ErrorApi('email_en_uso', 409), 'registro')).toBe('emailUsado')
    // El mismo 409 entrando no es "correo en uso": cae a genérico.
    expect(mapearErrorAcceso(new ErrorApi('email_en_uso', 409), 'acceso')).toBe('generico')
  })

  it('credenciales inválidas solo al entrar (401/400)', () => {
    expect(mapearErrorAcceso(new ErrorApi('no_autorizado', 401), 'acceso')).toBe('credenciales')
    expect(mapearErrorAcceso(new ErrorApi('datos', 400), 'acceso')).toBe('credenciales')
    expect(mapearErrorAcceso(new ErrorApi('no_autorizado', 401), 'registro')).toBe('generico')
  })

  it('cualquier otra cosa es genérico', () => {
    expect(mapearErrorAcceso(new Error('vaya'), 'acceso')).toBe('generico')
    expect(mapearErrorAcceso(new ErrorApi('server', 500), 'registro')).toBe('generico')
  })
})
