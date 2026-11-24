ARG NODE_IMAGE=mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm
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

FROM development AS dependencies
USER root
RUN npm prune --omit=dev --workspace backend --no-audit --ignore-scripts \
    && node -e "if (!require('@prisma/client').PrismaClient) process.exit(1)"

FROM runtime AS production
COPY --chown=node:node package.json ./
COPY --chown=node:node frontend/package.json frontend/package.json
COPY --chown=node:node backend/package.json backend/package.json
COPY --chown=node:node backend/src backend/src
COPY --chown=node:node backend/prisma backend/prisma
COPY --from=dependencies --chown=node:node /app/node_modules node_modules
RUN mkdir /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 3000
CMD ["npm", "start", "-w", "backend"]
