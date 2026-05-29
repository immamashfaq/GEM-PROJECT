import { FastifyPluginAsync } from 'fastify';
import { OfferService } from '../../services/offer.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createOfferSchema, respondOfferSchema } from '@gem/validators';

const offerRoutes: FastifyPluginAsync = async (fastify) => {
  const offerService = new OfferService(fastify);

  // All offer routes require authentication
  fastify.addHook('onRequest', authenticate);

  fastify.post('/', async (request, reply) => {
    const user = request.user!;
    const data = createOfferSchema.parse(request.body);
    const offer = await offerService.createOffer(user.id, data);
    return reply.status(201).send({ data: offer });
  });

  fastify.get('/sent', async (request, reply) => {
    const user = request.user!;
    const offers = await offerService.getSentOffers(user.id);
    return reply.send({ data: offers });
  });

  fastify.get('/received', async (request, reply) => {
    const user = request.user!;
    if (user.role === 'BUYER') {
      return reply.forbidden('Buyers cannot receive offers');
    }
    const offers = await offerService.getReceivedOffers(user.id);
    return reply.send({ data: offers });
  });

  fastify.post<{ Params: { id: string } }>('/:id/respond', async (request, reply) => {
    const user = request.user!;
    const { id } = request.params;
    const data = respondOfferSchema.parse(request.body);
    
    const offer = await offerService.respondToOffer(user.id, id, data);
    return reply.send({ data: offer });
  });
};

export default offerRoutes;
