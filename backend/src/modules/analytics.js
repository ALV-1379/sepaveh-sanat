import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { db } from '../db.js';

export const analytics = Router();
export const analyticsReport = Router();
const event = z.object({
  path: z.string().regex(/^\/(?!\/)[^?#]{0,199}$/),
  referrer: z.hostname().optional(),
});
analytics.post(
  '/visits',
  rateLimit({ limit: 60, windowMs: 60_000 }),
  async (req, res) => {
    if (
      req.cookies.access ||
      req.get('Sec-GPC') === '1' ||
      req.get('DNT') === '1'
    )
      return res.sendStatus(204);
    const { visitor, events } = z
      .object({ visitor: z.uuid(), events: z.array(event).min(1).max(20) })
      .parse(req.body);
    const ua = req.get('user-agent') ?? '';
    const device = /ipad|tablet/i.test(ua)
      ? 'tablet'
      : /mobile|android/i.test(ua)
        ? 'mobile'
        : 'desktop';
    const browser = /edg\//i.test(ua)
      ? 'Edge'
      : /firefox/i.test(ua)
        ? 'Firefox'
        : /chrome/i.test(ua)
          ? 'Chrome'
          : /safari/i.test(ua)
            ? 'Safari'
            : 'Other';
    await db.visit.createMany({
      data: events.map((entry) => ({ ...entry, visitor, device, browser })),
    });
    res.sendStatus(204);
  },
);
analyticsReport.get('/analytics', async (req, res) => {
  const days = z.coerce
    .number()
    .int()
    .min(1)
    .max(90)
    .default(30)
    .parse(req.query.days);
  const from = req.query.from
    ? new Date(z.iso.date().parse(req.query.from))
    : new Date(Date.now() - days * 86400000);
  const end = req.query.to
    ? new Date(new Date(z.iso.date().parse(req.query.to)).valueOf() + 86400000)
    : new Date();
  if (from >= end || end - from > 91 * 86400000) return res.sendStatus(400);
  const createdAt = { gte: from, lt: end };
  const where = { createdAt };
  const [
    audience,
    daily,
    pages,
    products,
    projects,
    device,
    browser,
    referrers,
    conversions,
  ] = await Promise.all([
    db.$queryRaw`SELECT COUNT(*)::int AS views, COUNT(DISTINCT "visitor")::int AS unique, COUNT(DISTINCT v."visitor") FILTER (WHERE EXISTS (SELECT 1 FROM "Visit" p WHERE p."visitor" = v."visitor" AND p."createdAt" < v."createdAt" - interval '30 minutes'))::int AS returning FROM "Visit" v WHERE v."createdAt" >= ${from} AND v."createdAt" < ${end}`,
    db.$queryRaw`SELECT CAST("createdAt" AS date)::text AS date, COUNT(*)::int AS views FROM "Visit" WHERE "createdAt" >= ${from} AND "createdAt" < ${end} GROUP BY 1 ORDER BY 1`,
    db.visit.groupBy({
      by: ['path'],
      where,
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
    db.visit.groupBy({
      by: ['path'],
      where: { ...where, path: { contains: '/products/' } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
    db.visit.groupBy({
      by: ['path'],
      where: { ...where, path: { contains: '/projects/' } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
    db.visit.groupBy({ by: ['device'], where, _count: true }),
    db.visit.groupBy({ by: ['browser'], where, _count: true }),
    db.visit.groupBy({
      by: ['referrer'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    db.inquiry.groupBy({ by: ['kind'], where, _count: true }),
  ]);
  res.json({
    ...audience[0],
    daily,
    pages,
    products,
    projects,
    device,
    browser,
    referrers,
    conversions,
  });
});
