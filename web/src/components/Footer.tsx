import { REPO_URL } from '../i18n'
import { useLang } from '../useLang'
import { Icon } from './Icon'
import logo from '../assets/logo.png'

export function Footer() {
  const { t } = useLang()
  return (
    <footer className="pie">
      <div className="contenedor pie__grid">
        <div className="pie__marca">
          <a className="logo" href="#top" aria-label="Brío">
            <img src={logo} width="28" height="28" alt="" />
            <span>Brío</span>
          </a>
          <p className="pie__tagline">{t.footer.tagline}</p>
        </div>

        <nav className="pie__nav" aria-label="Secciones">
          <a href="#funciones">{t.nav.funciones}</a>
          <a href="#capturas">{t.nav.capturas}</a>
          <a href="#descarga">{t.nav.descarga}</a>
          <a href="#faq">{t.nav.faq}</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="pie__repo">
            <Icon nombre="github" size={16} />
            {t.footer.repo}
          </a>
        </nav>
      </div>

      <div className="contenedor">
        <p className="pie__disclaimer">{t.footer.disclaimer}</p>
        <div className="pie__base">
          <span>{t.footer.copyright}</span>
          <span>{t.footer.credito}</span>
        </div>
      </div>
    </footer>
  )
}
