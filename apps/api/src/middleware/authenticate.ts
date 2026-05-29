import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  sessionId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Authenticates the request by verifying the Bearer JWT access token.
 * Attaches the decoded user to `request.user`.
 * Returns 401 if token is missing or invalid.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Token is invalid or expired' },
    });
  }
}

/**
 * Optional authentication — attaches user if token is present, but doesn't
 * reject if no token (for public endpoints that need user context).
 */
export async function optionalAuthenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return;

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  } catch {
    // Silently ignore invalid token for optional auth
  }
}

/**
 * RBAC guard — call after authenticate.
 * Usage: authorize(['ADMIN', 'VERIFIED_SELLER'])
 */
export function authorize(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        },
      });
    }
  };
}

/**
 * Convenience guard: only admins.
 */
export const requireAdmin = authorize(['ADMIN', 'SUPER_ADMIN']);

/**
 * Convenience guard: sellers and verified sellers.
 */
export const requireSeller = authorize(['SELLER', 'VERIFIED_SELLER', 'ADMIN', 'SUPER_ADMIN']);

/**
 * Convenience guard: verified sellers only.
 */
export const requireVerifiedSeller = authorize(['VERIFIED_SELLER', 'ADMIN', 'SUPER_ADMIN']);

/**
 * Convenience guard: buyers only (or admins).
 */
export const requireBuyer = authorize(['BUYER', 'ADMIN', 'SUPER_ADMIN']);

/**
 * Convenience guard: super admin only.
 */
export const requireSuperAdmin = authorize(['SUPER_ADMIN']);

/**
 * Require basic authentication only. Use 'authenticate' middleware for this.
 * Exporting as alias for consistency.
 */
export const requireAuth = authenticate;
