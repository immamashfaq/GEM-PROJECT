import { FastifyPluginAsync } from 'fastify';
import { KycService } from '../../services/kyc.service.js';
import { submitKycSchema, generatePresignedUrlSchema } from '@gem/validators';
import { authenticate } from '../../middleware/authenticate.js';

const kycRoutes: FastifyPluginAsync = async (fastify) => {
  const kycService = new KycService(fastify);

  // All KYC routes require authentication
  fastify.addHook('onRequest', authenticate);

  fastify.post('/presigned-url', async (request, reply) => {
    const user = request.user!;
    const data = generatePresignedUrlSchema.parse(request.body);

    const result = await kycService.generatePresignedUrl(
      user.id,
      data.fileName,
      data.contentType
    );

    return reply.send({ data: result });
  });

  fastify.post('/submit', async (request, reply) => {
    const user = request.user!;
    const data = submitKycSchema.parse(request.body);

    const profile = await kycService.submitKyc(user.id, data);

    return reply.send({
      message: 'KYC application submitted successfully',
      data: profile,
    });
  });

  fastify.get('/status', async (request, reply) => {
    const user = request.user!;
    const status = await kycService.getStatus(user.id);
    return reply.send({ data: status });
  });
};

export default kycRoutes;
