import { db } from '../src/db.js';
import { credentials, hashPassword } from '../src/modules/auth.js';

try {
  const { email, password } = credentials.parse({
    email: process.env.BOOTSTRAP_EMAIL,
    password: process.env.BOOTSTRAP_PASSWORD,
  });
  const passwordHash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(73208801)`;
    if (await tx.user.count())
      throw new Error(
        'Bootstrap is available only before the first account exists',
      );
    await tx.user.create({
      data: { email, passwordHash, role: 'SUPER_ADMIN' },
    });
  });
  console.log('First Super Admin created.');
} catch (error) {
  console.error(
    error.name === 'ZodError'
      ? 'Supply a valid bootstrap email and a password of 12–128 characters'
      : error.code || error.message,
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
