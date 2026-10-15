import { useLang } from '../useLang'
import { Icon, type NombreIcono } from './Icon'
import { Reveal } from './Reveal'

export function Features() {
  const { t } = useLang()
  return (
    <section className="seccion" id="funciones">
      <div className="contenedor">
        <Reveal className="seccion__encab">
          <span className="seccion__num">01</span>
          <h2 className="seccion__titulo">{t.funciones.titulo}</h2>
          <p className="seccion__intro">{t.funciones.intro}</p>
        </Reveal>

        <ul className="rejilla-func">
          {t.funciones.items.map((f, i) => (
            <Reveal as="li" className="func" key={f.titulo} delay={(i % 3) * 70}>
              <span className="func__icono">
                <Icon nombre={f.icono as NombreIcono} size={22} />
              </span>
              <h3 className="func__titulo">{f.titulo}</h3>
              <p className="func__texto">{f.texto}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
