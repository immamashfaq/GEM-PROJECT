import { FastifyInstance } from 'fastify';
import { CreateReportInput } from '@gem/validators';

export class ReportService {
  constructor(private fastify: FastifyInstance) {}

  async createReport(reporterId: string, data: CreateReportInput) {
    const { prisma } = this.fastify;

    // Validate that the target exists
    switch (data.type) {
      case 'LISTING': {
        const target = await prisma.listing.findUnique({ where: { id: data.targetId } });
        if (!target) throw this.fastify.httpErrors.notFound('Listing to report not found');
        break;
      }
      case 'USER': {
        const target = await prisma.user.findUnique({ where: { id: data.targetId } });
        if (!target) throw this.fastify.httpErrors.notFound('User to report not found');
        break;
      }
      case 'STREAM': {
        const target = await prisma.liveStream.findUnique({ where: { id: data.targetId } });
        if (!target) throw this.fastify.httpErrors.notFound('Live stream to report not found');
        break;
      }
      case 'REVIEW': {
        const target = await prisma.review.findUnique({ where: { id: data.targetId } });
        if (!target) throw this.fastify.httpErrors.notFound('Review to report not found');
        break;
      }
      case 'AUCTION': {
        const target = await prisma.auction.findUnique({ where: { id: data.targetId } });
        if (!target) throw this.fastify.httpErrors.notFound('Auction to report not found');
        break;
      }
      case 'MESSAGE': {
        const target = await prisma.streamChatMessage.findUnique({ where: { id: data.targetId } });
        if (!target) throw this.fastify.httpErrors.notFound('Chat message to report not found');
        break;
      }
      default:
        throw this.fastify.httpErrors.badRequest('Invalid report target type');
    }

    // Prepare polymorphic data payload
    const reportData: any = {
      reporterId,
      type: data.type,
      reason: data.reason,
      description: data.description || null,
      status: 'PENDING',
    };

    if (data.type === 'LISTING') {
      reportData.listingId = data.targetId;
    } else if (data.type === 'STREAM') {
      reportData.streamId = data.targetId;
    } else if (data.type === 'USER') {
      reportData.userId = data.targetId;
    } else if (data.type === 'AUCTION') {
      reportData.auctionId = data.targetId;
    } else if (data.type === 'MESSAGE') {
      reportData.messageId = data.targetId;
    }

    // Atomically create report and update listing report count if applicable
    return prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: reportData,
      });

      if (data.type === 'LISTING') {
        await tx.listing.update({
          where: { id: data.targetId },
          data: { reportCount: { increment: 1 } },
        });
      }

      return report;
    });
  }
}
