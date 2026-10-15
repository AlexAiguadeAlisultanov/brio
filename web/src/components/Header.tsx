import { useEffect, useState } from 'react'
import { IDIOMAS } from '../i18n'
import { useLang } from '../useLang'
import { BotonDescarga } from './BotonDescarga'
import logo from '../assets/logo.png'

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="Brío">
      <img src={logo} width="32" height="32" alt="" />
      <span>Brío</span>
    </a>
  )
}

function SelectorIdioma() {
  const { lang, setLang } = useLang()
  return (
    <div className="idiomas" role="group" aria-label="Idioma">
      {IDIOMAS.map((i) => (
        <button
          key={i.codigo}
          type="button"
          className={`idiomas__btn ${lang === i.codigo ? 'idiomas__btn--on' : ''}`}
          aria-pressed={lang === i.codigo}
          aria-label={i.nombre}
          onClick={() => setLang(i.codigo)}
        >
          {i.etiqueta}
        </button>
      ))}
    </div>
  )
}

export function Header() {
  const { t } = useLang()
  const [compacta, setCompacta] = useState(false)

  useEffect(() => {
    const alScroll = () => setCompacta(window.scrollY > 12)
    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [])

  return (
    <header className={`cabecera ${compacta ? 'cabecera--compacta' : ''}`}>
      <div className="contenedor cabecera__fila">
        <Logo />
        <nav className="cabecera__nav" aria-label="Secciones">
          <a href="#funciones">{t.nav.funciones}</a>
          <a href="#capturas">{t.nav.capturas}</a>
          <a href="#faq">{t.nav.faq}</a>
        </nav>
        <div className="cabecera__acciones">
          <SelectorIdioma />
          <BotonDescarga className="cabecera__descarga" />
        </div>
      </div>
    </header>
  )
}
