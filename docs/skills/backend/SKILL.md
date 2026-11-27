---
name: sepaveh-backend
description: Maintain the Sepaveh Sanat API, PostgreSQL data, authentication, and Docker runtime.
---

# Backend handoff

- Express and Prisma live in `backend/`. Review `src/app.js` for routing and middleware and `src/modules/` for validation and business logic.
- Validate payloads with Zod. Keep quote and contact requirements separate, and expose customer addresses and phone numbers only through the authenticated inbox.
- Preserve role checks, HttpOnly session cookies, refresh rotation, origin checks, and rate limits. Avoid logging personal data and credentials.
- For schema changes, add a forward SQL migration under `prisma/migrations/`, update `prisma/schema.prisma`, then run `npm run generate -w backend` and `npm run migrate -w backend` against a disposable database. Preserve existing records.
- Keep build and development packages out of production images. The API needs production dependencies and the generated Prisma client. The frontend image serves built assets.
- Run the root lint, format check, and tests. Set a disposable `DATABASE_URL` for the integration suite. Use seeded data only where appropriate.
