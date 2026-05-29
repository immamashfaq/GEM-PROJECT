import { z } from 'zod';

export const searchListingsSchema = z.object({
  q: z.string().max(200).optional(),
  gemType: z.string().max(100).optional(),
  variety: z.string().max(100).optional(),
  categoryId: z.string().optional(),
  color: z.string().max(100).optional(),
  clarity: z.string().max(100).optional(),
  cut: z.string().max(100).optional(),
  shape: z.string().max(100).optional(),
  caratMin: z.coerce.number().positive().optional(),
  caratMax: z.coerce.number().positive().optional(),
  priceMin: z.coerce.number().positive().optional(),
  priceMax: z.coerce.number().positive().optional(),
  currency: z.enum(['LKR', 'USD']).optional(),
  treatment: z.string().max(200).optional(),
  certifiedOnly: z.coerce.boolean().optional(),
  labName: z.string().max(100).optional(),
  originCountry: z.string().max(100).optional(),
  naturalStatus: z.enum(['NATURAL', 'SYNTHETIC', 'LAB_GROWN']).optional(),
  listingType: z.enum(['FIXED_PRICE', 'NEGOTIABLE', 'TIMED_AUCTION', 'LIVE_AUCTION']).optional(),
  verifiedSellersOnly: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(['newest', 'price_asc', 'price_desc', 'ending_soon', 'most_viewed', 'carat_desc', 'carat_asc'])
    .default('newest'),
});

export type SearchListingsInput = z.infer<typeof searchListingsSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
