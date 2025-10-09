import { z } from 'zod';

export const createViajeSchema = z.object({
    conductorId: z.string(),        // provisional hasta tener auth
    from: z.string().min(2),
    to: z.string().min(2),
    fecha: z.coerce.date(),
    plazas: z.number().int().positive(),
    notas: z.string().optional()
});

export const joinViajeSchema = z.object({
    userId: z.string()
});
