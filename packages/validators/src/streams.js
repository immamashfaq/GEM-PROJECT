import { z } from 'zod';
export const createStreamSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
});
export const sendChatMessageSchema = z.object({
    message: z.string().min(1).max(500, 'Message is too long'),
});
//# sourceMappingURL=streams.js.map