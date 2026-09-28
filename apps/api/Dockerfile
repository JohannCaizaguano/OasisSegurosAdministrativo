# syntax=docker/dockerfile:1
# Imagen del API y del worker (misma imagen; cambia el CMD) + target migrator.
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    HUSKY=0 \
    DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

# ---- Dependencias -----------------------------------------------------------
FROM base AS fetch
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ---- Compilación ------------------------------------------------------------
FROM fetch AS build
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline
RUN pnpm --filter @oasis/shared build \
 && pnpm --filter @oasis/api exec prisma generate \
 && pnpm --filter @oasis/api build

# ---- Migrador (tarea única: prisma migrate deploy) --------------------------
# Sin pnpm en runtime: se ejecuta el CLI de Prisma directamente (la red
# `internal` no tiene salida a Internet, y corepack descargaría pnpm).
FROM base AS migrator
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# ---- Paquete de producción (pnpm deploy) ------------------------------------
# --legacy copia las dependencias del workspace (pnpm >= 10).
FROM base AS deploy
COPY --from=build /repo /repo
RUN pnpm --filter @oasis/api deploy --legacy --prod /app

# ---- Runtime ----------------------------------------------------------------
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --uid 10001 oasis
WORKDIR /app
COPY --from=deploy /app /app
USER oasis
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
