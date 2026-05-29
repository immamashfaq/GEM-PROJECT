import { z } from 'zod';
export declare const openDisputeSchema: z.ZodObject<{
    orderId: z.ZodString;
    reason: z.ZodString;
    description: z.ZodString;
    evidenceUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    orderId: string;
    reason: string;
    evidenceUrls?: string[] | undefined;
}, {
    description: string;
    orderId: string;
    reason: string;
    evidenceUrls?: string[] | undefined;
}>;
export type OpenDisputeInput = z.infer<typeof openDisputeSchema>;
export declare const addEvidenceSchema: z.ZodObject<{
    evidenceUrls: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    evidenceUrls: string[];
}, {
    evidenceUrls: string[];
}>;
export type AddEvidenceInput = z.infer<typeof addEvidenceSchema>;
//# sourceMappingURL=disputes.d.ts.map