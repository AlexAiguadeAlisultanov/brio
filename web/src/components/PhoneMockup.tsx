import { useLang } from '../useLang'
import { Icon } from './Icon'

// Maqueta de telefono con pantallas fieles a las reales de la app (segun DISENO.md). Los
// numeros son ilustrativos, del mismo estilo que los ejemplos del diseno; no son el plan
// medico de nadie, solo una vista de producto.

export type Pantalla = 'hoy' | 'plan' | 'cambios' | 'progreso'

const RADIO_ANILLO = 52
const CIRC = 2 * Math.PI * RADIO_ANILLO

function BarraEstado() {
  return (
    <div className="mock__estado">
      <span className="mock__hora">9:41</span>
      <span className="mock__estado-iconos">
        <i className="mock__senal" />
        <i className="mock__bateria" />
      </span>
    </div>
  )
}

function Anillo({ progreso }: { progreso: number }) {
  const offset = CIRC * (1 - progreso)
  return (
    <svg className="mock__anillo" viewBox="0 0 120 120" width="150" height="150">
      <circle className="mock__anillo-pista" cx="60" cy="60" r={RADIO_ANILLO} />
      <circle
        className="mock__anillo-valor"
        cx="60"
        cy="60"
        r={RADIO_ANILLO}
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
      />
    </svg>
  )
}

function PantallaHoy() {
  const { t } = useLang()
  const m = t.mock
  const macros = [
    { etiqueta: m.proteina, valor: '120 g', pct: 0.73 },
    { etiqueta: m.carbos, valor: '180 g', pct: 0.86 },
    { etiqueta: m.grasa, valor: '48 g', pct: 0.8 },
  ]
  return (
    <div className="mock__lienzo">
      <div className="mock__cabecera">
        <h3 className="mock__titulo">{m.hoy}</h3>
      </div>
      <div className="mock__anillo-caja">
        <Anillo progreso={0.58} />
        <div className="mock__anillo-centro">
          <strong className="mock__num">910</strong>
          <span className="mock__num-pie">
            {m.kcal} · {m.restantes}
          </span>
        </div>
      </div>
      <div className="mock__macros">
        {macros.map((x) => (
          <div className="mock__macro" key={x.etiqueta}>
            <div className="mock__macro-fila">
              <span>{x.etiqueta}</span>
              <span className="mock__macro-val">{x.valor}</span>
            </div>
            <div className="mock__barra">
              <i style={{ width: `${Math.round(x.pct * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mock__tarjeta mock__tarjeta--fila">
        <span className="mock__icono-caja">
          <Icon nombre="flame" size={18} />
        </span>
        <div className="mock__tarjeta-txt">
          <strong>{m.entreno}</strong>
          <span>{m.entrenoDetalle}</span>
        </div>
        <Icon nombre="chevron" size={16} className="mock__chevron" />
      </div>
      <div className="mock__tarjeta">
        <div className="mock__tarjeta-encab">
          <span className="mock__icono-caja">
            <Icon nombre="utensils" size={18} />
          </span>
          <div className="mock__tarjeta-txt">
            <strong>{m.comidaNombre}</strong>
            <span>620 {m.kcal} · 48 g</span>
          </div>
          <span className="mock__chip">{m.registrar}</span>
        </div>
      </div>
    </div>
  )
}

function PantallaPlan() {
  const { t } = useLang()
  const m = t.mock
  const entrena = [true, true, false, true, true, false, false]
  const filas = [
    { dia: m.dias[0], txt: 'Torso' },
    { dia: m.dias[1], txt: 'Pierna' },
    { dia: m.dias[3], txt: 'Torso' },
  ]
  return (
    <div className="mock__lienzo">
      <div className="mock__cabecera">
        <h3 className="mock__titulo">{m.plan}</h3>
      </div>
      <div className="mock__tarjeta mock__tarjeta--resumen">
        <span className="mock__eti">{m.objetivo}</span>
        <strong className="mock__num mock__num--medio">
          2.150 <small>{m.kcal}</small>
        </strong>
        <div className="mock__pastillas">
          <span>P 165</span>
          <span>C 210</span>
          <span>G 60</span>
        </div>
      </div>
      <span className="mock__eti mock__eti--suelta">{m.semana}</span>
      <div className="mock__semana">
        {m.dias.map((d, i) => (
          <div className={`mock__dia ${entrena[i] ? 'mock__dia--on' : ''}`} key={`${d}-${i}`}>
            <span>{d}</span>
            <i />
          </div>
        ))}
      </div>
      <div className="mock__lista">
        {filas.map((f, i) => (
          <div className="mock__lista-fila" key={i}>
            <span className="mock__punto" />
            <strong>{f.dia}</strong>
            <span>{f.txt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PantallaCambios() {
  const { t, lang } = useLang()
  const m = t.mock
  return (
    <div className="mock__lienzo mock__lienzo--hoja">
      <div className="mock__asa" />
      <h3 className="mock__titulo mock__titulo--hoja">{m.cambiarComida}</h3>
      <div className="mock__motivos">
        <span className="mock__motivo mock__motivo--on">{m.noPuedo}</span>
        <span className="mock__motivo">{m.noApetece}</span>
      </div>
      <div className="mock__alt mock__alt--on">
        <div className="mock__tarjeta-txt">
          <strong>{m.alternativa}</strong>
          <span>{m.delta}</span>
        </div>
        <span className="mock__chip">{m.elegir}</span>
      </div>
      <div className="mock__alt">
        <div className="mock__tarjeta-txt">
          <strong>Tofu {lang === 'en' ? 'stir-fry' : 'salteado'}</strong>
          <span>−30 {m.kcal} · +6 g</span>
        </div>
        <span className="mock__chip mock__chip--fantasma">{m.elegir}</span>
      </div>
      <div className="mock__alt">
        <div className="mock__tarjeta-txt">
          <strong>{lang === 'ca' ? 'Llenties' : lang === 'en' ? 'Lentils' : 'Lentejas'}</strong>
          <span>+20 {m.kcal} · +10 g</span>
        </div>
        <span className="mock__chip mock__chip--fantasma">{m.elegir}</span>
      </div>
    </div>
  )
}

function PantallaProgreso() {
  const { t } = useLang()
  const m = t.mock
  // Linea de tendencia suavizada, ligera bajada. Puntos ilustrativos.
  const puntos = [8, 18, 14, 26, 30, 44, 52, 60]
  const ancho = 260
  const alto = 80
  const paso = ancho / (puntos.length - 1)
  const d = puntos.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * paso} ${y}`).join(' ')
  const area = `${d} L ${ancho} ${alto} L 0 ${alto} Z`
  return (
    <div className="mock__lienzo">
      <div className="mock__cabecera">
        <h3 className="mock__titulo">{m.progreso}</h3>
      </div>
      <div className="mock__tarjeta">
        <svg className="mock__grafico" viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none">
          <path className="mock__grafico-area" d={area} />
          <path className="mock__grafico-linea" d={d} />
        </svg>
      </div>
      <div className="mock__stats">
        <div className="mock__stat">
          <Icon nombre="trending" size={18} className="mock__stat-icono" />
          <div className="mock__tarjeta-txt">
            <strong>{m.ritmo}</strong>
          </div>
        </div>
        <div className="mock__stat">
          <Icon nombre="flame" size={18} className="mock__stat-icono" />
          <div className="mock__tarjeta-txt">
            <strong>{m.racha}</strong>
          </div>
        </div>
      </div>
      <div className="mock__adh">
        {Array.from({ length: 21 }).map((_, i) => (
          <i key={i} className={[2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20].includes(i) ? 'on' : ''} />
        ))}
      </div>
    </div>
  )
}

const PANTALLAS: Record<Pantalla, () => React.ReactElement> = {
  hoy: PantallaHoy,
  plan: PantallaPlan,
  cambios: PantallaCambios,
  progreso: PantallaProgreso,
}

export function PhoneMockup({ pantalla, className = '' }: { pantalla: Pantalla; className?: string }) {
  const Contenido = PANTALLAS[pantalla]
  return (
    <div className={`telefono ${className}`.trim()} aria-hidden="true">
      <div className="telefono__pantalla">
        <BarraEstado />
        <Contenido />
      </div>
    </div>
  )
}
