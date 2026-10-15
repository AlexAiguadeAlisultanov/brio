import { useLang } from '../useLang'
import { PhoneMockup } from './PhoneMockup'
import { Reveal } from './Reveal'

export function Showcase() {
  const { t } = useLang()
  return (
    <section className="seccion seccion--capturas" id="capturas">
      <div className="contenedor">
        <Reveal className="seccion__encab">
          <span className="seccion__num">02</span>
          <h2 className="seccion__titulo">{t.capturas.titulo}</h2>
          <p className="seccion__intro">{t.capturas.intro}</p>
        </Reveal>

        <div className="capturas">
          {t.capturas.items.map((c, i) => (
            <Reveal as="article" className="captura" key={c.pantalla} delay={i * 90}>
              <div className="captura__telefono">
                <PhoneMockup pantalla={c.pantalla} />
              </div>
              <div className="captura__pie">
                <span className="captura__eti">{c.etiqueta}</span>
                <h3 className="captura__titulo">{c.titulo}</h3>
                <p className="captura__texto">{c.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
