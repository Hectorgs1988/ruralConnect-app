import { z } from 'zod';

export const createProductoDespensaSchema = z.object({
    nombre: z.string().min(2),
    descripcion: z.string().max(191).optional().nullable(),
    precioCentimos: z.number().int().nonnegative(),
    unidadesDisponibles: z.number().int().nonnegative(),
    detalleMovimiento: z.string().max(191).optional().nullable(),
});

export const updateProductoDespensaSchema = createProductoDespensaSchema.partial();

export const checkoutDespensaSchema = z.object({
    items: z.array(z.object({
        productoId: z.string().min(1),
        cantidad: z.number().int().positive(),
    })).min(1),
});

export const comprasDespensaQuerySchema = z.object({
    q: z.string().trim().optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
});

export const movimientosDespensaQuerySchema = z.object({
    q: z.string().trim().optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
    tipo: z.string().trim().optional(),
});

export type CreateProductoDespensaInput = z.infer<typeof createProductoDespensaSchema>;
export type UpdateProductoDespensaInput = z.infer<typeof updateProductoDespensaSchema>;
export type CheckoutDespensaInput = z.infer<typeof checkoutDespensaSchema>;
export type ComprasDespensaQuery = z.infer<typeof comprasDespensaQuerySchema>;
export type MovimientosDespensaQuery = z.infer<typeof movimientosDespensaQuerySchema>;