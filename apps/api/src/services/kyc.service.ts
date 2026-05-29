import type { FastifyInstance } from 'fastify';
import { generateUploadUrl } from '../lib/storage.js';
import { SubmitKycInput } from '@gem/validators';
import { randomUUID } from 'crypto';

export class KycService {
  constructor(private fastify: FastifyInstance) {}

  async generatePresignedUrl(userId: string, fileName: string, contentType: string) {
    const ext = fileName.split('.').pop();
    // Keep files organized by user ID to restrict access later if needed
    const key = `kyc/${userId}/${randomUUID()}.${ext}`;
    const url = await generateUploadUrl(key, contentType);
    
    return {
      uploadUrl: url,
      key, // Return the key so the client can save it when submitting the form
      publicUrl: `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${process.env.S3_BUCKET_NAME || 'gem-project'}/${key}`,
    };
  }

  async submitKyc(userId: string, data: SubmitKycInput) {
    const { prisma } = this.fastify;

    // First check if user is already a SELLER or VERIFIED_SELLER
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw this.fastify.httpErrors.notFound('User not found');
    }

    if (user.role === 'VERIFIED_SELLER') {
      throw this.fastify.httpErrors.badRequest('You are already a verified seller');
    }

    // Upsert the SellerProfile
    let sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!sellerProfile) {
      sellerProfile = await prisma.sellerProfile.create({
        data: {
          userId,
          businessName: data.businessName,
          kycStatus: 'PENDING',
        },
      });
    } else {
      sellerProfile = await prisma.sellerProfile.update({
        where: { userId },
        data: {
          businessName: data.businessName,
          kycStatus: 'PENDING',
        },
      });
    }

    // Create a KycSubmission
    const submission = await prisma.kycSubmission.create({
      data: {
        sellerProfileId: sellerProfile.id,
        legalName: data.businessName,
        address: data.address,
        phone: sellerProfile.phone || '0000000000',
        status: 'PENDING',
      },
    });

    // Parse keys from URLs
    const getStorageKey = (url: string) => {
      const parts = url.split('/');
      const index = parts.indexOf('kyc');
      if (index !== -1) {
        return parts.slice(index).join('/');
      }
      return url;
    };

    const docPromises = [];
    if (data.nicPassportUrl) {
      docPromises.push(
        prisma.kycDocument.create({
          data: {
            submissionId: submission.id,
            documentType: 'NIC_FRONT',
            storageKey: getStorageKey(data.nicPassportUrl),
            originalFilename: 'nic_passport',
            mimeType: 'application/octet-stream',
            sizeBytes: 0,
          },
        })
      );
    }
    if (data.businessRegUrl) {
      docPromises.push(
        prisma.kycDocument.create({
          data: {
            submissionId: submission.id,
            documentType: 'BUSINESS_REG',
            storageKey: getStorageKey(data.businessRegUrl),
            originalFilename: 'business_reg',
            mimeType: 'application/octet-stream',
            sizeBytes: 0,
          },
        })
      );
    }
    await Promise.all(docPromises);

    // Update user role to SELLER (pending verification) if they are currently a BUYER
    if (user.role === 'BUYER') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'SELLER' },
      });
    }

    return sellerProfile;
  }

  async getStatus(userId: string) {
    const { prisma } = this.fastify;

    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        kycStatus: true,
        isVerified: true,
        verifiedAt: true,
      },
    });

    if (!profile) {
      return { status: 'NOT_SUBMITTED' };
    }

    return {
      status: profile.kycStatus,
      isVerified: profile.isVerified,
      verifiedAt: profile.verifiedAt,
    };
  }
}
