import { useLang } from '../useLang'
import { BotonDescarga } from './BotonDescarga'
import { Icon } from './Icon'
import { PhoneMockup } from './PhoneMockup'

export function Hero() {
  const { t } = useLang()
  return (
    <section className="hero" id="top">
      <div className="hero__fondo" aria-hidden="true" />
      <div className="contenedor hero__grid">
        <div className="hero__texto">
          <span className="eyebrow">
            <Icon nombre="flame" size={14} />
            {t.hero.eyebrow}
          </span>
          <h1 className="hero__titulo">{t.hero.titulo}</h1>
          <p className="hero__sub">{t.hero.sub}</p>

          <div className="hero__ctas">
            <BotonDescarga tamano="grande" />
            <a className="boton boton--contorno" href="#funciones">
              {t.hero.ctaSecundario}
              <Icon nombre="arrow" size={18} />
            </a>
          </div>

          <p className="hero__disclaimer">{t.hero.disclaimer}</p>

          <ul className="tiras">
            {t.tiras.map((tira) => (
              <li key={tira}>
                <Icon nombre="check" size={15} />
                {tira}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__visual">
          <div className="hero__halo" aria-hidden="true" />
          <PhoneMockup pantalla="hoy" className="telefono--hero" />
        </div>
      </div>
    </section>
  )
}
