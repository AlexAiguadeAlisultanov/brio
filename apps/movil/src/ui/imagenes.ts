import type { ImageSource } from 'expo-image'

// Fotos de hero. Son fotografías libres de un banco (Unsplash), servidas desde su CDN con el
// tamaño justo. El velo oscuro del componente Hero garantiza que el texto se lea aunque la foto
// tarde o no cargue, así que el export web nunca depende de ellas. Si algún día se quiere todo
// empaquetado, basta con cambiar estas URLs por require() de ficheros locales.

export const HERO_ACCESO: ImageSource = {
  uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1080&q=70',
}

export const HERO_PREMIUM: ImageSource = {
  uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1080&q=70',
}
