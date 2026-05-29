import { FastifyPluginAsync } from 'fastify';
import { DisputeService } from '../../services/dispute.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { openDisputeSchema, addEvidenceSchema } from '@gem/validators';
import { z } from 'zod';

const disputeRoutes: FastifyPluginAsync = async (fastify) => {
  const disputeService = new DisputeService(fastify);

  // Require auth for all dispute routes
  fastify.addHook('preHandler', authenticate);

  fastify.post('/presigned-url', async (request, reply) => {
    const body = z.object({
      fileName: z.string().min(1),
      contentType: z.string().min(1),
    }).parse(request.body);

    const result = await disputeService.generateEvidenceUploadUrl(
      request.user!.id,
      body.fileName,
      body.contentType
    );

    return reply.send({ data: result });
  });

  fastify.post('/', async (request, reply) => {
    const data = openDisputeSchema.parse(request.body);
    const dispute = await disputeService.openDispute(request.user!.id, data);
    return reply.status(201).send({ data: dispute });
  });

  fastify.post('/:id/evidence', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = addEvidenceSchema.parse(request.body);
    const dispute = await disputeService.addEvidence(request.user!.id, id, data);
    return reply.send({ data: dispute });
  });

  fastify.get('/', async (request, reply) => {
    const disputes = await disputeService.getMyDisputes(request.user!.id);
    return reply.send({ data: disputes });
  });
};

export default disputeRoutes;
