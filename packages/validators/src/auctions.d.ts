import { z } from 'zod';
export declare const placeBidSchema: z.ZodObject<{
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: number;
}, {
    amount: number;
}>;
export type PlaceBidInput = z.infer<typeof placeBidSchema>;
//# sourceMappingURL=auctions.d.ts.map