// Catálogo de lo que es premium. Mantenerlo en un solo sitio evita que cada pantalla decida por
// su cuenta qué está tras el muro y que se desincronice con el de pago. Es lógica pura, probada.
//
// Gratis: montar el plan, Hoy, registrar series y comidas, cambiar comidas y ejercicios por el
// motor local, y el peso con su tendencia. Premium añade lo que se adapta a ti.

export type FuncionPremium = 'ia' | 'checkin' | 'objetivo' | 'compra' | 'prs'

export const FUNCIONES_PREMIUM: readonly FuncionPremium[] = ['ia', 'checkin', 'objetivo', 'compra', 'prs']

// ¿Puede una persona usar esta función con el plan que tiene? Los premium pueden con todo; los
// gratis, con todo lo que no esté en el catálogo de premium.
export function puedeUsar(funcion: FuncionPremium, esPremium: boolean): boolean {
  return esPremium || !FUNCIONES_PREMIUM.includes(funcion)
}
