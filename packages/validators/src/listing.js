import { z } from 'zod';
const currencyEnum = z.enum(['LKR', 'USD']);
const listingTypeEnum = z.enum(['FIXED_PRICE', 'NEGOTIABLE', 'TIMED_AUCTION', 'LIVE_AUCTION']);
const naturalStatusEnum = z.enum(['NATURAL', 'SYNTHETIC', 'LAB_GROWN']);
const mountedStatusEnum = z.enum(['LOOSE', 'MOUNTED']);
export const createListingBaseSchema = z
    .object({
    title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(200, 'Title must be at most 200 characters'),
    description: z
        .string()
        .min(20, 'Description must be at least 20 characters')
        .max(5000, 'Description is too long'),
    categoryId: z.string().cuid('Invalid category ID'),
    // Gem attributes
    gemType: z.string().min(1, 'Gem type is required').max(100),
    variety: z.string().max(100).optional(),
    originCountry: z.string().max(100).optional(),
    originRegion: z.string().max(100).optional(),
    caratWeight: z.number().positive('Carat weight must be positive').max(10000).optional(),
    color: z.string().max(100).optional(),
    clarity: z.string().max(100).optional(),
    cut: z.string().max(100).optional(),
    shape: z.string().max(100).optional(),
    dimensionsMm: z.string().max(100).optional(),
    treatment: z.string().max(200).optional(),
    isHeatTreated: z.boolean().optional(),
    transparency: z.string().max(100).optional(),
    refractiveIndex: z.number().positive().optional(),
    specificGravity: z.number().positive().optional(),
    hardness: z.number().min(1).max(10).optional(),
    isCertified: z.boolean().default(false),
    naturalStatus: naturalStatusEnum.default('NATURAL'),
    mountedStatus: mountedStatusEnum.default('LOOSE'),
    // Pricing
    currency: currencyEnum.default('LKR'),
    listingType: listingTypeEnum,
    fixedPrice: z.number().positive().optional(),
    negotiablePrice: z.number().positive().optional(),
    minAcceptableOffer: z.number().positive().optional(),
    auctionStartPrice: z.number().positive().optional(),
    reservePrice: z.number().positive().optional(),
    minBidIncrement: z.number().positive().optional(),
    auctionStartsAt: z.string().datetime().optional(),
    auctionEndsAt: z.string().datetime().optional(),
    autoExtend: z.boolean().default(true),
});
export const createListingSchema = createListingBaseSchema.superRefine((data, ctx) => {
    if (data.listingType === 'FIXED_PRICE' && !data.fixedPrice) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Fixed price is required for FIXED_PRICE listings',
            path: ['fixedPrice'],
        });
    }
    if (data.listingType === 'NEGOTIABLE' && !data.negotiablePrice) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Negotiable price is required for NEGOTIABLE listings',
            path: ['negotiablePrice'],
        });
    }
    if (data.listingType === 'TIMED_AUCTION') {
        if (!data.auctionStartPrice) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Auction start price is required',
                path: ['auctionStartPrice'],
            });
        }
        if (!data.auctionEndsAt) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Auction end time is required',
                path: ['auctionEndsAt'],
            });
        }
    }
});
export const updateListingSchema = createListingBaseSchema.partial();
export const listingIdSchema = z.object({
    id: z.string().cuid('Invalid listing ID'),
});
//# sourceMappingURL=listing.js.map