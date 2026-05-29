import { FastifyPluginAsync } from 'fastify';
import { AdminService } from '../../services/admin.service.js';
import { PaymentService } from '../../services/payment.service.js';
import { StreamService } from '../../services/stream.service.js';
import { DisputeService } from '../../services/dispute.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { z } from 'zod';
import { assignReportSchema, resolveReportSchema, updateDisputeStatusSchema } from '@gem/validators';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const adminService = new AdminService(fastify);
  const paymentService = new PaymentService(fastify);
  const streamService = new StreamService(fastify);
  const disputeService = new DisputeService(fastify);

  // All Admin routes require authentication and ADMIN role
  fastify.addHook('onRequest', authenticate);
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.user!.role !== 'ADMIN') {
      return reply.forbidden('Requires ADMIN role');
    }
  });

  fastify.get('/kyc/pending', async (request, reply) => {
    const pending = await adminService.getPendingKyc();
    return reply.send({ data: pending });
  });

  fastify.post<{ Params: { id: string } }>('/kyc/:id/approve', async (request, reply) => {
    const { id } = request.params;
    const adminId = request.user!.id;
    const result = await adminService.approveKyc(id, adminId);
    return reply.send({ message: 'KYC approved successfully', data: result });
  });

  fastify.post<{ Params: { id: string }, Body: { reason?: string } }>('/kyc/:id/reject', async (request, reply) => {
    const { id } = request.params;
    const adminId = request.user!.id;
    const { reason } = request.body || {};
    const result = await adminService.rejectKyc(id, adminId, reason);
    return reply.send({ message: 'KYC rejected', data: result });
  });

  fastify.post<{ Params: { id: string }, Body: { reason?: string } }>('/kyc/:id/suspend', async (request, reply) => {
    const { id } = request.params;
    const adminId = request.user!.id;
    const { reason } = request.body || {};
    const result = await adminService.suspendSeller(id, adminId, reason);
    return reply.send({ message: 'Seller suspended', data: result });
  });

  fastify.get('/orders/pending-payments', async (request, reply) => {
    const pendingPayments = await fastify.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        provider: 'bank_transfer',
      },
      include: {
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
              }
            },
            listing: {
              include: {
                media: true
              }
            },
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    return reply.send({ data: pendingPayments });
  });

  fastify.post<{ Params: { id: string } }>('/orders/:id/approve-payment', async (request, reply) => {
    const { id } = request.params;
    const adminId = request.user!.id;
    const result = await paymentService.approveBankTransfer(id, adminId);
    return reply.send({ message: 'Bank transfer payment approved successfully', data: result });
  });

  fastify.post<{ Params: { id: string } }>('/orders/:id/reject-payment', async (request, reply) => {
    const { id } = request.params;
    const adminId = request.user!.id;
    const result = await paymentService.rejectBankTransfer(id, adminId);
    return reply.send({ message: 'Bank transfer payment rejected successfully', data: result });
  });

  fastify.get('/streams/active', async (request, reply) => {
    const streams = await streamService.getActiveStreams();
    return reply.send({ data: streams });
  });

  fastify.post<{ Params: { id: string } }>('/streams/:id/flag', async (request, reply) => {
    const { id } = request.params;
    const adminId = request.user!.id;
    const result = await streamService.flagStream(id, adminId);
    return reply.send({ message: 'Stream flagged successfully', data: result });
  });

  fastify.post<{ Params: { id: string } }>('/streams/:id/suspend', async (request, reply) => {
    const { id } = request.params;
    const adminId = request.user!.id;
    const result = await streamService.suspendStream(id, adminId);
    return reply.send({ message: 'Stream suspended successfully', data: result });
  });

  fastify.post<{ Params: { id: string } }>('/streams/:id/end', async (request, reply) => {
    const { id } = request.params;
    const stream = await fastify.prisma.liveStream.findUnique({
      where: { id },
      include: {
        sellerProfile: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });
    if (!stream) {
      return reply.notFound('Stream not found');
    }
    const sellerId = stream.sellerProfile.user.id;
    const result = await streamService.endStream(sellerId, id);
    return reply.send({ message: 'Stream ended successfully', data: result });
  });

  // --- Reports Safety Dashboard ---

  fastify.get('/reports', async (request, reply) => {
    const query = z.object({
      status: z.string().optional(),
      type: z.string().optional(),
      assignedToId: z.string().optional(),
    }).parse(request.query);
    const reports = await adminService.getReports(query);
    return reply.send({ data: reports });
  });

  fastify.post<{ Params: { id: string } }>('/reports/:id/assign', async (request, reply) => {
    const { id } = request.params;
    const data = assignReportSchema.parse(request.body);
    const result = await adminService.assignReport(id, request.user!.id, data);
    return reply.send({ message: 'Report assigned successfully', data: result });
  });

  fastify.post<{ Params: { id: string } }>('/reports/:id/resolve', async (request, reply) => {
    const { id } = request.params;
    const data = resolveReportSchema.parse(request.body);
    const result = await adminService.resolveReport(id, request.user!.id, data);
    return reply.send({ message: 'Report resolved successfully', data: result });
  });

  // --- User & Listing Suspensions ---

  fastify.post<{ Params: { id: string }, Body: { reason?: string } }>('/users/:id/suspend', async (request, reply) => {
    const { id } = request.params;
    const { reason } = request.body || {};
    const result = await adminService.suspendUser(id, request.user!.id, reason);
    return reply.send({ message: 'User suspended successfully', data: result });
  });

  fastify.post<{ Params: { id: string }, Body: { reason?: string } }>('/listings/:id/suspend', async (request, reply) => {
    const { id } = request.params;
    const { reason } = request.body || {};
    const result = await adminService.suspendListing(id, request.user!.id, reason);
    return reply.send({ message: 'Listing suspended successfully', data: result });
  });

  // --- Disputes Dashboard ---

  fastify.get('/disputes', async (request, reply) => {
    const query = z.object({
      status: z.string().optional(),
    }).parse(request.query);
    const disputes = await disputeService.getDisputesForAdmin(query);
    return reply.send({ data: disputes });
  });

  fastify.get<{ Params: { id: string } }>('/disputes/:id', async (request, reply) => {
    const { id } = request.params;
    const dispute = await disputeService.getDisputeByIdForAdmin(id);
    return reply.send({ data: dispute });
  });

  fastify.post<{ Params: { id: string } }>('/disputes/:id/status', async (request, reply) => {
    const { id } = request.params;
    const data = updateDisputeStatusSchema.parse(request.body);
    const result = await disputeService.updateDisputeStatus(id, request.user!.id, data);
    return reply.send({ message: 'Dispute status updated successfully', data: result });
  });

  fastify.get('/audit-logs', async (request, reply) => {
    const logs = await fastify.prisma.auditLog.findMany({
      include: {
        actor: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return reply.send({ data: logs });
  });
};

export default adminRoutes;
