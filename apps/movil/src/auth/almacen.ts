import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Guarda el token de sesión. En móvil usa el almacén seguro del sistema (Keychain/Keystore);
// en web, donde SecureStore no existe, cae a localStorage. El token es lo único que se
// persiste; los datos del cuerpo siguen en la base local del dispositivo.

const CLAVE = 'brio.token'

export async function guardarToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(CLAVE, token)
    } catch {
      // Sin localStorage (SSR/export): no se persiste, la sesión dura lo que la app abierta.
    }
    return
  }
  await SecureStore.setItemAsync(CLAVE, token)
}

export async function leerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(CLAVE) ?? null
    } catch {
      return null
    }
  }
  return SecureStore.getItemAsync(CLAVE)
}

export async function borrarToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(CLAVE)
    } catch {
      // nada
    }
    return
  }
  await SecureStore.deleteItemAsync(CLAVE)
}
