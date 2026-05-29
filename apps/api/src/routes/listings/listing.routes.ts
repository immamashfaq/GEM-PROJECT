import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createListingSchema, updateListingSchema } from '@gem/validators';
import { ListingService } from '../../services/listing.service.js';
import { authenticate, optionalAuthenticate, requireSeller } from '../../middleware/authenticate.js';
import { generateUploadUrl } from '../../lib/storage.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export async function listingRoutes(server: FastifyInstance) {
  const listingService = new ListingService(server.prisma);

  // GET /api/v1/listings — Browse all active listings (public)
  server.get('/', {
    preHandler: [optionalAuthenticate],
    handler: async (request, reply) => {
      const query = z
        .object({
          page: z.coerce.number().int().positive().default(1),
          pageSize: z.coerce.number().int().positive().max(100).default(20),
          categoryId: z.string().optional(),
          isFeatured: z.coerce.boolean().optional(),
          listingType: z.string().optional(),
          sortBy: z.string().optional(),
        })
        .parse(request.query);

      const result = await listingService.getListings(query, request.user?.id);
      return reply.send({ success: true, ...result });
    },
  });

  // GET /api/v1/listings/categories — Get gem categories
  server.get('/categories', {
    handler: async (_request, reply) => {
      const categories = await listingService.getCategories();
      return reply.send({ success: true, data: categories });
    },
  });

  // GET /api/v1/listings/:id — Get listing detail (public)
  server.get('/:id', {
    preHandler: [optionalAuthenticate],
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const listing = await listingService.getListingById(id, request.user?.id);

      if (!listing) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Listing not found' },
        });
      }

      // Increment view count (fire and forget)
      void listingService.incrementViewCount(id);

      return reply.send({ success: true, data: listing });
    },
  });

  // POST /api/v1/listings — Create listing (seller only)
  server.post('/', {
    preHandler: [authenticate, requireSeller],
    handler: async (request, reply) => {
      const body = createListingSchema.parse(request.body);
      const listing = await listingService.createListing(request.user!.id, body);
      return reply.status(201).send({ success: true, data: listing });
    },
  });

  // PATCH /api/v1/listings/:id — Update listing (owner or admin)
  server.patch('/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = updateListingSchema.parse(request.body);
      const listing = await listingService.updateListing(id, request.user!, body);
      return reply.send({ success: true, data: listing });
    },
  });

  // DELETE /api/v1/listings/:id — Soft-delete listing (owner or admin)
  server.delete('/:id', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      await listingService.deleteListing(id, request.user!);
      return reply.send({ success: true, data: { message: 'Listing deleted' } });
    },
  });

  // POST /api/v1/listings/:id/publish — Publish draft listing
  server.post('/:id/publish', {
    preHandler: [authenticate, requireSeller],
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const listing = await listingService.publishListing(id, request.user!.id);
      return reply.send({ success: true, data: listing });
    },
  });

  // POST /api/v1/listings/:id/watch — Add to watchlist
  server.post('/:id/watch', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      await listingService.addToWatchlist(request.user!.id, id);
      return reply.send({ success: true, data: { message: 'Added to watchlist' } });
    },
  });

  // DELETE /api/v1/listings/:id/watch — Remove from watchlist
  server.delete('/:id/watch', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      await listingService.removeFromWatchlist(request.user!.id, id);
      return reply.send({ success: true, data: { message: 'Removed from watchlist' } });
    },
  });

  // POST /api/v1/listings/:id/report — Report a listing
  server.post('/:id/report', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = z
        .object({
          reason: z.string().min(5).max(200),
          description: z.string().max(1000).optional(),
        })
        .parse(request.body);
      await listingService.reportListing(request.user!.id, id, body.reason, body.description);
      return reply.status(201).send({ success: true, data: { message: 'Report submitted' } });
    },
  });

  // POST /api/v1/listings/presigned-url — Get presigned upload URL for listing images
  server.post('/presigned-url', {
    preHandler: [authenticate, requireSeller],
    handler: async (request, reply) => {
      const body = z.object({
        fileName: z.string(),
        contentType: z.string(),
      }).parse(request.body);

      const ext = path.extname(body.fileName) || '.jpg';
      const key = `listings/${request.user!.id}/${uuidv4()}${ext}`;
      const uploadUrl = await generateUploadUrl(key, body.contentType);
      const publicUrl = `${process.env.S3_PUBLIC_URL || process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`}/${process.env.S3_BUCKET_NAME || process.env.MINIO_BUCKET || 'gem-project'}/${key}`;

      return reply.send({ success: true, data: { uploadUrl, key, publicUrl } });
    },
  });

  // POST /api/v1/listings/:id/media — Attach uploaded images to a listing
  server.post('/:id/media', {
    preHandler: [authenticate, requireSeller],
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = z.object({
        media: z.array(z.object({
          url: z.string().url(),
          sortOrder: z.number().int().min(0).default(0),
          isThumbnail: z.boolean().default(false),
        })).min(1).max(10),
      }).parse(request.body);

      const created = await listingService.addMedia(id, request.user!.id, body.media);
      return reply.status(201).send({ success: true, data: created });
    },
  });

  // POST /api/v1/listings/:id/certificate — Attach certificate to a listing
  server.post('/:id/certificate', {
    preHandler: [authenticate, requireSeller],
    handler: async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = z.object({
        labName: z.string().min(1).max(200),
        certificateNumber: z.string().max(100).optional(),
        fileUrl: z.string().url(),
      }).parse(request.body);

      const certificate = await listingService.addCertificate(id, request.user!.id, body);
      return reply.status(201).send({ success: true, data: certificate });
    },
  });

  // GET /api/v1/listings/my — Get seller's own listings
  server.get('/my', {
    preHandler: [authenticate, requireSeller],
    handler: async (request, reply) => {
      const query = z
        .object({
          page: z.coerce.number().int().positive().default(1),
          pageSize: z.coerce.number().int().positive().max(50).default(20),
          status: z.string().optional(),
        })
        .parse(request.query);

      const result = await listingService.getMyListings(request.user!.id, query);
      return reply.send({ success: true, ...result });
    },
  });

  // GET /api/v1/listings/watchlist — Buyer's watchlist
  server.get('/watchlist', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const query = z
        .object({
          page: z.coerce.number().int().positive().default(1),
          pageSize: z.coerce.number().int().positive().max(50).default(20),
        })
        .parse(request.query);
      const result = await listingService.getWatchlist(request.user!.id, query);
      return reply.send({ success: true, ...result });
    },
  });
}
