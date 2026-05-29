import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import sensible from '@fastify/sensible';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { registerRoutes } from './app.js';
import { prismaPlugin } from './plugins/prisma.js';
import { redisPlugin } from './plugins/redis.js';
import { MAX_IMAGE_SIZE_BYTES } from '@gem/config';

export async function buildServer() {
  const server = Fastify({
    bodyLimit: 1048576, // 1MB
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
      redact: ['req.headers.authorization', 'req.body.password', 'req.body.refreshToken', 'req.body.token'],
      ...(process.env['NODE_ENV'] === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss' },
            },
          }
        : {}),
    },
    trustProxy: true,
  });

  // ---- Security ----
  await server.register(helmet, {
    contentSecurityPolicy: false, // Configured separately for API
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await server.register(sensible);

  // ---- CORS ----
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://172.20.10.5:3000',
  ];

  await server.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ---- Rate Limiting ----
  await server.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => {
      const error = new Error(`Rate limit exceeded. Try again in ${context.after}.`);
      (error as any).statusCode = 429;
      return error;
    },
  });

  // ---- Multipart (file uploads) ----
  await server.register(multipart, {
    limits: {
      fileSize: MAX_IMAGE_SIZE_BYTES,
      files: 10,
    },
  });

  // ---- Database & Redis plugins ----
  await server.register(prismaPlugin);
  await server.register(redisPlugin);

  // ---- Health Check ----
  server.get('/health', async (_req, reply) => {
    let dbOk = false;
    let redisOk = false;
    let storageOk = false;

    try {
      await server.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      server.log.warn('Database health check failed');
    }

    try {
      await server.redis.ping();
      redisOk = true;
    } catch {
      server.log.warn('Redis health check failed');
    }

    try {
      const { s3Client, BUCKET_NAME } = await import('./lib/storage.js');
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME, MaxKeys: 1 });
      await s3Client.send(command);
      storageOk = true;
    } catch (err) {
      server.log.warn(err, 'Storage health check failed');
    }

    const status = dbOk && redisOk && storageOk ? 'ok' : 'degraded';
    return reply.status(status === 'ok' ? 200 : 503).send({
      status,
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '1.0.0',
      services: {
        database: dbOk ? 'ok' : 'error',
        redis: redisOk ? 'ok' : 'error',
        storage: storageOk ? 'ok' : 'error',
      },
    });
  });

  // ---- Readiness Check ----
  server.get('/ready', async (_req, reply) => {
    let dbOk = false;
    let redisOk = false;
    let storageOk = false;

    try {
      await server.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {}

    try {
      await server.redis.ping();
      redisOk = true;
    } catch {}

    try {
      const { s3Client, BUCKET_NAME } = await import('./lib/storage.js');
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME, MaxKeys: 1 });
      await s3Client.send(command);
      storageOk = true;
    } catch {}

    const isReady = dbOk && redisOk && storageOk;
    return reply.status(isReady ? 200 : 503).send({
      status: isReady ? 'ready' : 'not_ready',
      services: {
        database: dbOk ? 'ok' : 'error',
        redis: redisOk ? 'ok' : 'error',
        storage: storageOk ? 'ok' : 'error',
      },
    });
  });

  // ---- Routes ----
  await registerRoutes(server);

  // ---- Global error handler ----
  server.setErrorHandler((error: any, _req, reply) => {
    server.log.error(error);

    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: error.message },
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.validation,
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.issues,
        },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return reply.status(409).send({
          success: false,
          error: { code: 'CONFLICT', message: 'A record with this unique field already exists' },
        });
      }
      if (error.code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Record not found' },
        });
      }
      return reply.status(400).send({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'A database error occurred' },
      });
    }

    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message:
          process.env['NODE_ENV'] === 'production' && statusCode === 500
            ? 'An unexpected error occurred'
            : error.message,
      },
    });
  });

  server.setNotFoundHandler((_req, reply) => {
    return reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  return server;
}
