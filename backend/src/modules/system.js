import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { credentials, hashPassword } from './auth.js';

const safe = { id: true, email: true, role: true, active: true, createdAt: true };
export const system = Router();
system.get('/users', async (_req, res) => res.json(await db.user.findMany({ select: safe, take: 100, orderBy: { createdAt: 'desc' } })));
system.post('/users', async (req, res) => {
  const { email, password, role } = credentials.extend({ role: z.enum(['CONTENT_ADMIN', 'SUPER_ADMIN']) }).parse(req.body);
  const passwordHash = await hashPassword(password);
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { email, passwordHash, role }, select: safe });
    await tx.audit.create({ data: { actorId: req.user.id, action: 'CREATE_USER', target: created.id } });
    return created;
  });
  res.status(201).json(user);
});
system.patch('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.sendStatus(409);
  const data = z.object({ active: z.boolean() }).parse(req.body);
  const user = await db.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id: req.params.id }, data, select: safe });
    if (!data.active) await tx.session.deleteMany({ where: { userId: updated.id } });
    await tx.audit.create({ data: { actorId: req.user.id, action: data.active ? 'ENABLE_USER' : 'DISABLE_USER', target: updated.id } });
    return updated;
  });
  res.json(user);
});
system.get('/audit', async (_req, res) => res.json(await db.audit.findMany({ take: 100, orderBy: { createdAt: 'desc' } })));
system.get('/health', async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  res.json({ database: 'available', uptime: Math.floor(process.uptime()) });
});
