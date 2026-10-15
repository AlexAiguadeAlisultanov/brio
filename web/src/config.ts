/* =============================================================================
 *  ENLACE DE DESCARGA DEL APK  ·  rellenar aqui, en un solo sitio
 * =============================================================================
 *
 *  Pega abajo la URL del .apk (la del build de EAS: `eas build -p android
 *  --profile preview`, o el enlace directo al artefacto que tu alojes).
 *
 *  Mientras valga "PENDIENTE_URL_APK", el boton de descarga sale como
 *  "Proximamente" y deshabilitado, para no enviar a nadie a un enlace roto.
 *  En cuanto pongas una URL real, el boton se activa solo.
 *
 *  Ejemplo:
 *    export const APK_URL = 'https://expo.dev/artifacts/eas/XXXXXXXX.apk'
 * ========================================================================== */

export const APK_URL: string = 'https://expo.dev/artifacts/eas/RuZ9_o4AyC9qNdOEpopwXP3tZKRRfLOI1JfHHI_A82A.apk'

// Valor centinela. Si APK_URL sigue siendo este texto, aun no hay enlace.
export const APK_PENDIENTE = 'PENDIENTE_URL_APK'

// ¿Hay un enlace de descarga real listo para usar?
export const apkDisponible = (): boolean =>
  APK_URL.trim().length > 0 && APK_URL !== APK_PENDIENTE
