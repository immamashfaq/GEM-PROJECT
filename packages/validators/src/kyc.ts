import { z } from 'zod';

export const submitKycSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  registrationNo: z.string().min(3, 'Registration number is required').optional().or(z.literal('')),
  taxId: z.string().optional().or(z.literal('')),
  address: z.string().min(5, 'Full business address is required'),
  nicPassportUrl: z.string().url('A valid NIC or Passport document URL is required'),
  businessRegUrl: z.string().url('A valid Business Registration document URL is required').optional().or(z.literal('')),
});

export type SubmitKycInput = z.infer<typeof submitKycSchema>;

export const generatePresignedUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().regex(/^(image\/(jpeg|png)|application\/pdf)$/, 'Only JPEG, PNG, and PDF files are allowed'),
});

export type GeneratePresignedUrlInput = z.infer<typeof generatePresignedUrlSchema>;
