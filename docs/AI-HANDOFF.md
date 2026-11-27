# Sepaveh Sanat Naghsh Jahan AI handoff

Use this document to onboard another AI to the repository. Give it repository access and the path to this document, then describe the change you want. Treat the checked-out code and current configuration as the source of truth.

## Product and editing requirements

The project is a bilingual industrial company website and content management system for Sepaveh Sanat Naghsh Jahan. Public visitors browse equipment and projects, download a PDF catalog, and send inquiries without an account. Staff sign in to a Persian admin interface.

- Persian is the default language at `/`. English lives under `/en`. Preserve the radio-button language switch, direction, translated labels, and equivalent URLs. Admin panels use Persian and RTL.
- The brand uses the gold company logo, forest green, Caterpillar-style yellow, and industrial gray. Persian typography uses the supplied IRANYekan fonts. Keep the footer at the bottom on short pages and preserve reduced-motion behavior.
- Product cards use bounded image ratios and thumbnails. Detail photos use contained framing to keep equipment visible. Reserve eager loading for important above-the-fold assets.
- Keep product and project copy grounded in the supplied catalog, company material, or verified input. Clearly label demo entries and avoid presenting sample credentials, reviews, or performance claims as verified results.

## Code map

| Area                                                    | Start here                                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Routing and public shell                                | `frontend/src/app/router.jsx`, `frontend/src/panels/Public.jsx`                                     |
| Homepage, catalog collections, shared CMS detail layout | `frontend/src/pages/public/`                                                                        |
| Catalog preview and download                            | `frontend/src/components/common/CatalogShowcase.jsx`, `frontend/public/showcase/`                   |
| Forms, page blocks, media cards                         | `frontend/src/features/Inquiry.jsx`, `frontend/src/features/Blocks.jsx`                             |
| Axios and React Query                                   | `frontend/src/app/api.js`                                                                           |
| Content and system admin                                | `frontend/src/panels/Admin.jsx`, `Super.jsx`, `Panel.jsx`                                           |
| API entry and feature routes                            | `backend/src/app.js`, `backend/src/modules/`                                                        |
| Schema, migrations, editable sample content             | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/prisma/seed.js`              |
| Long-form English seed copy                             | `backend/prisma/englishContent.js`                                                                  |
| Local and production deployment                         | `docker-compose.yml`, `docker-compose.dev.yml`, both workspace Dockerfiles, `infrastructure/nginx/` |

Frontend is React and Vite. Public and admin code use React Router, Axios, and TanStack Query. The API is Express and PostgreSQL with Prisma. Nginx serves the production frontend and proxies API requests. Keep the API response types and React Query cache keys compatible with existing consumers.

## Content and quotation workflow

The CMS stores entries by type, locale, and slug. Saving edits changes the draft. Publishing changes what the public API serves. Edit and publish both language variants when updating bilingual content. Use `englishContent.js` and `seed.js` for sample content supplied with the repo. Development startup runs the seed. Existing editor-managed content should be reviewed and updated through the CMS.

The public quote form sends `QUOTE` to `POST /api/public/inquiries`. It requires a name, phone, address, preferred channel, and request details. The supported channel codes are `EITAA`, `TELEGRAM`, `WHATSAPP`, and `PHONE`. Product links can pass a product slug into the quote page. The standard `CONTACT` flow requires email. Staff read requests in `/admin/inquiries` and follow up manually.

Server-side validation lives in `backend/src/modules/content.js`. Keep it synchronized with frontend validation. Keep customer data in authenticated workflows and out of public assets, logs, and test fixtures committed to Git.

## Access and deployment

- `/admin` is for content, media, inbox, and analytics. `/super-admin` handles administrator accounts, audit activity, and system health. UI access checks complement the backend's role enforcement.
- Authentication uses JWT access and refresh cookies. Preserve HttpOnly cookies, refresh rotation, rate limits, and origin checks. Keep tokens and credentials out of browser storage and source control.
- Copy `.env.example` to a local `.env`. Set a database password, matching `DATABASE_URL`, an independent JWT secret, and the actual browser origin. In Windows development, create `uploads/` and set `UPLOAD_HOST_DIR=./uploads`. See the root README for the detailed startup sequence.
- The development startup command is `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build --wait`. The local site defaults to port 8080. Production uses the base Compose file with production environment settings.
- The production frontend serves built assets. The production API ships its runtime dependencies and generated Prisma client. Keep formatters, linters, and build tools in build or development stages.
- Put schema updates in a new forward migration and regenerate Prisma Client. Verify migration against a disposable PostgreSQL instance. Keep existing records and volume data intact.

## Verification

From the repository root, use Node.js 22.12 or newer.

```bash
npm ci
npm run generate -w backend
npm run lint
npm run format:check
npm test
npm run build
```

Run `npm run format` to apply Prettier. Set `DATABASE_URL` to a disposable test database and run `npm run migrate -w backend` before API integration tests. The database-backed test skips without that variable.

For browser verification, use a seeded disposable installation. Set `E2E_BASE_URL`, `E2E_EMAIL`, and `E2E_PASSWORD`. Set `BROWSER_PATH` if Chromium is installed somewhere other than `/usr/bin/chromium`. Then run `npm run test:e2e -w frontend`. The test submits a sample quote and checks its saved details in the authenticated inbox. Report which checks ran and which were skipped or blocked.

## Related guides

- [Frontend skill](skills/frontend/SKILL.md)
- [Backend skill](skills/backend/SKILL.md)
- [English user guide](USER-GUIDE.en.md)
- [راهنمای فارسی](USER-GUIDE.fa.md)
- [Setup and operations](../README.md)
