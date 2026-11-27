ARG NODE_IMAGE=mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm
ARG NODE_RUNTIME_IMAGE=public.ecr.aws/docker/library/node:22-bookworm-slim
FROM ${NODE_IMAGE} AS runtime
USER root
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM runtime AS development
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node frontend/package.json frontend/package.json
COPY --chown=node:node backend/package.json backend/package.json
RUN --mount=type=secret,id=build_ca if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; npm ci --no-audit --fetch-retries=1 --fetch-timeout=30000
COPY --chown=node:node backend backend
RUN npm run generate -w backend && mkdir /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 3000

FROM runtime AS dependencies
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN --mount=type=secret,id=build_ca if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; npm ci --omit=dev --workspace backend --no-audit --fetch-retries=1 --fetch-timeout=30000

FROM ${NODE_RUNTIME_IMAGE} AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node package.json ./
COPY --chown=node:node frontend/package.json frontend/package.json
COPY --chown=node:node backend/package.json backend/package.json
COPY --chown=node:node backend/src backend/src
COPY --chown=node:node backend/prisma backend/prisma
COPY --from=dependencies --chown=node:node /app/node_modules node_modules
COPY --from=development --chown=node:node /app/node_modules/.prisma node_modules/.prisma
RUN mkdir /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 3000
CMD ["node", "backend/src/server.js"]
