ARG NODE_IMAGE=mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm
ARG NGINX_IMAGE=ghcr.io/nginxinc/nginx-unprivileged:stable-alpine
FROM ${NODE_IMAGE} AS development
USER root
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN --mount=type=secret,id=build_ca if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; npm ci --workspace frontend --include-workspace-root --no-audit --fetch-retries=1 --fetch-timeout=30000
COPY frontend frontend
EXPOSE 5173
CMD ["npm", "run", "dev", "-w", "frontend"]

FROM development AS build
RUN npm run build

FROM ${NGINX_IMAGE} AS production
COPY --chmod=644 infrastructure/nginx/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
