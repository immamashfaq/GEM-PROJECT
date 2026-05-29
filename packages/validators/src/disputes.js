import { z } from 'zod';
export const openDisputeSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    reason: z.string().min(1, 'Reason is required'),
    description: z.string().min(20, 'Description must be at least 20 characters long'),
    evidenceUrls: z.array(z.string().url()).optional(),
});
export const addEvidenceSchema = z.object({
    evidenceUrls: z.array(z.string().url()).min(1, 'At least one evidence URL is required'),
});
//# sourceMappingURL=disputes.js.map