import { z } from 'zod';

export const createReportSchema = z.object({
  type: z.enum(['LISTING', 'USER', 'STREAM', 'REVIEW', 'AUCTION', 'MESSAGE']),
  targetId: z.string().min(1, 'Target ID is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(200),
  description: z.string().max(1000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const assignReportSchema = z.object({
  assignedToId: z.string().min(1, 'Admin user ID is required'),
});

export type AssignReportInput = z.infer<typeof assignReportSchema>;

export const resolveReportSchema = z.object({
  status: z.enum(['REVIEWED', 'ACTIONED', 'DISMISSED']),
  adminNotes: z.string().optional(),
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
