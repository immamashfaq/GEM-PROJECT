import { z } from 'zod';
export declare const createStreamSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description?: string | undefined;
    thumbnailUrl?: string | undefined;
}, {
    title: string;
    description?: string | undefined;
    thumbnailUrl?: string | undefined;
}>;
export type CreateStreamInput = z.infer<typeof createStreamSchema>;
export declare const sendChatMessageSchema: z.ZodObject<{
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
}, {
    message: string;
}>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
//# sourceMappingURL=streams.d.ts.map