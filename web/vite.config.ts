import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ruta relativa en el build: asi la landing funciona igual servida desde la raiz de un
// dominio (Render static) o desde un subdirectorio (GitHub Pages de un repo).
export default defineConfig({
  base: './',
  plugins: [react()],
})
