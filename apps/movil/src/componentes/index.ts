// Librería de componentes compartidos de Brío. Todo lo que construye el onboarding y
// reutilizarán las pestañas sale de aquí, montado sobre los tokens de tema.

export { Texto, tocar, useMovimientoReducido, usePulsacion } from './base'
export { BotonPrimario, BotonSecundario, BotonTexto } from './botones'
export { PantallaOnboarding } from './PantallaOnboarding'
export { BarraProgreso } from './BarraProgreso'
export { ControlSegmentado, type OpcionSegmento } from './ControlSegmentado'
export { Chip, ChipRestriccion } from './Chip'
export { CampoNumerico } from './CampoNumerico'
export { TarjetaSeleccion } from './TarjetaSeleccion'
export { AvisoMedico } from './AvisoMedico'
export { TarjetaResumenPlan } from './TarjetaResumenPlan'
export { numero } from './formato'

// Fase 2A: uso diario.
export { Anillos } from './Anillos'
export { HojaInferior } from './HojaInferior'
export { IndicadorOrigen, type Origen } from './IndicadorOrigen'
export { SenalesDeParada } from './SenalesDeParada'
export { SelectorMotivoCambio, type MotivoOpcion } from './SelectorMotivoCambio'
export { TarjetaComida } from './TarjetaComida'
export { TarjetaEjercicio } from './TarjetaEjercicio'
export { FilaSerie, type DatosSerie } from './FilaSerie'
export { TemporizadorDescanso } from './TemporizadorDescanso'
export { HojaSustitucionComida } from './HojaSustitucionComida'
export { HojaSustitucionEjercicio } from './HojaSustitucionEjercicio'
export { HojaCheckin } from './HojaCheckin'
export { HojaFeedbackSesion } from './HojaFeedbackSesion'

// Fase 2B: plan de la semana, progreso y perfil.
export { PantallaScroll } from './PantallaScroll'
export { EstadoVacio } from './EstadoVacio'
export { GraficoTendencia } from './GraficoTendencia'

// Cuentas y premium.
export { Hero } from './Hero'
export { CampoTexto } from './CampoTexto'
export { InsigniaPremium, MuroPremium } from './premium'
