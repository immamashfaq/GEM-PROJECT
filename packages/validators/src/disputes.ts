import { z } from 'zod';

export const openDisputeSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  reason: z.enum([
    'ITEM_NOT_RECEIVED',
    'ITEM_NOT_AS_DESCRIBED',
    'SUSPECTED_FAKE',
    'PAYMENT_ISSUE',
    'SELLER_ISSUE',
    'BUYER_ISSUE',
  ]),
  description: z.string().min(20, 'Description must be at least 20 characters long'),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export type OpenDisputeInput = z.infer<typeof openDisputeSchema>;

export const addEvidenceSchema = z.object({
  evidenceUrls: z.array(z.string().url()).min(1, 'At least one evidence URL is required'),
});

export type AddEvidenceInput = z.infer<typeof addEvidenceSchema>;

export const updateDisputeStatusSchema = z.object({
  status: z.enum([
    'UNDER_REVIEW',
    'WAITING_FOR_BUYER',
    'WAITING_FOR_SELLER',
    'RESOLVED_BUYER',
    'RESOLVED_SELLER',
    'REFUNDED',
    'CLOSED',
  ]),
  adminNotes: z.string().optional(),
  resolution: z.string().optional(),
});

export type UpdateDisputeStatusInput = z.infer<typeof updateDisputeStatusSchema>;
