import { z } from 'zod';

export const createEspacioSchema = z.object({
    nombre: z.string().min(2),
    tipo: z.string().min(2),
    aforo: z.number().int().positive().optional(),
    descripcion: z.string().max(191).optional().nullable(),
});

// Para PATCH /api/espacios/:id (todos los campos opcionales)
export const updateEspacioSchema = createEspacioSchema.partial();

export type CreateEspacioInput = z.infer<typeof createEspacioSchema>;
export type UpdateEspacioInput = z.infer<typeof updateEspacioSchema>;
