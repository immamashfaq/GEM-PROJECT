import type { FastifyInstance } from 'fastify';
import { authenticate, requireSeller } from '../../middleware/authenticate.js';
import cloudinary from 'cloudinary';

const cloudinaryV2 = cloudinary.v2;

export async function uploadRoutes(server: FastifyInstance) {
  // Initialize Cloudinary
  cloudinaryV2.config({
    cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
    api_key: process.env['CLOUDINARY_API_KEY'],
    api_secret: process.env['CLOUDINARY_API_SECRET'],
  });

  /**
   * POST /api/v1/uploads/cloudinary-signature
   * Returns a signed signature for direct-to-Cloudinary uploads.
   * The client uses this signature to upload directly to Cloudinary.
   */
  server.post('/cloudinary-signature', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = `gem-project/listings/${request.user!.id}`;

      const paramsToSign = {
        timestamp,
        folder,
        allowed_formats: 'jpg,jpeg,png,webp,mp4,mov',
        max_bytes: 50 * 1024 * 1024, // 50MB
      };

      const signature = cloudinaryV2.utils.api_sign_request(
        paramsToSign,
        process.env['CLOUDINARY_API_SECRET'] ?? '',
      );

      return reply.send({
        success: true,
        data: {
          signature,
          timestamp,
          folder,
          cloudName: process.env['CLOUDINARY_CLOUD_NAME'],
          apiKey: process.env['CLOUDINARY_API_KEY'],
        },
      });
    },
  });

  /**
   * POST /api/v1/uploads/kyc-signed-url
   * Generates a presigned URL for private KYC document upload.
   * In Phase 1 with MinIO, we return a placeholder.
   * Full S3 integration in Phase 2 (KYC feature).
   */
  server.post('/kyc-signed-url', {
    preHandler: [authenticate, requireSeller],
    handler: async (_request, reply) => {
      // TODO: Integrate S3/MinIO presigned URL in Phase 2
      return reply.status(501).send({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'KYC upload will be available in Phase 2',
        },
      });
    },
  });
}
