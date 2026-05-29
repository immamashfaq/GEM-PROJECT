import { z } from 'zod';
export declare const submitKycSchema: z.ZodObject<{
    businessName: z.ZodString;
    registrationNo: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    taxId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    address: z.ZodString;
    nicPassportUrl: z.ZodString;
    businessRegUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    businessName: string;
    address: string;
    nicPassportUrl: string;
    registrationNo?: string | undefined;
    taxId?: string | undefined;
    businessRegUrl?: string | undefined;
}, {
    businessName: string;
    address: string;
    nicPassportUrl: string;
    registrationNo?: string | undefined;
    taxId?: string | undefined;
    businessRegUrl?: string | undefined;
}>;
export type SubmitKycInput = z.infer<typeof submitKycSchema>;
export declare const generatePresignedUrlSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    contentType: string;
}, {
    fileName: string;
    contentType: string;
}>;
export type GeneratePresignedUrlInput = z.infer<typeof generatePresignedUrlSchema>;
//# sourceMappingURL=kyc.d.ts.map