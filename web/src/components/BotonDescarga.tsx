import { APK_URL, apkDisponible } from '../config'
import { useLang } from '../useLang'
import { Icon } from './Icon'

// Boton de descarga. Si APK_URL sigue en el valor centinela, sale como "Proximamente" y
// deshabilitado: nadie acaba en un enlace roto. En cuanto haya URL real, enlaza al .apk.

interface Props {
  tamano?: 'normal' | 'grande'
  className?: string
}

export function BotonDescarga({ tamano = 'normal', className = '' }: Props) {
  const { t } = useLang()
  const listo = apkDisponible()
  const clases = `boton boton--acento ${tamano === 'grande' ? 'boton--grande' : ''} ${
    listo ? '' : 'boton--pendiente'
  } ${className}`.trim()

  if (!listo) {
    return (
      <button type="button" className={clases} disabled aria-disabled="true">
        <Icon nombre="download" size={tamano === 'grande' ? 20 : 18} />
        {t.hero.ctaProximamente}
      </button>
    )
  }

  return (
    <a className={clases} href={APK_URL} download>
      <Icon nombre="download" size={tamano === 'grande' ? 20 : 18} />
      {tamano === 'grande' ? t.descarga.boton : t.hero.ctaDescargar}
    </a>
  )
}
