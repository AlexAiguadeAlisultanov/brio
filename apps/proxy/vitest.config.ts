import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20000,
    // Los tests nunca deben tocar una base remota, aunque el entorno tenga BRIO_DB_URL puesto.
    env: { BRIO_DB_URL: '', BRIO_DB_TOKEN: '' },
  },
})
