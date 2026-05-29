import { FastifyPluginAsync } from 'fastify';
import { createHmac } from 'crypto';
import { PaymentService } from '../../services/payment.service.js';
import { authenticate } from '../../middleware/authenticate.js';

const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  const paymentService = new PaymentService(fastify);

  // Simulation endpoint for test payment flow
  fastify.post('/simulate', async (request, reply) => {
    const { providerPaymentId, status } = request.body as { providerPaymentId: string; status: string };
    
    if (!providerPaymentId) {
      throw fastify.httpErrors.badRequest('providerPaymentId is required');
    }

    const payment = await fastify.prisma.payment.findFirst({
      where: { providerPaymentId }
    });

    if (!payment) {
      throw fastify.httpErrors.notFound('Payment record not found');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'mock_secret_signature_key';
    const payload = {
      providerPaymentId,
      status: status === 'succeeded' ? 'succeeded' : 'failed',
      amount: Number(payment.amount),
    };
    const rawBody = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    await paymentService.processWebhook('stripe_mock', { 'x-mock-signature': signature }, rawBody);
    return reply.send({ success: true });
  });

  // Add custom JSON parser to preserve rawBody for signature verification
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      const json = JSON.parse(body as string);
      (req as any).rawBody = body;
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // User requests to pay for an order
  fastify.post('/intent', { preHandler: authenticate }, async (request, reply) => {
    const { orderId, providerName } = request.body as { orderId: string; providerName?: string };
    const user = request.user!;
    
    if (!orderId) {
      throw fastify.httpErrors.badRequest('orderId is required');
    }

    const intent = await paymentService.createPaymentIntent(orderId, user.id, providerName || 'stripe_mock');
    return reply.send({ data: intent });
  });

  // Webhook endpoint by provider
  fastify.post<{ Params: { provider: string } }>('/webhook/:provider', async (request, reply) => {
    const { provider } = request.params;
    const headers = request.headers as Record<string, string>;
    const rawBody = (request as any).rawBody || JSON.stringify(request.body);

    await paymentService.processWebhook(provider, headers, rawBody);
    return reply.send({ received: true });
  });

  // Fallback webhook endpoint
  fastify.post('/webhook', async (request, reply) => {
    const headers = request.headers as Record<string, string>;
    const rawBody = (request as any).rawBody || JSON.stringify(request.body);

    await paymentService.processWebhook('stripe_mock', headers, rawBody);
    return reply.send({ received: true });
  });
};

export default paymentRoutes;
