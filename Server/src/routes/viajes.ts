import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { createViajeSchema, joinViajeSchema } from '../schemas/viajes.js';

export const viajesRouter = Router();

// GET /api/viajes?from=&to=&desde=
viajesRouter.get('/', async (req, res, next) => {
    try {
        const { from, to, desde } = req.query as Record<string, string | undefined>;
        const where: any = {};
        if (from) where.from = { contains: from };
        if (to) where.to = { contains: to };
        if (desde) where.fecha = { gte: new Date(desde) };

        const viajes = await prisma.viaje.findMany({
            where, orderBy: { fecha: 'asc' },
            include: {
                Conductor: { select: { id: true, name: true } },
                Pasajeros: { include: { User: { select: { id: true, name: true } } } }
            }
        });
        res.json(viajes);
    } catch (e) { next(e); }
});

// POST /api/viajes (crear viaje)
viajesRouter.post('/', async (req, res, next) => {
    try {
        const data = createViajeSchema.parse(req.body);
        const viaje = await prisma.viaje.create({ data });
        res.status(201).json(viaje);
    } catch (e) { next(e); }
});

// POST /api/viajes/:id/unirse
viajesRouter.post('/:id/unirse', async (req, res, next) => {
    try {
        const { userId } = joinViajeSchema.parse(req.body);

        const viaje = await prisma.viaje.findUnique({
            where: { id: req.params.id },
            include: { Pasajeros: true }
        });
        if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

        // capacidad
        const ocupadas = viaje.Pasajeros.length;
        if (ocupadas >= viaje.plazas) return res.status(409).json({ error: 'No hay plazas' });

        const pv = await prisma.pasajeroViaje.create({
            data: { viajeId: viaje.id, userId }
        });
        res.status(201).json(pv);
    } catch (e: any) {
        // clave única (user ya unido)
        if (e.code === 'P2002') return res.status(409).json({ error: 'Ya estás unido a este viaje' });
        next(e);
    }
});

// DELETE /api/viajes/:id/unirse (salir del viaje)
viajesRouter.delete('/:id/unirse', async (req, res, next) => {
    try {
        const { userId } = joinViajeSchema.parse(req.body);
        await prisma.pasajeroViaje.delete({
            where: { viajeId_userId: { viajeId: req.params.id, userId } }
        });
        res.status(204).end();
    } catch (e) { next(e); }
});
