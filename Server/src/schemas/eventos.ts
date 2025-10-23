import { z } from "zod";

export const createEventoSchema = z.object({
    titulo: z.string().min(2),
    descripcion: z.string().optional(),
    fecha: z.coerce.date(),
    lugar: z.string().optional(),
    aforo: z.number().int().positive().optional(),
});

export const upsertInscripcionSchema = z.object({
    asistentes: z.number().int().positive().max(20).default(1),
});
