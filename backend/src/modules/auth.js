import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { db } from '../db.js';

const accessMs = 15 * 60_000;
const refreshMs = 7 * 24 * 60 * 60_000;
const cookies = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };
const refreshCookies = { ...cookies, path: '/api/auth' };
const digest = (token) => createHash('sha256').update(token).digest('hex');
export const credentials = z.object({ email: z.email().transform((email) => email.toLowerCase()), password: z.string().min(12).max(128) });
export const hashPassword = (password) => argon2.hash(password, { type: argon2.argon2id });
const dummyHash = hashPassword(randomBytes(32).toString('hex'));
const publicUser = ({ id, email, role }) => ({ id, email, role });

export async function requireUser(req, res, next) {
  let claims;
  try {
    claims = jwt.verify(req.cookies.access, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'sepaveh', audience: 'cms' });
  } catch {
    return res.sendStatus(401);
  }
  const session = await db.session.findUnique({ where: { id: claims.sid }, include: { user: true } });
  if (!session?.user.active || session.expiresAt <= new Date() || session.userId !== claims.sub) return res.sendStatus(401);
  req.user = publicUser(session.user);
  next();
}

export function requireSuper(req, res, next) {
  if (req.user.role !== 'SUPER_ADMIN') return res.sendStatus(403);
  next();
}

async function issueSession(res, user, previousHash) {
  const token = randomBytes(48).toString('base64url');
  const session = await db.$transaction(async (tx) => {
    if (previousHash) {
      const removed = await tx.session.deleteMany({ where: { tokenHash: previousHash, expiresAt: { gt: new Date() } } });
      if (!removed.count) return null;
    }
    return tx.session.create({ data: { userId: user.id, tokenHash: digest(token), expiresAt: new Date(Date.now() + refreshMs) } });
  });
  if (!session) return res.sendStatus(401);
  const access = jwt.sign({ sid: session.id }, process.env.JWT_SECRET, { algorithm: 'HS256', subject: user.id, issuer: 'sepaveh', audience: 'cms', expiresIn: accessMs / 1000 });
  res.cookie('access', access, { ...cookies, maxAge: accessMs });
  res.cookie('refresh', token, { ...refreshCookies, maxAge: refreshMs });
  res.json(publicUser(user));
}

export const auth = Router();
auth.post('/login', rateLimit({ windowMs: 15 * 60_000, limit: 10 }), async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const user = await db.user.findUnique({ where: { email } });
  const verified = await argon2.verify(user?.passwordHash ?? await dummyHash, password);
  if (!verified || !user?.active) return res.sendStatus(401);
  return issueSession(res, user);
});
auth.post('/refresh', async (req, res) => {
  if (!req.cookies.refresh) return res.sendStatus(401);
  const tokenHash = digest(req.cookies.refresh);
  const session = await db.session.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!session?.user.active) return res.sendStatus(401);
  return issueSession(res, session.user, tokenHash);
});
auth.post('/logout', async (req, res) => {
  if (req.cookies.refresh) await db.session.deleteMany({ where: { tokenHash: digest(req.cookies.refresh) } });
  res.clearCookie('access', cookies).clearCookie('refresh', refreshCookies).sendStatus(204);
});
auth.get('/me', requireUser, (req, res) => res.json(req.user));
