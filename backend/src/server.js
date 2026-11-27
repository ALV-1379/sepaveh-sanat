import { createApp } from './app.js';
import { db } from './db.js';
import { storage } from './modules/media.js';

if ((process.env.JWT_SECRET ?? '').length < 32)
  throw new Error('JWT_SECRET must be at least 32 characters');
if (
  process.env.NODE_ENV === 'production' &&
  !process.env.APP_ORIGIN?.startsWith('https://')
)
  throw new Error('Production APP_ORIGIN must use HTTPS');
await db.$connect();
await storage.initialize();
const port = Number(process.env.PORT || 3000);
const server = createApp().listen(port, '0.0.0.0', () =>
  console.log(`API listening on port ${port}`),
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () =>
    server.close(async () => {
      await db.$disconnect();
    }),
  );
}
