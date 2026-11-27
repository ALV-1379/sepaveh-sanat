# Running Sepaveh Sanat locally

Run all commands from the repository root, the folder that contains `package.json` and `docker-compose.yml`. Use Docker Compose for the quickest setup. Choose the native workflow if you need to debug Node directly.

## Option 1. Docker Compose

Install Git and Docker with the Compose V2 plugin. On Windows, start Docker Desktop in Linux containers mode. Confirm that `docker version` shows a Server section and `docker compose version` prints a version.

If you do not already have a `.env`, copy `.env.example` and create the upload folder.

**PowerShell**

```powershell
Copy-Item .env.example .env
New-Item -ItemType Directory -Force uploads
```

**Bash or WSL**

```bash
cp .env.example .env
mkdir -p uploads
```

Edit `.env`. Keep the existing PostgreSQL password if you are reusing an initialized database volume. For a new database, replace `YOUR_DB_PASSWORD` in both lines with the same random password. Hex passwords can be used in the database URL without encoding. Keep the default database user and database name for this example.

```dotenv
POSTGRES_PASSWORD=YOUR_DB_PASSWORD
DATABASE_URL=postgresql://sepaveh:YOUR_DB_PASSWORD@db:5432/sepaveh
JWT_SECRET=YOUR_SEPARATE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
UPLOAD_HOST_DIR=./uploads
DEV_ORIGIN=http://localhost:8080
WEB_PORT=8080
```

Choose development credentials in `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`. Keep `.env` out of Git.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build --wait
```

Startup applies the migrations and loads sample content. Open [Persian](http://localhost:8080/), [English](http://localhost:8080/en/), [Content Admin](http://localhost:8080/admin), or [Super Admin](http://localhost:8080/super-admin). Sign in with the development credentials from `.env`.

Source edits in `frontend/src` and `backend/src` reload during development. Rebuild for package, Prisma, seed, or `frontend/public` changes.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=100 backend db nginx
docker compose -f docker-compose.yml -f docker-compose.dev.yml stop
```

`stop` retains the database and uploads. Use the same `up` command to resume.

## Option 2. Run Node directly

Use Node.js 22.12 or newer, npm, and a running PostgreSQL instance with a disposable development database. The commands below use Bash or WSL. In PowerShell, set each environment variable with `$env:NAME = 'value'` instead of `export`.

In terminal 1, replace the database credentials and JWT secret with your local values.

```bash
npm ci
npm run generate -w backend
export DATABASE_URL='postgresql://sepaveh:YOUR_DB_PASSWORD@127.0.0.1:5432/sepaveh'
export JWT_SECRET='YOUR_SEPARATE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS'
export APP_ORIGIN='http://localhost:5173'
export NODE_ENV=development
export DEMO_ADMIN_EMAIL='dev-admin@example.com'
export DEMO_ADMIN_PASSWORD='choose-a-private-local-password'
npm run migrate -w backend
npm run seed -w backend
npm run dev -w backend
```

In terminal 2, from the repository root:

```bash
npm run dev -w frontend -- --port 5173 --strictPort
```

Open [localhost:5173](http://localhost:5173/). Vite proxies `/api` to the backend on port 3000. If you change the frontend port, change `APP_ORIGIN` to the exact browser origin. If you change the backend port, set `API_PROXY` before starting Vite. A local PostgreSQL URL uses `127.0.0.1` and the database's published port. The Compose URL uses its internal hostname `db`.

## Checks before opening a pull request

```bash
npm ci
npm run generate -w backend
npm run lint
npm run format:check
npm test
npm run build
```

Use `npm run format` to apply Prettier. For database integration tests, set `DATABASE_URL` to a disposable test database and run `npm run migrate -w backend` before `npm test`. The database integration test skips if the variable is absent.

For the browser smoke test, run against a seeded disposable installation with Chromium available. Set `E2E_BASE_URL` to the site origin and set `E2E_EMAIL` and `E2E_PASSWORD` to the development admin credentials. Use `BROWSER_PATH` if Chromium is installed somewhere other than `/usr/bin/chromium`. Then run:

```bash
npm run test:e2e -w frontend
```

The browser test downloads the catalog and submits a sample quotation, then verifies the record in the admin inbox.

## Common startup problems

| Symptom                             | Check                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Docker daemon or named pipe missing | Start Docker Desktop, select Linux containers, and check `docker version`.                                                          |
| Registry returns 403                | Check whether the configured public registry is allowed on your network. Use your organization's approved image mirror if required. |
| Database rejects authentication     | Compare the connection URL with the database credentials used to initialize the volume.                                             |
| Login works but a write returns 403 | Match the browser origin exactly to `DEV_ORIGIN` for Compose or `APP_ORIGIN` for native development.                                |
| Images or uploads fail              | Check that `UPLOAD_HOST_DIR` exists and is writable by the backend container.                                                       |
| Port 8080 is already in use         | Pick another `WEB_PORT` and update `DEV_ORIGIN` to match.                                                                           |

For production deployment and trusted proxy CA configuration, see the [root README](../README.md). For the code structure and CMS workflow, see the [AI handoff guide](AI-HANDOFF.md).
