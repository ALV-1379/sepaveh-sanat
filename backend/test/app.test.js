import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import sharp from 'sharp';

process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.UPLOAD_DIR ||= '/tmp/sepaveh-test-' + randomUUID();
const { createApp } = await import('../src/app.js');
const { db } = await import('../src/db.js');
const { storage } = await import('../src/modules/media.js');
const { credentials, hashPassword } = await import('../src/modules/auth.js');
const { contentEntry } = await import('../src/modules/content.js');
const origin = 'http://localhost:5173';
const server = createApp({ origin }).listen(0, '127.0.0.1');
const id = randomUUID();
const password = randomBytes(24).toString('hex');
const email = 'test-' + id + '@example.com';
const elevatedEmail = 'super-' + id + '@example.com';
const draft = { type: 'PAGE', locale: 'en-US', slug: id, draft: { title: 'Draft test', blocks: [{ id: randomUUID(), type: 'hero', enabled: true }] } };

before(async () => {
  if (!server.listening) await once(server, 'listening');
  if (process.env.DATABASE_URL) await storage.initialize();
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.$disconnect();
});
const call = (path, { method = 'GET', body, cookie, csrfOrigin = origin } = {}) => {
  const headers = new Headers({ origin: csrfOrigin });
  if (cookie) headers.set('cookie', cookie);
  if (body && !(body instanceof FormData)) headers.set('content-type', 'application/json');
  return fetch('http://127.0.0.1:' + server.address().port + '/api' + path, {
    method, headers, body: body instanceof FormData ? body : body && JSON.stringify(body),
  });
};
const cookie = (response) => response.headers.getSetCookie().map((header) => header.split(';')[0]).join('; ');

test('credentials normalize email and reject short passwords', () => {
  assert.equal(credentials.parse({ email: 'TEST@EXAMPLE.COM', password }).email, 'test@example.com');
  assert.throws(() => credentials.parse({ email, password: 'short' }));
});
test('content schema rejects executable blocks and external asset URLs', () => {
  assert.equal(contentEntry.parse(draft).draft.blocks.length, 1);
  assert.throws(() => contentEntry.parse({ ...draft, draft: { title: 'Test', image: 'javascript:alert(1)' } }));
  assert.throws(() => contentEntry.parse({ ...draft, draft: { title: 'Test', blocks: [{ id, type: 'script' }] } }));
});
test('admin APIs require a session and mutations require the configured origin', async () => {
  assert.equal((await call('/admin/content')).status, 401);
  assert.equal((await call('/auth/login', { method: 'POST', csrfOrigin: 'https://elsewhere.example', body: { email, password } })).status, 403);
});
test('PostgreSQL-backed CMS, RBAC, rotation, uploads and analytics', { skip: !process.env.DATABASE_URL }, async () => {
  const passwordHash = await hashPassword(password);
  const admin = await db.user.create({ data: { email, passwordHash, role: 'CONTENT_ADMIN' } });
  const superAdmin = await db.user.create({ data: { email: elevatedEmail, passwordHash, role: 'SUPER_ADMIN' } });
  let contentId;
  let media;
  try {
    assert.equal((await call('/health')).status, 200);
    const login = await call('/auth/login', { method: 'POST', body: { email, password } });
    assert.equal(login.status, 200);
    assert.ok(login.headers.getSetCookie().every((part) => part.includes('HttpOnly')));
    const old = cookie(login);
    assert.equal((await call('/system/users', { cookie: old })).status, 403);
    const superLogin = await call('/auth/login', { method: 'POST', body: { email: elevatedEmail, password } });
    assert.equal((await call('/system/users', { cookie: cookie(superLogin) })).status, 200);
    const refresh = await call('/auth/refresh', { method: 'POST', cookie: old });
    assert.equal(refresh.status, 200);
    const session = cookie(refresh);
    assert.equal((await call('/auth/refresh', { method: 'POST', cookie: old })).status, 401);
    const create = await call('/admin/content', { method: 'POST', cookie: session, body: draft });
    assert.equal(create.status, 200);
    contentId = (await create.json()).id;
    const page = '/public/content/en-US/PAGE/' + id;
    assert.equal((await (await call(page)).json()).total, 0);
    assert.equal((await call('/admin/content/' + contentId + '/publish', { method: 'POST', cookie: session })).status, 200);
    assert.equal((await (await call(page)).json()).entries[0].published.title, 'Draft test');
    assert.equal((await call('/admin/content/' + contentId, { method: 'PUT', cookie: session, body: { ...draft, draft: { title: 'Unpublished edit' } } })).status, 200);
    assert.equal((await (await call(page)).json()).entries[0].published.title, 'Draft test');
    const form = new FormData();
    const image = await sharp({ create: { width: 12, height: 12, channels: 3, background: 'red' } }).png().toBuffer();
    form.set('file', new Blob([image], { type: 'image/png' }), 'test.png');
    const upload = await call('/admin/media', { method: 'POST', body: form, cookie: session });
    assert.equal(upload.status, 201);
    media = await upload.json();
    assert.equal((await call('/public/media/' + media.id)).status, 404);
    assert.equal((await call('/admin/media/' + media.id + '/thumbnail', { cookie: session })).status, 200);
    assert.equal((await call('/public/visits', { method: 'POST', body: { visitor: id, events: [{ path: '/en/products/' + id }] } })).status, 204);
    const report = await call('/admin/analytics', { cookie: session });
    assert.equal(report.status, 200);
    assert.ok((await report.json()).views >= 1);
    assert.equal((await call('/auth/logout', { method: 'POST', cookie: session })).status, 204);
    assert.equal((await call('/auth/me', { cookie: session })).status, 401);
  } finally {
    await db.audit.deleteMany({ where: { actorId: admin.id } });
    if (contentId) await db.content.delete({ where: { id: contentId } });
    if (media) {
      await db.media.delete({ where: { id: media.id } });
      await Promise.all([media.storageKey, media.thumbnailKey, media.alternateKey].map((key) => storage.remove(key)));
    }
    await db.visit.deleteMany({ where: { visitor: id } });
    await db.user.deleteMany({ where: { id: { in: [admin.id, superAdmin.id] } } });
  }
});
