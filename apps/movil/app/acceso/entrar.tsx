import { PantallaFormAcceso } from '@/auth/PantallaFormAcceso'

// Entrar: correo y contraseña de una cuenta que ya existe. Mensaje de error genérico si no
// cuadran, para no filtrar si el que falla es el correo o la contraseña.
export default function Entrar() {
  return <PantallaFormAcceso modo="acceso" />
}
