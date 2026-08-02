import { z } from 'zod';

export const createProductoDespensaSchema = z.object({
    nombre: z.string().min(2),
    descripcion: z.string().max(191).optional().nullable(),
    precioCentimos: z.number().int().nonnegative(),
    unidadesDisponibles: z.number().int().nonnegative(),
});

export const updateProductoDespensaSchema = createProductoDespensaSchema.partial();

export const checkoutDespensaSchema = z.object({
    items: z.array(z.object({
        productoId: z.string().min(1),
        cantidad: z.number().int().positive(),
    })).min(1),
});

export type CreateProductoDespensaInput = z.infer<typeof createProductoDespensaSchema>;
export type UpdateProductoDespensaInput = z.infer<typeof updateProductoDespensaSchema>;
export type CheckoutDespensaInput = z.infer<typeof checkoutDespensaSchema>;