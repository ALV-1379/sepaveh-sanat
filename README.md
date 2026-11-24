# Sepaveh Sanat Naghsh Jahan

React corporate website and Express/PostgreSQL CMS in one JavaScript monorepo.

| Directory | Purpose |
| --- | --- |
| `frontend/` | Vite, React Router, Tailwind, public site and two administration layouts |
| `backend/` | REST API, authentication, CMS, local storage and analytics |
| `backend/prisma/` | Data model, SQL migrations, first-admin bootstrap, sample content |
| `infrastructure/` | Nginx proxy, static server and backup script |

## Windows and WSL2

Install Git and Docker Desktop with the WSL2 engine. Enable Docker integration for your chosen Linux distribution. In PowerShell, open the existing clone with `Set-Location C:\Projects\sepaveh-sanat`. To use Linux file permissions and faster hot reload, run Compose from a WSL2 checkout on the Linux filesystem.

Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell or `cp .env.example .env` in Bash). Set the following values before running Compose:

The Dockerfiles use anonymous public images from Microsoft Container Registry for Node.js, Amazon ECR Public for PostgreSQL, and GitHub Container Registry for unprivileged Nginx. This avoids Docker Hub authentication. The image names can be overridden with `NODE_IMAGE`, `POSTGRES_IMAGE`, and `NGINX_IMAGE` when an organization supplies an internal mirror.

- Generate independent values for `POSTGRES_PASSWORD` and `JWT_SECRET`. Use a password manager or `openssl rand -hex 32` from WSL2. Keep the JWT secret at least 32 characters long.
- Set `DATABASE_URL` to `postgresql://sepaveh:YOUR_PASSWORD@db:5432/sepaveh` with the actual URL-encoded password and matching database name and username. Hex passwords require no encoding.
- Set `UPLOAD_HOST_DIR` to a persistent bind mount. The Linux production default is `/u01/services/sepawe/uploads`. For Windows development, use an existing directory such as `C:/Projects/sepaveh-sanat/uploads`.
- On Linux production hosts, create the upload directory with write permission for the backend container's UID 1000. For example, use `sudo install -d -o 1000 -g 1000 -m 0750 /u01/services/sepawe/uploads`.
- In production set `APP_ORIGIN` to the exact public HTTPS origin, with no trailing slash. The proxy publishes privately on loopback. Put your TLS terminator on the same host in front of it and enable HTTP/2 there. If changing the development port, set `DEV_ORIGIN` to match the new browser origin.

## Development

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build --wait
```

Open `http://localhost:8080/` for Persian, `/en/` for English, `/admin` for content and `/super-admin` for system administration. Development startup seeds editable company content based on the public information at `https://sepaveh.com/`, together with English translations and generated factory imagery. Its upserts preserve existing entries. Source edits hot-reload. Dependency and Prisma schema edits require rebuilding the images. Containers use their own Linux dependencies.

The development-only Super Admin is created automatically with email `alavimohammad93@gmail.com` and password `Hibye@1234512345`. Change `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD` in `.env` for shared development environments. Production startup never creates this account. The admin UI uses short-lived JWT access tokens in HttpOnly cookies, rotates refresh tokens, and validates authorization on the backend.

### First administrator

From Bash or WSL2, use a random password saved in your password manager. The prompt hides it. Run once after the database is healthy:

```bash
read -r -p "Administrator email: " BOOTSTRAP_EMAIL
read -r -s -p "Administrator password: " BOOTSTRAP_PASSWORD
printf '\n'
export BOOTSTRAP_EMAIL BOOTSTRAP_PASSWORD
docker compose exec -e BOOTSTRAP_EMAIL -e BOOTSTRAP_PASSWORD backend npm run bootstrap -w backend
unset BOOTSTRAP_EMAIL BOOTSTRAP_PASSWORD
```

The bootstrap takes a database lock and refuses to create an account after the first account exists. Sign in at `/super-admin` and create Content Admin accounts there.

### Run checks

Use Node.js 22.12+ and a separate PostgreSQL test database for integration tests.

```bash
npm ci
npm run generate -w backend
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/TEST_DATABASE'
npm run migrate -w backend
npm run lint
npm test
npm run build
```

The application generates Prisma Client and applies checked-in migrations with version-pinned npm packages. The optional Prisma CLI authoring workflow needs access to `binaries.prisma.sh` for its verified native engine download. The database-backed integration test skips when `DATABASE_URL` is absent. It creates and cleans up isolated test records. Use a disposable database.

## Production

```bash
docker compose up -d --build --wait
docker compose ps
```

The backend applies checked-in Prisma migrations at startup. To apply them explicitly, run `docker compose exec backend npm run migrate -w backend`. Review schema changes with a development database and `prisma migrate dev`, then commit the new migration. Use the demo seed only where sample content is wanted.

GitLab stages check the project, build frontend and backend images independently, and push from the default branch. Deployment is manual on a runner tagged `production`. Set `DEPLOY_DIRECTORY` to the location of the matching Compose configuration and configure the deployment host's registry credentials securely. Private registries may use GitLab masked variables `REGISTRY_IMAGE_BASE`, `PRIVATE_REGISTRY_HOST`, `PRIVATE_REGISTRY_USER` and `PRIVATE_REGISTRY_PASSWORD`.

## Backup and restore

Run `sh infrastructure/scripts/backup.sh /path/to/backups` from the repository root. Store the resulting paired database dump and upload archive together in protected storage. Schedule backups during a period without content changes to keep the database and media snapshot consistent.

To restore, stop writes, provision a fresh database and upload directory, and verify the backup belongs to this installation. Stream the database dump into `pg_restore --exit-on-error --no-owner` inside the database service and unpack the trusted upload archive into the empty bind mount. Check upload ownership, start the application, and verify health, sign-in and media. Rehearse recovery in an isolated environment before replacing live data.

## Git and troubleshooting

Work on `codex/initial-implementation` for the first review. Keep `.env`, uploads and generated dependencies out of commits. Run lint, tests and build before merging.

- For startup errors use `docker compose ps` and `docker compose logs backend db nginx`. A database authentication error usually indicates that `DATABASE_URL` and the initialized database credentials differ.
- Check the bind mount and UID 1000 permissions for upload failures.
- A 403 on a write usually indicates that the browser origin differs from `APP_ORIGIN` or `DEV_ORIGIN`.
- For native Prisma CLI engine download failures, check access to `binaries.prisma.sh` with TLS and checksum verification enabled.
- HTTPS is required for secure administration cookies in production.

## Implementation status

The initial implementation covers localized public content and forms, CMS draft editing and publishing, typed page sections, product and project detail fields, local media upload, fixed administrative roles, audit records and consent-based analytics. Publication snapshots a CMS draft into a separate public value so editing a draft leaves the current published content intact.

Remaining items include public SSR or prerendering with HTTP 404 responses, Lighthouse target verification, configurable roles and granular permissions, system settings and backup management interfaces, reference-aware media deletion, advanced taxonomy and navigation management, and browser coverage across Windows and production. Production rollout requires actual content, HTTPS and a reviewed security and recovery configuration.

### CMS conventions and browser smoke test

Publish a `MENU` entry with slug `main` to replace the localized public navigation. Use an empty target for the home page and paths such as `products` for other links. A `BANNER` entry with slug `home` adds a notice to the matching home page. Site name, logo and accent color come from the `SETTINGS` entry with slug `site`.

For the browser smoke test, use a seeded disposable installation, supply its Super Admin credentials via `E2E_EMAIL` and `E2E_PASSWORD`, and set `E2E_BASE_URL` and `BROWSER_PATH` when needed. Run `npm run test:e2e -w frontend`. The test submits a sample quotation.

Docker builds behind an enterprise TLS proxy can mount their trusted CA as an optional BuildKit secret named `build_ca`. Pass it with `docker build --secret id=build_ca,src=/path/to/trusted-ca.crt ...` or declare it under each service's `build.secrets` in a local Compose overlay.

### Validation snapshot

On the Linux cloud workspace, lint, the frontend production build, seven automated tests, and a Chromium smoke flow through the development stack passed. Development and production-profile Compose services responded through Nginx. A backup was restored to a disposable PostgreSQL database and upload directory. The GitLab pipeline and Windows/WSL2 workflow still need validation in their target environments.

A local mobile Lighthouse run against the production-profile homepage measured performance 85/100, LCP 4.4 seconds, CLS 0, and total blocking time 30 ms. INP needs an interaction or field measurement. The performance and LCP targets remain open.
