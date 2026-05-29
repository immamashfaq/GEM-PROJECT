import { FastifyPluginAsync } from 'fastify';
import { OrderService } from '../../services/order.service.js';
import { PaymentService } from '../../services/payment.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { generateUploadUrl } from '../../lib/storage.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import {
  createOrderSchema,
  markShippedSchema,
} from '@gem/validators';

const orderRoutes: FastifyPluginAsync = async (fastify) => {
  const orderService = new OrderService(fastify);
  const paymentService = new PaymentService(fastify);

  // All order routes require authentication
  fastify.addHook('onRequest', authenticate);

  fastify.post('/presigned-url', async (request, reply) => {
    const { fileName, contentType } = request.body as { fileName: string; contentType: string };
    if (!fileName || !contentType) {
      throw fastify.httpErrors.badRequest('fileName and contentType are required');
    }
    const ext = path.extname(fileName) || '.jpg';
    const key = `proofs/${request.user!.id}/${uuidv4()}${ext}`;
    const uploadUrl = await generateUploadUrl(key, contentType);
    const publicUrl = `${process.env.S3_PUBLIC_URL || process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`}/${process.env.S3_BUCKET_NAME || process.env.MINIO_BUCKET || 'gem-project'}/${key}`;

    return reply.send({ success: true, data: { uploadUrl, key, publicUrl } });
  });

  fastify.post('/checkout', async (request, reply) => {
    const user = request.user!;
    const data = createOrderSchema.parse(request.body);
    const order = await orderService.checkout(user.id, data);
    return reply.status(201).send({ data: order });
  });

  fastify.get('/purchases', async (request, reply) => {
    const user = request.user!;
    const orders = await orderService.getPurchases(user.id);
    return reply.send({ data: orders });
  });

  fastify.get('/sales', async (request, reply) => {
    const user = request.user!;
    if (user.role === 'BUYER') {
      return reply.forbidden('Buyers do not have sales');
    }
    const orders = await orderService.getSales(user.id);
    return reply.send({ data: orders });
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    const order = await orderService.getOrderById(id, user.id, user.role);
    return reply.send({ data: order });
  });

  fastify.post('/:id/confirm', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    const order = await orderService.confirmOrder(id, user.id);
    return reply.send({ data: order });
  });

  fastify.post('/:id/pack', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    const order = await orderService.markPacked(id, user.id);
    return reply.send({ data: order });
  });

  fastify.post('/:id/ship', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    const body = markShippedSchema.parse({ ...request.body as any, orderId: id });
    const order = await orderService.markShipped(id, user.id, body);
    return reply.send({ data: order });
  });

  fastify.post('/:id/deliver', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    const order = await orderService.markDelivered(id, user.id, user.role);
    return reply.send({ data: order });
  });

  fastify.post('/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    const order = await orderService.confirmDelivery(id, user.id);
    return reply.send({ data: order });
  });

  fastify.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    const order = await orderService.cancelOrder(id, user.id, user.role);
    return reply.send({ data: order });
  });

  fastify.post('/:id/refund', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    if (user.role !== 'ADMIN') {
      return reply.forbidden('Only admins can refund orders');
    }
    const order = await orderService.refundOrder(id, user.id);
    return reply.send({ data: order });
  });

  fastify.post('/:id/upload-proof', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { proofUrl } = request.body as { proofUrl: string };
    const user = request.user!;

    if (!proofUrl) {
      throw fastify.httpErrors.badRequest('proofUrl is required');
    }

    const payment = await paymentService.uploadBankTransferProof(id, user.id, proofUrl);
    return reply.send({ data: payment });
  });
};

export default orderRoutes;
