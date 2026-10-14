import { crearApp } from './app'

const puerto = Number(process.env.PORT ?? 8099)
const app = crearApp()

app.listen(puerto, () => {
  // Sin datos sensibles en el log, solo el arranque.
  console.log(`Proxy de Brío escuchando en el puerto ${puerto}`)
})
