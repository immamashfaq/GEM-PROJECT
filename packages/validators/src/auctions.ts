import { z } from 'zod';

export const placeBidSchema = z.object({
  amount: z.number().positive('Bid amount must be a positive number'),
});

export type PlaceBidInput = z.infer<typeof placeBidSchema>;
