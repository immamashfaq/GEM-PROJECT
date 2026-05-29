import { z } from 'zod';
export const createOfferSchema = z.object({
    listingId: z.string().min(1, 'Listing ID is required'),
    amount: z.number().positive('Offer amount must be positive'),
    message: z.string().max(500, 'Message cannot exceed 500 characters').optional(),
});
export const respondOfferSchema = z.object({
    status: z.enum(['ACCEPTED', 'REJECTED']),
    note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
});
//# sourceMappingURL=offers.js.map