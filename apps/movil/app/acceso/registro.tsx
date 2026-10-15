import { PantallaFormAcceso } from '@/auth/PantallaFormAcceso'

// Crear cuenta: correo y contraseña (mínimo 8). La validación y los errores viven en el
// formulario compartido.
export default function Registro() {
  return <PantallaFormAcceso modo="registro" />
}
