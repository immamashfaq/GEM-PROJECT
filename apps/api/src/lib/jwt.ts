import jwt from 'jsonwebtoken';
import { JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '@gem/config';

const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] ?? 'dev_access_secret_change_in_production';
const REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] ?? 'dev_refresh_secret_change_in_production';

export interface JwtAccessPayload {
  sub: string;       // user ID
  email: string;
  role: string;
  sessionId: string;
}

export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
}

export function signAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
    issuer: 'gem-project',
    audience: 'gem-api',
  });
}

export function signRefreshToken(payload: JwtRefreshPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
    issuer: 'gem-project',
    audience: 'gem-api',
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, ACCESS_SECRET, {
    issuer: 'gem-project',
    audience: 'gem-api',
  }) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, REFRESH_SECRET, {
    issuer: 'gem-project',
    audience: 'gem-api',
  }) as JwtRefreshPayload;
}

export function decodeToken(token: string): JwtAccessPayload | null {
  try {
    return jwt.decode(token) as JwtAccessPayload;
  } catch {
    return null;
  }
}
