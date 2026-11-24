import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import { db } from './db.js';
import { auth, requireUser, requireSuper } from './modules/auth.js';
import { publicContent, contentAdmin } from './modules/content.js';
import { visitorMedia, adminMedia } from './modules/media.js';
import { analytics, analyticsReport } from './modules/analytics.js';
import { system } from './modules/system.js';

export function createApp({ origin = process.env.APP_ORIGIN || 'http://localhost:5173' } = {}) {
  const app = express();
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use('/api', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== origin) return res.sendStatus(403);
    next();
  });
  app.use(cookieParser(), express.json({ limit: '256kb' }));
  app.get('/api/health', async (_req, res) => {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  });
  app.use('/api/public', publicContent, visitorMedia, analytics);
  app.use('/api/auth', auth);
  app.use('/api/admin', requireUser, contentAdmin, adminMedia, analyticsReport);
  app.use('/api/system', requireUser, requireSuper, system);
  app.use((_req, res) => res.sendStatus(404));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ZodError) return res.status(400).json({ error: 'Invalid request', issues: error.issues.map(({ path, message }) => ({ path, message })) });
    if (error.code === 'P2025') return res.sendStatus(404);
    if (error.code === 'P2002') return res.sendStatus(409);
    if (error.code === 'LIMIT_FILE_SIZE') return res.sendStatus(413);
    if (error.name === 'MulterError') return res.sendStatus(400);
    if (error.status >= 400 && error.status < 500) return res.sendStatus(error.status);
    console.error(error.code || error.name);
    res.sendStatus(500);
  });
  return app;
}
