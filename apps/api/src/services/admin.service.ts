import type { FastifyInstance } from 'fastify';
import { generateDownloadUrl } from '../lib/storage.js';
import { AssignReportInput, ResolveReportInput } from '@gem/validators';

export class AdminService {
  constructor(private fastify: FastifyInstance) {}

  async getPendingKyc() {
    const { prisma } = this.fastify;

    const pendingSubmissions = await prisma.kycSubmission.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        sellerProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
        documents: true,
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    // Generate read-only presigned URLs for the documents
    const profilesWithUrls = await Promise.all(
      pendingSubmissions.map(async (submission) => {
        const nicDoc = submission.documents.find(
          (d) => d.documentType === 'NIC_FRONT' || d.documentType === 'NIC_BACK' || d.documentType === 'NIC_FRONT_BACK'
        );
        const businessDoc = submission.documents.find(
          (d) => d.documentType === 'BUSINESS_REG'
        );

        const nicUrl = nicDoc?.storageKey
          ? await this.getPresignedReadUrl(nicDoc.storageKey)
          : null;

        const businessRegUrl = businessDoc?.storageKey
          ? await this.getPresignedReadUrl(businessDoc.storageKey)
          : null;

        return {
          userId: submission.sellerProfile.userId,
          businessName: submission.legalName,
          address: submission.address,
          user: submission.sellerProfile.user,
          documents: {
            nicPassportUrlSigned: nicUrl,
            businessRegUrlSigned: businessRegUrl,
          },
        };
      })
    );

    return profilesWithUrls;
  }

  async approveKyc(sellerId: string, adminId: string) {
    const { prisma } = this.fastify;

    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: sellerId },
      include: { user: true },
    });

    if (!profile) {
      throw this.fastify.httpErrors.notFound('Seller profile not found');
    }

    await prisma.$transaction([
      prisma.sellerProfile.update({
        where: { userId: sellerId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          kycStatus: 'APPROVED',
        },
      }),
      prisma.kycSubmission.updateMany({
        where: { sellerProfileId: profile.id, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: adminId },
      }),
      prisma.user.update({
        where: { id: sellerId },
        data: { role: 'VERIFIED_SELLER' },
      }),
      prisma.auditLog.create({
        data: {
          action: 'APPROVE_SELLER',
          actorId: adminId,
          resource: 'SellerProfile',
          resourceId: sellerId,
          metadata: { reason: 'Approved by admin' },
        },
      }),
    ]);

    return { success: true };
  }

  async rejectKyc(sellerId: string, adminId: string, reason?: string) {
    const { prisma } = this.fastify;

    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: sellerId },
    });

    if (!profile) {
      throw this.fastify.httpErrors.notFound('Seller profile not found');
    }

    await prisma.$transaction([
      prisma.sellerProfile.update({
        where: { userId: sellerId },
        data: {
          isVerified: false,
          kycStatus: 'REJECTED',
        },
      }),
      prisma.kycSubmission.updateMany({
        where: { sellerProfileId: profile.id, status: 'PENDING' },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: adminId, rejectionReason: reason || 'No reason provided' },
      }),
      prisma.user.update({
        where: { id: sellerId },
        data: { role: 'BUYER' },
      }),
      prisma.auditLog.create({
        data: {
          action: 'REJECT_SELLER',
          actorId: adminId,
          resource: 'SellerProfile',
          resourceId: sellerId,
          metadata: { reason: reason || 'No reason provided' },
        },
      }),
    ]);

    return { success: true, reason };
  }

  async suspendSeller(sellerId: string, adminId: string, reason?: string) {
    const { prisma } = this.fastify;

    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: sellerId },
    });

    if (!profile) {
      throw this.fastify.httpErrors.notFound('Seller profile not found');
    }

    await prisma.$transaction([
      prisma.sellerProfile.update({
        where: { userId: sellerId },
        data: {
          isVerified: false,
          kycStatus: 'NEEDS_MORE_INFO',
        },
      }),
      prisma.user.update({
        where: { id: sellerId },
        data: { role: 'BUYER' },
      }),
      prisma.auditLog.create({
        data: {
          action: 'SUSPEND_SELLER',
          actorId: adminId,
          resource: 'SellerProfile',
          resourceId: sellerId,
          metadata: { reason: reason || 'Suspended for policy violation' },
        },
      }),
    ]);

    return { success: true, reason };
  }

  private async getPresignedReadUrl(publicUrlOrKey: string) {
    const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const bucket = process.env.S3_BUCKET_NAME || 'gem-project';
    
    let key = publicUrlOrKey;
    if (publicUrlOrKey.startsWith(endpoint)) {
      key = publicUrlOrKey.replace(`${endpoint}/${bucket}/`, '');
    }

    try {
      return await generateDownloadUrl(key);
    } catch (error) {
      this.fastify.log.error(error, 'Failed to generate download url');
      return null;
    }
  }

  // --- Administrative Moderation & Safety Dashboard Methods ---

  async getReports(filters?: { status?: string; type?: string; assignedToId?: string }) {
    const { prisma } = this.fastify;

    return prisma.report.findMany({
      where: {
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.assignedToId && { assignedToId: filters.assignedToId }),
      },
      include: {
        reporter: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true },
        },
        listing: {
          select: { id: true, title: true, status: true },
        },
        stream: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignReport(reportId: string, adminId: string, data: AssignReportInput) {
    const { prisma } = this.fastify;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw this.fastify.httpErrors.notFound('Report not found');
    }

    const assignee = await prisma.user.findUnique({
      where: { id: data.assignedToId },
      select: { role: true },
    });

    if (!assignee) {
      throw this.fastify.httpErrors.notFound('Assignee not found');
    }

    if (assignee.role !== 'ADMIN' && assignee.role !== 'SUPER_ADMIN') {
      throw this.fastify.httpErrors.badRequest('Can only assign reports to administrative users');
    }

    return prisma.$transaction(async (tx) => {
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: { assignedToId: data.assignedToId },
      });

      await tx.auditLog.create({
        data: {
          action: 'REPORT_ASSIGN',
          actorId: adminId,
          resource: 'Report',
          resourceId: reportId,
          metadata: { assignedToId: data.assignedToId },
        },
      });

      return updatedReport;
    });
  }

  async resolveReport(reportId: string, adminId: string, data: ResolveReportInput) {
    const { prisma } = this.fastify;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw this.fastify.httpErrors.notFound('Report not found');
    }

    return prisma.$transaction(async (tx) => {
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: {
          status: data.status,
          adminNotes: data.adminNotes || report.adminNotes,
          resolvedAt: new Date(),
          resolvedBy: adminId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'REPORT_RESOLVE',
          actorId: adminId,
          resource: 'Report',
          resourceId: reportId,
          metadata: { status: data.status, adminNotes: data.adminNotes || null },
        },
      });

      return updatedReport;
    });
  }

  async suspendUser(userId: string, adminId: string, reason?: string) {
    const { prisma } = this.fastify;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw this.fastify.httpErrors.notFound('User not found');
    }

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      await tx.auditLog.create({
        data: {
          action: 'USER_SUSPEND',
          actorId: adminId,
          resource: 'User',
          resourceId: userId,
          metadata: { reason: reason || 'Violation of terms and conditions' },
        },
      });

      return updatedUser;
    });
  }

  async suspendListing(listingId: string, adminId: string, reason?: string) {
    const { prisma } = this.fastify;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw this.fastify.httpErrors.notFound('Listing not found');
    }

    return prisma.$transaction(async (tx) => {
      const updatedListing = await tx.listing.update({
        where: { id: listingId },
        data: { status: 'SUSPENDED', adminNotes: reason || 'Suspended by admin' },
      });

      await tx.auditLog.create({
        data: {
          action: 'LISTING_SUSPEND',
          actorId: adminId,
          resource: 'Listing',
          resourceId: listingId,
          metadata: { reason: reason || 'Violation of listing guidelines' },
        },
      });

      return updatedListing;
    });
  }
}
