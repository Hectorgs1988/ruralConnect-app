import { z } from "zod";

export const createSolicitudViajeSchema = z.object({
    origen: z.string().min(2),
    destino: z.string().min(2),
    fecha: z.coerce.date(),
    horaDesde: z.string().regex(/^\d{2}:\d{2}$/),
    horaHasta: z.string().regex(/^\d{2}:\d{2}$/),
    notas: z.string().optional().nullable(),
});

export type CreateSolicitudViajeInput =
    z.infer<typeof createSolicitudViajeSchema>;
