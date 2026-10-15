import { apkDisponible } from '../config'
import { useLang } from '../useLang'
import { BotonDescarga } from './BotonDescarga'
import { Icon } from './Icon'
import { Reveal } from './Reveal'

export function Download() {
  const { t } = useLang()
  const listo = apkDisponible()
  return (
    <section className="seccion seccion--descarga" id="descarga">
      <div className="contenedor">
        <Reveal className="descarga">
          <div className="descarga__fondo" aria-hidden="true" />
          <span className="seccion__num seccion__num--claro">03</span>
          <h2 className="descarga__titulo">{t.descarga.titulo}</h2>
          <p className="descarga__texto">{t.descarga.texto}</p>

          <div className="descarga__accion">
            <BotonDescarga tamano="grande" />
            <span className="descarga__req">
              <Icon nombre="phone" size={15} />
              {t.descarga.requisitos}
            </span>
          </div>

          {!listo && <p className="descarga__pendiente">{t.descarga.pendienteNota}</p>}

          <p className="descarga__instalar">{t.descarga.instalar}</p>

          <div className="descarga__beta">
            <strong>{t.descarga.betaTitulo}</strong>
            <p>{t.descarga.betaTexto}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
