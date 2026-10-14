// Configuración de Metro para un monorepo con workspaces de npm.
// La app vive en apps/movil y consume @brio/motor (TypeScript puro) desde packages/motor.
// Metro necesita vigilar la raíz del monorepo y saber resolver los node_modules de la raíz,
// y transpilar el motor como código fuente (no es un paquete compilado).

const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const raizApp = __dirname
const raizMonorepo = path.resolve(raizApp, '..', '..')

const config = getDefaultConfig(raizApp)

// 1. Vigilar toda la raíz del monorepo para captar cambios en packages/motor.
config.watchFolders = [raizMonorepo]

// 2. Resolver primero los node_modules de la app y luego los de la raíz.
config.resolver.nodeModulesPaths = [
  path.resolve(raizApp, 'node_modules'),
  path.resolve(raizMonorepo, 'node_modules'),
]

// 3. El motor declara su entrada con el campo "exports" apuntando a src/index.ts.
//    Dejamos que Metro lea ese campo para resolver el paquete a su fuente TypeScript,
//    que el transformador de Expo (babel-preset-expo) transpila igual que el resto.
config.resolver.unstable_enablePackageExports = true

module.exports = config
