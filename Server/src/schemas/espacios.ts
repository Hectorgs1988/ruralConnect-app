import { z } from 'zod';

export const createEspacioSchema = z.object({
    nombre: z.string().min(2),
    tipo: z.string().min(2),
    aforo: z.number().int().positive().optional()
});
export type CreateEspacioInput = z.infer<typeof createEspacioSchema>;
