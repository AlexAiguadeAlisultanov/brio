import { VERSION_MOTOR } from '@brio/motor'

import { Placeholder } from '@/componentes/placeholder'

// TODO(app-designer): pantalla "Perfil". Datos y restricciones, idioma (useLocale), tema,
// consentimiento del LLM (opt-in) y "borrar todos mis datos" (repo.borrarTodosMisDatos).
// La versión del motor se muestra como dato de "acerca de" y, de paso, confirma que el
// paquete @brio/motor (TypeScript puro) se resuelve y se empaqueta desde la app.
export default function Perfil() {
  return <Placeholder titulo="Perfil" descripcion="Placeholder." pie={`TODO(app-designer): ajustes y datos. Motor ${VERSION_MOTOR}`} />
}
