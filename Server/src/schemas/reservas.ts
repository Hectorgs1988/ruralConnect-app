import { z } from 'zod';

export const createReservaSchema = z.object({
    usuarioId: z.string(),
    espacioId: z.string(),
    //fecha: z.coerce.date(),
    inicio: z.coerce.date(),
    fin: z.coerce.date()
}).refine(v => v.fin > v.inicio, { message: 'fin debe ser posterior a inicio', path: ['fin'] });

//filtro de consulta con estado:
export const listReservasQuerySchema = z.object({
    espacioId: z.string().optional(),
    desde: z.string().datetime().optional(), // ISO
    hasta: z.string().datetime().optional(), // ISO
    estado: z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA"]).optional(),
});