# Brío · landing

Página de presentación y descarga de la app Brío. Es un sitio estático e independiente
(no toca el motor, la app móvil ni el proxy): se compila a HTML, CSS y JS y se puede
servir tal cual en GitHub Pages, Render static o cualquier hosting de ficheros, sin backend
ni llamadas a ninguna API.

## Stack

Vite + React + TypeScript, el mismo que el resto de proyectos del portfolio. Sin librerías
de UI, animación ni iconos: los iconos son SVG propios de una sola familia de línea y el
movimiento es CSS más IntersectionObserver, respetando `prefers-reduced-motion`.

## Comandos

```bash
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # genera la carpeta estática dist/
npm run preview   # sirve lo compilado para revisarlo
```

El resultado publicable queda en `dist/`.

## El enlace de descarga del APK

La URL del `.apk` se pone en un único sitio: la constante `APK_URL` en
[`src/config.ts`](./src/config.ts). Mientras valga `PENDIENTE_URL_APK`, el botón de
descarga sale como "Próximamente" y deshabilitado. En cuanto pegues ahí la URL real del
build de EAS, el botón se activa solo.

## Idiomas

Español (por defecto), català e inglés, con selector en la cabecera. Todo el texto vive en
`src/i18n.ts`, con el español como fuente de verdad del tipo (los otros dos lo cumplen con
`satisfies`, así no se queda nada sin traducir).
