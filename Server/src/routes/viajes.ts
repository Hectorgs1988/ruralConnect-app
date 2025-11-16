import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { createViajeSchema, joinViajeSchema } from '../schemas/viajes.js';
import { requireAuth } from '../middlewares/auth';
import { Phone } from 'lucide-react';
import { sendTripJoinDriverEmail, sendTripJoinPassengerEmail } from '../services/email.js';


export const viajesRouter = Router();

// GET /api/viajes?from=&to=&desde=
viajesRouter.get('/', async (req, res, next) => {
    try {
        const { from, to, desde } = req.query as Record<string, string | undefined>;

        const where: any = {};
        if (from) where.origen = { contains: from };
        if (to) where.destino = { contains: to };
        if (desde) where.fecha = { gte: new Date(desde) };

        const viajes = await prisma.viaje.findMany({
            where,
            orderBy: { fecha: 'asc' },
            include: {
                Conductor: { select: { id: true, name: true, phone: true, } },
                Pasajeros: { include: { User: { select: { id: true, name: true } } } },
            },
        });

        res.json(viajes);
    } catch (e) { next(e); }
});

/** POST /api/viajes  (crear viaje) */
viajesRouter.post("/", requireAuth, async (req, res, next) => {
    try {
        const body = createViajeSchema.parse(req.body);
        const user = (req as any).user;
        const userId: string = user.sub;

        const viaje = await prisma.viaje.create({
            data: {
                conductorId: userId,
                origen: body.origen,
                destino: body.destino,
                fecha: body.fecha,
                plazas: body.plazas,
                notas: body.notas ?? null,
                estado: "ABIERTO",
            },
        });

        res.status(201).json(viaje);
    } catch (e) {
        next(e);
    }
});


// POST /api/viajes/:id/unirse
viajesRouter.post('/:id/unirse', async (req, res, next) => {
    try {
        const { userId } = joinViajeSchema.parse(req.body);

        const viaje = await prisma.viaje.findUnique({
            where: { id: req.params.id },
            include: { Pasajeros: true },
        });
        if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

        const ocupadas = viaje.Pasajeros.length;
        if (ocupadas >= viaje.plazas) {
            return res.status(409).json({ error: 'No hay plazas' });
        }

        const pv = await prisma.pasajeroViaje.create({
            data: { viajeId: viaje.id, userId },
        });

        // Intentar enviar emails (no rompemos la respuesta si fallan)
        try {
            const pasajero = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true, phone: true },
            });

            const conductor = await prisma.user.findUnique({
                where: { id: viaje.conductorId },
                select: { name: true, email: true, phone: true },
            });

            // Email al pasajero
            if (pasajero?.email) {
                try {
                    await sendTripJoinPassengerEmail({
                        to: pasajero.email,
                        name: pasajero.name,
                        origen: viaje.origen,
                        destino: viaje.destino,
                        fecha: viaje.fecha,
                        conductorNombre: conductor?.name ?? null,
                        conductorTelefono: conductor?.phone ?? null,
                    });
                } catch (err) {
                    console.error("Error enviando email de confirmación de viaje al pasajero:", err);
                }
            }

            // Email al conductor
            if (conductor?.email && pasajero?.email) {
                try {
                    await sendTripJoinDriverEmail({
                        to: conductor.email,
                        conductorName: conductor.name,
                        pasajeroNombre: pasajero.name,
                        pasajeroTelefono: pasajero.phone ?? null,
                        pasajeroEmail: pasajero.email,
                        origen: viaje.origen,
                        destino: viaje.destino,
                        fecha: viaje.fecha,
                    });
                } catch (err) {
                    console.error("Error enviando email de aviso de nuevo pasajero al conductor:", err);
                }
            }
        } catch (err) {
            console.error("Error preparando datos para emails de viaje:", err);
        }

        res.status(201).json(pv);
    } catch (e: any) {
        if (e.code === 'P2002') return res.status(409).json({ error: 'Ya estás unido a este viaje' });
        next(e);
    }
});

// DELETE /api/viajes/:id/unirse (salir)
viajesRouter.delete('/:id/unirse', async (req, res, next) => {
    try {
        const { userId } = joinViajeSchema.parse(req.body);

        await prisma.pasajeroViaje.delete({
            where: { viajeId_userId: { viajeId: req.params.id, userId } },
        });

        res.status(204).end();
    } catch (e) { next(e); }
});
