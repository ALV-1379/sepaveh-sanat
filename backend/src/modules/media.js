import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { db } from '../db.js';

class LocalStorageProvider {
  root = resolve(process.env.UPLOAD_DIR || '../uploads');

  path(key) {
    if (!/^(images|videos|documents|thumbnails)\/[a-f0-9-]+\.(webp|avif|pdf|mp4)$/.test(key)) throw new Error('Invalid storage key');
    return resolve(this.root, key);
  }

  async initialize() {
    await Promise.all(['images', 'videos', 'documents', 'thumbnails'].map((folder) => mkdir(resolve(this.root, folder), { recursive: true })));
  }

  put(key, bytes) {
    return writeFile(this.path(key), bytes, { flag: 'wx', mode: 0o640 });
  }

  remove(key) {
    return unlink(this.path(key));
  }
}
export const storage = new LocalStorageProvider();
const formats = {
  'image/jpeg': { extension: /\.jpe?g$/i, sharp: 'jpeg' },
  'image/png': { extension: /\.png$/i, sharp: 'png' },
  'image/webp': { extension: /\.webp$/i, sharp: 'webp' },
  'application/pdf': { extension: /\.pdf$/i, key: 'documents', magic: (bytes) => bytes.subarray(0, 5).toString() === '%PDF-', suffix: 'pdf' },
  'video/mp4': { extension: /\.mp4$/i, key: 'videos', magic: (bytes) => bytes.subarray(4, 8).toString() === 'ftyp', suffix: 'mp4' },
};
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fields: 1, fileSize: Number(process.env.UPLOAD_MAX_BYTES || 20_000_000) } });
export const adminMedia = Router();
export const visitorMedia = Router();
adminMedia.get('/media', async (_req, res) => res.json(await db.media.findMany({ take: 100, orderBy: { createdAt: 'desc' } })));
adminMedia.post('/media', upload.single('file'), async (req, res) => {
  const file = req.file;
  const format = file && formats[file.mimetype];
  if (!format?.extension?.test(file.originalname)) return res.sendStatus(415);
  const id = randomUUID();
  const files = new Map();
  let storageKey;
  let thumbnailKey;
  let alternateKey;
  let mime = file.mimetype;
  if (format.sharp) {
    try {
      const input = sharp(file.buffer, { limitInputPixels: 24_000_000 });
      if ((await input.metadata()).format !== format.sharp) return res.sendStatus(415);
      storageKey = `images/${id}.webp`;
      alternateKey = `images/${id}.avif`;
      thumbnailKey = `thumbnails/${id}.webp`;
      mime = 'image/webp';
      files.set(storageKey, await input.clone().rotate().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 83 }).toBuffer());
      files.set(alternateKey, await input.clone().rotate().resize({ width: 1920, withoutEnlargement: true }).avif({ quality: 49 }).toBuffer());
      files.set(thumbnailKey, await input.rotate().resize({ width: 480, withoutEnlargement: true }).webp().toBuffer());
    } catch {
      return res.sendStatus(415);
    }
  } else {
    if (!format.magic(file.buffer)) return res.sendStatus(415);
    storageKey = `${format.key}/${id}.${format.suffix}`;
    files.set(storageKey, file.buffer);
  }
  const written = [];
  try {
    for (const [key, bytes] of files) {
      await storage.put(key, bytes);
      written.push(key);
    }
    const media = await db.$transaction(async (tx) => {
      const created = await tx.media.create({ data: { id, storageKey, thumbnailKey, alternateKey, name: file.originalname.slice(0, 255), mime, size: files.get(storageKey).length, isPublic: req.body.public === 'true' } });
      await tx.audit.create({ data: { actorId: req.user.id, action: 'UPLOAD_MEDIA', target: id } });
      return created;
    });
    res.status(201).json(media);
  } catch (error) {
    await Promise.allSettled(written.map((key) => storage.remove(key)));
    throw error;
  }
});

function serve(publicOnly) {
  return async (req, res) => {
    const media = await db.media.findFirst({ where: { id: req.params.id, ...(publicOnly && { isPublic: true }) } });
    const field = { thumbnail: 'thumbnailKey', alternate: 'alternateKey' }[req.params.variant] ?? 'storageKey';
    if (req.params.variant && !['thumbnail', 'alternate'].includes(req.params.variant)) return res.sendStatus(404);
    const key = media?.[field] || (field === 'thumbnailKey' && media?.mime.startsWith('image/') ? media.storageKey : undefined);
    if (!key) return res.sendStatus(404);
    if (media.mime === 'application/pdf') res.attachment();
    res.sendFile(storage.path(key), { maxAge: publicOnly ? '1d' : 0, cacheControl: publicOnly });
  };
}
adminMedia.get('/media/:id{/:variant}', serve(false));
visitorMedia.get('/media/:id{/:variant}', serve(true));
