import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { registerSchema, loginSchema, refreshTokenSchema } from '@gem/validators';
import { AuthService } from '../../services/auth.service.js';
import { authenticate } from '../../middleware/authenticate.js';

export async function authRoutes(server: FastifyInstance) {
  const authService = new AuthService(server.prisma);

  // POST /api/v1/auth/register
  server.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '15m' } },
    handler: async (request, reply) => {
      const body = registerSchema.parse(request.body);
      const result = await authService.register(body);
      return reply.status(201).send({ success: true, data: result });
    },
  });

  // POST /api/v1/auth/login
  server.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '15m' } },
    handler: async (request, reply) => {
      const body = loginSchema.parse(request.body);
      const ip = request.ip;
      const userAgent = request.headers['user-agent'] ?? 'unknown';
      const result = await authService.login(body, ip, userAgent);
      return reply.send({ success: true, data: result });
    },
  });

  // POST /api/v1/auth/refresh
  server.post('/refresh', {
    handler: async (request, reply) => {
      const body = refreshTokenSchema.parse(request.body);
      const result = await authService.refreshTokens(body.refreshToken);
      return reply.send({ success: true, data: result });
    },
  });

  // POST /api/v1/auth/logout
  server.post('/logout', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const body = z.object({ refreshToken: z.string().optional() }).parse(request.body);
      await authService.logout(request.user!.sessionId, body.refreshToken);
      return reply.send({ success: true, data: { message: 'Logged out successfully' } });
    },
  });

  // GET /api/v1/auth/me
  server.get('/me', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const user = await authService.getMe(request.user!.id);
      return reply.send({ success: true, data: user });
    },
  });

  // POST /api/v1/auth/forgot-password
  server.post('/forgot-password', {
    config: { rateLimit: { max: 3, timeWindow: '1h' } },
    handler: async (request, reply) => {
      const body = z.object({ email: z.string().email().toLowerCase() }).parse(request.body);
      // In Phase 1, just acknowledge — email sending is wired in Phase 2
      await authService.requestPasswordReset(body.email);
      return reply.send({
        success: true,
        data: { message: 'If the email exists, a reset link will be sent' },
      });
    },
  });

  // POST /api/v1/auth/reset-password
  server.post('/reset-password', {
    handler: async (request, reply) => {
      const body = z
        .object({
          token: z.string().min(1),
          password: z.string().min(8).max(128),
        })
        .parse(request.body);
      await authService.resetPassword(body.token, body.password);
      return reply.send({ success: true, data: { message: 'Password updated successfully' } });
    },
  });
}
