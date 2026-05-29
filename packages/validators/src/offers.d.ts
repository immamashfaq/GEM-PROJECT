import { z } from 'zod';
export declare const createOfferSchema: z.ZodObject<{
    listingId: z.ZodString;
    amount: z.ZodNumber;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    listingId: string;
    amount: number;
    message?: string | undefined;
}, {
    listingId: string;
    amount: number;
    message?: string | undefined;
}>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export declare const respondOfferSchema: z.ZodObject<{
    status: z.ZodEnum<["ACCEPTED", "REJECTED"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "ACCEPTED" | "REJECTED";
    note?: string | undefined;
}, {
    status: "ACCEPTED" | "REJECTED";
    note?: string | undefined;
}>;
export type RespondOfferInput = z.infer<typeof respondOfferSchema>;
//# sourceMappingURL=offers.d.ts.map