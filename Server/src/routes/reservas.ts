import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { createReservaSchema } from '../schemas/reservas.js';

export const reservasRouter = Router();

// GET /api/reservas?espacioId=&desde=&hasta=
reservasRouter.get('/', async (req, res, next) => {
    try {
        const { espacioId, desde, hasta } = req.query as Record<string, string | undefined>;
        const where: any = {};
        if (espacioId) where.espacioId = espacioId;
        if (desde || hasta) where.inicio = { gte: desde ? new Date(desde) : undefined };
        if (hasta) where.fin = { lte: new Date(hasta) };

        const reservas = await prisma.reserva.findMany({ where, orderBy: { inicio: 'asc' } });
        res.json(reservas);
    } catch (e) { next(e); }
});

// POST /api/reservas (con chequeo de solapes)
reservasRouter.post('/', async (req, res, next) => {
    try {
        const data = createReservaSchema.parse(req.body);

        const solape = await prisma.reserva.findFirst({
            where: {
                espacioId: data.espacioId,
                // (inicio < finNueva) AND (fin > inicioNueva)
                AND: [
                    { inicio: { lt: data.fin } },
                    { fin: { gt: data.inicio } }
                ]
            }
        });
        if (solape) return res.status(409).json({ error: 'Horario no disponible' });

        const r = await prisma.reserva.create({ data });
        res.status(201).json(r);
    } catch (e) { next(e); }
});
