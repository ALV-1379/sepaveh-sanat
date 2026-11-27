import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PrismaClientJsGenerator } = require('@prisma/client-generator-js');
const { getGenerators } = require('@prisma/internals');

const cliCommand = 'prisma';
const generators = await getGenerators({
  schemaPath: fileURLToPath(new URL('./schema.prisma', import.meta.url)),
  registry: {
    'prisma-client-js': {
      type: 'in-process',
      generator: new PrismaClientJsGenerator({ cliCommand }),
    },
  },
  cliCommand,
});

try {
  for (const generator of generators) await generator.generate();
} finally {
  for (const generator of generators) generator.stop();
}
