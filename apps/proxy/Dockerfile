# Imagen del proxy de Brío. El contexto de build es la RAÍZ del monorepo (para incluir
# packages/motor, del que depende). En render.yaml: dockerContext "." y dockerfilePath
# "apps/proxy/Dockerfile".
FROM node:24-slim

WORKDIR /repo

# Copia el monorepo (node_modules y dist quedan fuera por .dockerignore) e instala.
COPY . .
RUN npm ci

ENV NODE_ENV=production

# Render inyecta PORT; el proxy lo lee. Exponemos el valor por defecto.
EXPOSE 8099

# El proxy y el motor son TypeScript; tsx los transpila al vuelo (tsx es dependencia, no dev).
CMD ["npx", "tsx", "apps/proxy/src/index.ts"]
