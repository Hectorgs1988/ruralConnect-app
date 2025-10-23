import { z } from 'zod';

export const createViajeSchema = z.object({
    conductorId: z.string(),       // provisional hasta auth
    from: z.string().min(2),
    to: z.string().min(2),
    fecha: z.coerce.date(),
    plazas: z.number().int().positive(),
    notas: z.string().optional(),
}).transform(v => ({
    conductorId: v.conductorId,
    origen: v.from,
    destino: v.to,
    fecha: v.fecha,
    plazas: v.plazas,
    notas: v.notas ?? null,
}));

export const joinViajeSchema = z.object({
    userId: z.string(),
});

export type CreateViajeInput = z.infer<typeof createViajeSchema>;