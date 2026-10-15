import { useLang } from '../useLang'
import { Icon } from './Icon'
import { Reveal } from './Reveal'

export function Faq() {
  const { t } = useLang()
  return (
    <section className="seccion" id="faq">
      <div className="contenedor contenedor--estrecho">
        <Reveal className="seccion__encab">
          <span className="seccion__num">04</span>
          <h2 className="seccion__titulo">{t.faq.titulo}</h2>
        </Reveal>

        <div className="faq">
          {t.faq.items.map((item, i) => (
            <Reveal as="div" key={item.q} delay={i * 50}>
              <details className="faq__item">
                <summary className="faq__q">
                  <span>{item.q}</span>
                  <Icon nombre="chevron" size={18} className="faq__chevron" />
                </summary>
                <p className="faq__a">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
