import { z } from 'zod';

export const createCajaProductSchema = z.object({
    id: z.string().trim().min(1).max(191),
    name: z.string().trim().min(1).max(191),
    category: z.enum(['BEBIDA', 'COMIDA']),
    priceCents: z.number().int().nonnegative(),
}).strict();

export const updateCajaProductSchema = z.object({
    name: z.string().trim().min(1).max(191).optional(),
    category: z.enum(['BEBIDA', 'COMIDA']).optional(),
    priceCents: z.number().int().nonnegative().optional(),
}).strict().refine((data) => Object.keys(data).length > 0);
