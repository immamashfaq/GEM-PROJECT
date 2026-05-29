import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';

export async function userRoutes(server: FastifyInstance) {
  // GET /api/v1/users/:id/profile — Public seller profile
  server.get('/:id/profile', {
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);

      const user = await server.prisma.user.findUnique({
        where: { id, isActive: true, deletedAt: null },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          sellerProfile: {
            select: {
              id: true,
              businessName: true,
              bio: true,
              location: true,
              isVerified: true,
              averageRating: true,
              totalReviews: true,
              completedSales: true,
              responseRatePercent: true,
              verifiedAt: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
      }

      // Get recent active listings
      const recentListings = await server.prisma.listing.findMany({
        where: { sellerId: id, status: 'ACTIVE', deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          gemType: true,
          caratWeight: true,
          fixedPrice: true,
          currency: true,
          listingType: true,
          isCertified: true,
          media: { where: { isThumbnail: true }, select: { url: true }, take: 1 },
        },
      });

      // Get recent reviews
      const reviews = await server.prisma.review.findMany({
        where: { sellerId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          overallRating: true,
          comment: true,
          createdAt: true,
          reviewer: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      return reply.send({
        success: true,
        data: {
          ...user,
          sellerProfile: user.sellerProfile
            ? {
                ...user.sellerProfile,
                averageRating: user.sellerProfile.averageRating
                  ? Number(user.sellerProfile.averageRating)
                  : null,
                responseRatePercent: user.sellerProfile.responseRatePercent
                  ? Number(user.sellerProfile.responseRatePercent)
                  : null,
              }
            : null,
          recentListings: recentListings.map((l) => ({
            ...l,
            caratWeight: l.caratWeight ? Number(l.caratWeight) : null,
            fixedPrice: l.fixedPrice ? Number(l.fixedPrice) : null,
            thumbnail: l.media[0]?.url ?? null,
          })),
          reviews,
        },
      });
    },
  });

  // PATCH /api/v1/users/me — Update own profile
  server.patch('/me', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const body = z
        .object({
          fullName: z.string().min(2).max(100).optional(),
          avatarUrl: z.string().url().optional(),
        })
        .parse(request.body);

      const user = await server.prisma.user.update({
        where: { id: request.user!.id },
        data: body,
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          updatedAt: true,
        },
      });

      return reply.send({ success: true, data: user });
    },
  });

  // PATCH /api/v1/users/me/seller-profile — Update seller profile
  server.patch('/me/seller-profile', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const body = z
        .object({
          businessName: z.string().max(200).optional(),
          bio: z.string().max(2000).optional(),
          location: z.string().max(200).optional(),
          phone: z.string().max(20).optional(),
          website: z.string().url().optional(),
        })
        .parse(request.body);

      const profile = await server.prisma.sellerProfile.upsert({
        where: { userId: request.user!.id },
        create: { userId: request.user!.id, ...body },
        update: body,
      });

      return reply.send({ success: true, data: profile });
    },
  });
}
