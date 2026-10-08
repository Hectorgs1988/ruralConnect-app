import { z } from 'zod';

export const MAX_CAJA_PRICE_CENTS = 2_147_483_647;

export const createCajaProductSchema = z.object({
    id: z.string().trim().min(1).max(191),
    name: z.string().trim().min(1).max(191),
    category: z.enum(['BEBIDA', 'COMIDA']),
    priceCents: z.number().int().nonnegative().max(MAX_CAJA_PRICE_CENTS),
}).strict();

export const updateCajaProductSchema = z.object({
    name: z.string().trim().min(1).max(191).optional(),
    category: z.enum(['BEBIDA', 'COMIDA']).optional(),
    priceCents: z.number().int().nonnegative().max(MAX_CAJA_PRICE_CENTS).optional(),
}).strict().refine((data) => Object.keys(data).length > 0);
