import { ContentType } from '@prisma/client';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { db } from '../db.js';

export const blockTypes = [
  'hero',
  'image-text',
  'video',
  'products',
  'projects',
  'statistics',
  'testimonials',
  'certificates',
  'cta',
  'contact',
  'features',
  'rich-text',
];
const text = z.string().trim().max(8000);
const short = z.string().trim().max(240);
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(120);
const asset = z
  .string()
  .regex(/^\/api\/public\/media\/[\da-f-]{36}(?:\/(?:thumbnail|alternate))?$/i);
const block = z.object({
  id: z.uuid(),
  type: z.enum(blockTypes),
  enabled: z.boolean().default(true),
  title: short.optional(),
  body: text.optional(),
  media: asset.optional(),
  items: z
    .array(z.object({ title: short, body: short }))
    .max(20)
    .optional(),
});
export const contentEntry = z.object({
  slug,
  locale: z.enum(['fa-IR', 'en-US']),
  type: z.enum(ContentType),
  draft: z.object({
    title: short.min(1),
    summary: text.optional(),
    body: text.optional(),
    image: asset.optional(),
    gallery: z.array(asset).max(24).optional(),
    video: asset.optional(),
    catalog: asset.optional(),
    category: slug.optional(),
    parent: slug.optional(),
    related: z.array(slug).max(20).optional(),
    specifications: z
      .record(short.min(1), short)
      .refine((value) => Object.keys(value).length <= 60)
      .optional(),
    client: short.optional(),
    location: short.optional(),
    completedAt: z.iso.date().optional(),
    seoTitle: short.optional(),
    seoDescription: short.optional(),
    blocks: z.array(block).max(60).optional(),
    links: z
      .array(
        z.object({
          label: short.min(1),
          target: z
            .string()
            .regex(/^(?:[a-z0-9-]+(?:\/[a-z0-9-]+)?)?$/)
            .max(120),
        }),
      )
      .max(12)
      .optional(),
    accent: z
      .string()
      .regex(/^#[a-fA-F0-9]{6}$/)
      .optional(),
  }),
});
const pagination = z.coerce.number().int().min(1).max(500).default(1);
export const publicContent = Router();
publicContent.get('/content/:locale/:type{/:slug}', async (req, res) => {
  const {
    locale,
    type,
    slug: entrySlug,
  } = contentEntry
    .pick({ locale: true, type: true, slug: true })
    .partial({ slug: true })
    .parse(req.params);
  const page = pagination.parse(req.query.page);
  const search = short.optional().parse(req.query.q);
  const category = slug.optional().parse(req.query.category);
  const where = {
    locale,
    type,
    publishedAt: { not: null },
    ...(entrySlug && { slug: entrySlug }),
    ...(search && {
      published: {
        path: ['title'],
        string_contains: search,
        mode: 'insensitive',
      },
    }),
  };
  if (category)
    where.AND = [{ published: { path: ['category'], equals: category } }];
  const [entries, total] = await db.$transaction([
    db.content.findMany({
      where,
      select: { slug: true, published: true },
      orderBy: { publishedAt: 'desc' },
      take: 12,
      skip: (page - 1) * 12,
    }),
    db.content.count({ where }),
  ]);
  res.set('Cache-Control', 'public, max-age=30').json({ entries, total });
});

const inquiry = z.object({
  kind: z.enum(['CONTACT', 'QUOTE']),
  name: short.min(2),
  email: z.email().max(254),
  message: text.min(10),
  product: slug.optional(),
});
publicContent.post(
  '/inquiries',
  rateLimit({ windowMs: 15 * 60_000, limit: 8 }),
  async (req, res) => {
    await db.inquiry.create({ data: inquiry.parse(req.body) });
    res.sendStatus(201);
  },
);

export const contentAdmin = Router();
contentAdmin.get('/content', async (req, res) => {
  const type = z.enum(ContentType).optional().parse(req.query.type);
  const page = pagination.parse(req.query.page);
  res.json(
    await db.content.findMany({
      where: { type },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      skip: (page - 1) * 50,
    }),
  );
});
contentAdmin.post('/content', saveContent);
contentAdmin.put('/content/:id', saveContent);
async function saveContent(req, res) {
  const data = contentEntry.parse(req.body);
  const entry = await db.$transaction(async (tx) => {
    let saved;
    if (req.params.id) {
      const current = await tx.content.findUniqueOrThrow({
        where: { id: req.params.id },
      });
      if (
        current.publishedAt &&
        ['locale', 'type', 'slug'].some((key) => current[key] !== data[key])
      )
        return null;
      saved = await tx.content.update({
        where: { id: current.id, updatedAt: current.updatedAt },
        data,
      });
    } else {
      saved = await tx.content.create({ data });
    }
    await tx.audit.create({
      data: { actorId: req.user.id, action: 'SAVE_DRAFT', target: saved.id },
    });
    return saved;
  });
  if (!entry) return res.sendStatus(409);
  res.json(entry);
}
contentAdmin.post('/content/:id/publish', async (req, res) => {
  const entry = await db.$transaction(async (tx) => {
    const current = await tx.content.findUniqueOrThrow({
      where: { id: req.params.id },
    });
    const saved = await tx.content.update({
      where: { id: current.id, updatedAt: current.updatedAt },
      data: { published: current.draft, publishedAt: new Date() },
    });
    await tx.audit.create({
      data: { actorId: req.user.id, action: 'PUBLISH', target: saved.id },
    });
    return saved;
  });
  res.json(entry);
});
contentAdmin.delete('/content/:id', async (req, res) => {
  await db.$transaction([
    db.content.delete({ where: { id: req.params.id } }),
    db.audit.create({
      data: {
        actorId: req.user.id,
        action: 'DELETE_CONTENT',
        target: req.params.id,
      },
    }),
  ]);
  res.sendStatus(204);
});
contentAdmin.get('/inquiries', async (req, res) => {
  const page = pagination.parse(req.query.page);
  res.json(
    await db.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      skip: (page - 1) * 50,
    }),
  );
});
contentAdmin.patch('/inquiries/:id', async (req, res) => {
  const data = z.object({ read: z.boolean() }).parse(req.body);
  res.json(await db.inquiry.update({ where: { id: req.params.id }, data }));
});
