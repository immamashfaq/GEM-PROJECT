import { FastifyInstance } from 'fastify';
import { OpenDisputeInput, AddEvidenceInput, UpdateDisputeStatusInput } from '@gem/validators';
import { generatePrivateUploadUrl, generatePrivateDownloadUrl } from '../lib/storage.js';
import { randomUUID } from 'crypto';

export class DisputeService {
  constructor(private fastify: FastifyInstance) {}

  async generateEvidenceUploadUrl(userId: string, fileName: string, contentType: string) {
    const ext = fileName.split('.').pop() || 'jpg';
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      throw this.fastify.httpErrors.badRequest('Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.');
    }

    const key = `disputes/${userId}/${randomUUID()}.${ext}`;
    const uploadUrl = await generatePrivateUploadUrl(key, contentType);

    return {
      uploadUrl,
      key,
      publicUrl: `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${process.env.S3_PRIVATE_BUCKET_NAME || 'gem-private'}/${key}`,
    };
  }

  async openDispute(buyerId: string, data: OpenDisputeInput) {
    // 1. Verify the order belongs to the buyer and can be disputed
    const order = await this.fastify.prisma.order.findUnique({
      where: { id: data.orderId }
    });

    if (!order) {
      throw this.fastify.httpErrors.notFound('Order not found');
    }

    if (order.buyerId !== buyerId) {
      throw this.fastify.httpErrors.forbidden('You can only dispute your own orders');
    }

    // Usually you can only dispute PAID, SHIPPED, or DELIVERED orders
    if (['PENDING_PAYMENT', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
      throw this.fastify.httpErrors.badRequest('Order status is not eligible for a dispute');
    }

    // 2. Open the dispute in a transaction
    return this.fastify.prisma.$transaction(async (tx) => {
      // Create Dispute
      const evidenceData = data.evidenceUrls ? data.evidenceUrls : [];
      
      const dispute = await tx.dispute.create({
        data: {
          orderId: data.orderId,
          buyerId,
          reason: data.reason,
          description: data.description,
          evidence: evidenceData, // JSON array
          status: 'OPEN'
        }
      });

      // Update Order Status
      await tx.order.update({
        where: { id: data.orderId },
        data: { status: 'DISPUTED' }
      });

      // Log decision
      await tx.auditLog.create({
        data: {
          action: 'DISPUTE_OPENED',
          actorId: buyerId,
          resource: 'Dispute',
          resourceId: dispute.id,
          metadata: { orderId: data.orderId, reason: data.reason }
        }
      });

      return dispute;
    });
  }

  async addEvidence(buyerId: string, disputeId: string, data: AddEvidenceInput) {
    const dispute = await this.fastify.prisma.dispute.findUnique({
      where: { id: disputeId }
    });

    if (!dispute) {
      throw this.fastify.httpErrors.notFound('Dispute not found');
    }

    if (dispute.buyerId !== buyerId) {
      throw this.fastify.httpErrors.forbidden('You can only add evidence to your own disputes');
    }

    if (dispute.status !== 'OPEN') {
      throw this.fastify.httpErrors.badRequest('Dispute is not open');
    }

    const currentEvidence = (dispute.evidence as string[]) || [];
    const newEvidence = [...currentEvidence, ...data.evidenceUrls];

    return this.fastify.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        evidence: newEvidence
      }
    });
  }

  async getMyDisputes(buyerId: string) {
    return this.fastify.prisma.dispute.findMany({
      where: { buyerId },
      include: {
        order: {
          include: {
            listing: { select: { title: true, id: true, media: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- Administrative Moderation Methods ---

  async getDisputesForAdmin(filters?: { status?: string }) {
    const { prisma } = this.fastify;
    return prisma.dispute.findMany({
      where: filters?.status ? { status: filters.status as any } : {},
      include: {
        buyer: { select: { id: true, username: true, fullName: true } },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            seller: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDisputeByIdForAdmin(disputeId: string) {
    const { prisma } = this.fastify;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
          },
        },
        order: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
              },
            },
            listing: {
              select: {
                id: true,
                title: true,
                fixedPrice: true,
                negotiablePrice: true,
                currency: true,
              },
            },
            payment: true,
          },
        },
      },
    });

    if (!dispute) {
      throw this.fastify.httpErrors.notFound('Dispute not found');
    }

    // Generate signed download URLs for evidence in private bucket
    const evidenceUrls = (dispute.evidence as string[]) || [];
    const signedEvidenceUrls = await Promise.all(
      evidenceUrls.map(async (urlOrKey) => {
        const parts = urlOrKey.split('/');
        const index = parts.indexOf('disputes');
        const key = index !== -1 ? parts.slice(index).join('/') : urlOrKey;
        try {
          return await generatePrivateDownloadUrl(key);
        } catch (err) {
          this.fastify.log.error(err, `Failed to generate download URL for key: ${key}`);
          return null;
        }
      })
    );

    return {
      ...dispute,
      signedEvidenceUrls: signedEvidenceUrls.filter(Boolean) as string[],
    };
  }

  async updateDisputeStatus(disputeId: string, adminId: string, data: UpdateDisputeStatusInput) {
    const { prisma } = this.fastify;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: true },
    });

    if (!dispute) {
      throw this.fastify.httpErrors.notFound('Dispute not found');
    }

    const { status, adminNotes, resolution } = data;

    return prisma.$transaction(async (tx) => {
      // If setting to REFUNDED, process refund via payment provider
      if (status === 'REFUNDED') {
        const order = await tx.order.findUnique({
          where: { id: dispute.orderId },
          include: { payment: true },
        });

        if (!order) {
          throw this.fastify.httpErrors.notFound('Order not found');
        }

        if (order.status === 'REFUNDED') {
          throw this.fastify.httpErrors.badRequest('Order is already refunded');
        }

        if (!order.payment || order.payment.status !== 'PAID') {
          throw this.fastify.httpErrors.badRequest('Order has no successful payment to refund');
        }

        const providerName = order.payment.provider;
        const providerPaymentId = order.payment.providerPaymentId;
        if (providerPaymentId) {
          try {
            const { paymentRegistry } = await import('../lib/payments/provider-registry.js');
            const provider = paymentRegistry.get(providerName);
            const refundRes = await provider.refundPayment(providerPaymentId, Number(order.payment.amount));
            
            if (!refundRes.success) {
              throw this.fastify.httpErrors.badRequest('Payment provider failed to issue refund');
            }

            // Update payment record
            await tx.payment.update({
              where: { id: order.payment.id },
              data: {
                status: 'REFUNDED',
                refundedAt: new Date(),
                metadata: {
                  ...(order.payment.metadata as any),
                  refundReference: refundRes.refundReference,
                },
              },
            });
          } catch (err: any) {
            this.fastify.log.error(err, 'Failed to process payment provider refund');
            throw this.fastify.httpErrors.badRequest(err.message || 'Payment provider refund error');
          }
        }

        // Update Order status
        await tx.order.update({
          where: { id: dispute.orderId },
          data: { status: 'REFUNDED', cancelledAt: new Date() },
        });
      } else if (status === 'RESOLVED_BUYER' || status === 'RESOLVED_SELLER' || status === 'CLOSED') {
        // Also update order status accordingly
        let orderStatus = dispute.order.status;
        if (status === 'RESOLVED_BUYER' || status === 'CLOSED') {
          orderStatus = 'COMPLETED';
        }
        await tx.order.update({
          where: { id: dispute.orderId },
          data: { status: orderStatus },
        });
      }

      // Update Dispute
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status,
          adminNotes: adminNotes ?? dispute.adminNotes,
          resolution: resolution ?? dispute.resolution,
          resolvedAt: ['RESOLVED_BUYER', 'RESOLVED_SELLER', 'REFUNDED', 'CLOSED'].includes(status) ? new Date() : dispute.resolvedAt,
          resolvedBy: ['RESOLVED_BUYER', 'RESOLVED_SELLER', 'REFUNDED', 'CLOSED'].includes(status) ? adminId : dispute.resolvedBy,
        },
      });

      // Log decision to audit logs
      await tx.auditLog.create({
        data: {
          action: 'DISPUTE_UPDATE_STATUS',
          actorId: adminId,
          resource: 'Dispute',
          resourceId: disputeId,
          metadata: {
            oldStatus: dispute.status,
            newStatus: status,
            adminNotes: adminNotes || null,
            resolution: resolution || null,
          },
        },
      });

      return updatedDispute;
    });
  }
}
