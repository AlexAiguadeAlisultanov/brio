// Puente a los símbolos de ejecución de expo-sqlite (nativo). Existe para aislar el único
// punto donde expo-sqlite entra en tiempo de ejecución: en web, Metro resuelve en su lugar
// sqlite-runtime.web.ts, así que expo-sqlite no acaba en el empaquetado del navegador.
export { SQLiteProvider, useSQLiteContext } from 'expo-sqlite'
