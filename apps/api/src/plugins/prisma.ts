import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function prismaPlugin(server: FastifyInstance) {
  const prisma = new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

  await prisma.$connect();
  server.log.info('PostgreSQL connected via Prisma');

  server.decorate('prisma', prisma);

  server.addHook('onClose', async () => {
    await prisma.$disconnect();
    server.log.info('PostgreSQL disconnected');
  });
}

export default fp(prismaPlugin, { name: 'prisma' });
export { prismaPlugin };
