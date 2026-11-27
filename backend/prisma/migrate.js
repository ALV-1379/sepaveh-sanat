import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SchemaEngine } from '@prisma/schema-engine-wasm';
import { PrismaPg } from '@prisma/adapter-pg';
import { bindSqlAdapterFactory } from '@prisma/driver-adapter-utils';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const baseDir = fileURLToPath(new URL('./migrations/', import.meta.url));
const schema = await readFile(
  new URL('./schema.prisma', import.meta.url),
  'utf8',
);
const migrations = await readdir(baseDir, { withFileTypes: true });
const migrationDirectories = await Promise.all(
  migrations
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .sort()
    .map(async (path) => ({
      path,
      migrationFile: {
        path: 'migration.sql',
        content: {
          tag: 'ok',
          value: await readFile(join(baseDir, path, 'migration.sql'), 'utf8'),
        },
      },
    })),
);
const lockfile = {
  path: 'migration_lock.toml',
  content: await readFile(join(baseDir, 'migration_lock.toml'), 'utf8'),
};
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let engine;
try {
  engine = await SchemaEngine.new(
    { datamodels: [['schema.prisma', schema]] },
    () => {},
    bindSqlAdapterFactory(new PrismaPg(pool)),
  );
  const { appliedMigrationNames } = await engine.applyMigrations({
    migrationsList: {
      baseDir,
      lockfile,
      migrationDirectories,
      shadowDbInitScript: '',
    },
    filters: { externalTables: [], externalEnums: [] },
  });
  console.log(
    appliedMigrationNames.length
      ? 'Applied migrations: ' + appliedMigrationNames.join(', ')
      : 'Database migrations are current.',
  );
} finally {
  engine?.free();
  await pool.end();
}
