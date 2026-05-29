import type { FastifyInstance } from 'fastify';
import { searchListingsSchema } from '@gem/validators';
import { SearchService } from '../../services/search.service.js';
import { optionalAuthenticate } from '../../middleware/authenticate.js';
import { z } from 'zod';

export async function searchRoutes(server: FastifyInstance) {
  const searchService = new SearchService(server);

  // GET /api/v1/search/listings — Full-text and filtered search
  server.get('/listings', {
    preHandler: [optionalAuthenticate],
    handler: async (request, reply) => {
      const filters = searchListingsSchema.parse(request.query);
      const result = await searchService.searchListings(filters, request.user?.id);
      return reply.send({ success: true, ...result });
    },
  });

  // GET /api/v1/search/facets — Get search facets
  server.get('/facets', {
    handler: async (_request, reply) => {
      const facets = await searchService.getFacets();
      return reply.send({ success: true, data: facets });
    },
  });

  // GET /api/v1/search/suggestions — Autocomplete suggestions
  server.get('/suggestions', {
    handler: async (request, reply) => {
      const { q } = z.object({ q: z.string().min(1).max(100) }).parse(request.query);
      const suggestions = await searchService.getSuggestions(q);
      return reply.send({ success: true, data: suggestions });
    },
  });
}
