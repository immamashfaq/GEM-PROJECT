import type { PrismaClient } from '@prisma/client';
import type { RegisterInput, LoginInput } from '@gem/validators';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { JWT_ACCESS_EXPIRY_MS } from '@gem/config';

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async register(input: RegisterInput) {
    // Check for existing email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      const error = new Error('Email is already registered') as Error & { statusCode: number };
      error.statusCode = 409;
      throw error;
    }

    // Check for existing username
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existingUsername) {
      const error = new Error('Username is already taken') as Error & { statusCode: number };
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await hashPassword(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        fullName: input.fullName ?? null,
        role: 'BUYER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return {
      user,
      message: 'Registration successful. Please verify your email.',
    };
  }

  async login(input: LoginInput, ipAddress: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { sellerProfile: { select: { id: true, kycStatus: true, isVerified: true } } },
    });

    if (!user) {
      const error = new Error('Invalid email or password') as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Your account has been suspended') as Error & { statusCode: number };
      error.statusCode = 403;
      throw error;
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      const error = new Error('Invalid email or password') as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    // Create a session
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: 'pending', // will update below
        deviceInfo: userAgent,
        ipAddress,
        userAgent,
        expiresAt: refreshExpiry,
      },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      sessionId: session.id,
    });

    // Store hashed refresh token
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash: _, ...safeUser } = user;

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_ACCESS_EXPIRY_MS / 1000,
      user: safeUser,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; sessionId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      const error = new Error('Invalid or expired refresh token') as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    const session = await this.prisma.userSession.findFirst({
      where: {
        id: payload.sessionId,
        refreshToken,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session || !session.user.isActive) {
      const error = new Error('Session not found or revoked') as Error & { statusCode: number };
      error.statusCode = 401;
      throw error;
    }

    // Rotate refresh token
    const newRefreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const newAccessToken = signAccessToken({
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      sessionId: session.id,
    });

    const newRefreshToken = signRefreshToken({
      sub: session.user.id,
      sessionId: session.id,
    });

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken, expiresAt: newRefreshExpiry },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_ACCESS_EXPIRY_MS / 1000,
    };
  }

  async logout(sessionId: string, refreshToken?: string) {
    await this.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        ...(refreshToken ? { refreshToken } : {}),
      },
      data: { isRevoked: true },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        sellerProfile: {
          select: {
            id: true,
            businessName: true,
            bio: true,
            location: true,
            kycStatus: true,
            isVerified: true,
            verifiedAt: true,
            averageRating: true,
            totalReviews: true,
            completedSales: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error('User not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  async requestPasswordReset(email: string) {
    // In Phase 1 we just log the request; email flow is Phase 2
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent — don't leak whether email exists

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.user.update({
      where: { email },
      data: { passwordResetToken, passwordResetExpires },
    });

    // TODO: Send email in Phase 2 with `resetToken`
  }

  async resetPassword(token: string, newPassword: string) {
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      const error = new Error('Token is invalid or has expired') as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Invalidate all sessions for security
    await this.prisma.userSession.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });
  }
}
