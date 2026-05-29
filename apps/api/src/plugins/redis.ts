import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisPlugin(server: FastifyInstance) {
  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on('connect', () => server.log.info('Redis connected'));
  redis.on('error', (err: any) => server.log.error({ err }, 'Redis error'));

  server.decorate('redis', redis);

  server.addHook('onClose', async () => {
    await redis.quit();
    server.log.info('Redis disconnected');
  });
}

export default fp(redisPlugin, { name: 'redis' });
export { redisPlugin };
