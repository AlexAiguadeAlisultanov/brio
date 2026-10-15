import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// Aparicion suave al entrar en pantalla. Si el sistema pide menos movimiento, el contenido
// se muestra directamente (el CSS anula la transicion con prefers-reduced-motion).

interface Props {
  children: ReactNode
  as?: 'div' | 'section' | 'li' | 'article'
  className?: string
  delay?: number
  id?: string
}

export function Reveal({ children, as = 'div', className = '', delay = 0, id }: Props) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            setVisible(true)
            obs.unobserve(e.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    obs.observe(nodo)
    return () => obs.disconnect()
  }, [])

  const Etiqueta = as as 'div'
  return (
    <Etiqueta
      ref={ref as React.Ref<HTMLDivElement>}
      id={id}
      className={`reveal ${visible ? 'reveal--on' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Etiqueta>
  )
}
