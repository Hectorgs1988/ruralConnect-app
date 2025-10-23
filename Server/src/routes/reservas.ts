// Server/src/routes/reservas.ts
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import {
    createReservaSchema,
    listReservasQuerySchema,
} from "../schemas/reservas.js";

export const reservasRouter = Router();

/**
 * GET /api/reservas?espacioId=&desde=&hasta=&estado=
 *  - espacioId: string (opcional)
 *  - desde/hasta: ISO string (opcional)
 *  - estado: PENDIENTE|CONFIRMADA|CANCELADA (opcional)
 */
reservasRouter.get("/", async (req, res, next) => {
    try {
        const q = listReservasQuerySchema.parse(req.query);

        const where: any = {};

        if (q.espacioId) where.espacioId = q.espacioId;
        if (q.estado) where.estado = q.estado; // si no lo pasas, trae todas

        // Rango de día/periodo (opcional)
        if (q.desde) {
            where.inicio = { ...(where.inicio ?? {}), gte: new Date(q.desde) };
        }
        if (q.hasta) {
            where.fin = { ...(where.fin ?? {}), lte: new Date(q.hasta) };
        }

        const reservas = await prisma.reserva.findMany({
            where,
            orderBy: { inicio: "asc" },
            include: {
                User: { select: { id: true, name: true } },
                Espacio: { select: { id: true, nombre: true } },
            },
        });

        res.json(reservas);
    } catch (e) {
        next(e);
    }
});

/**
 * POST /api/reservas
 * body: { usuarioId, espacioId, inicio(ISO), fin(ISO) }
 * - Comprueba solapes en el mismo espacio:
 *   existe r tal que !(r.fin <= nuevoInicio OR r.inicio >= nuevoFin)
 */
reservasRouter.post("/", async (req, res, next) => {
    try {
        const data = createReservaSchema.parse(req.body);

        const nuevoInicio = data.inicio;
        const nuevoFin = data.fin;

        const solape = await prisma.reserva.findFirst({
            where: {
                espacioId: data.espacioId,
                // Si quieres ignorar canceladas en el solape, descomenta:
                // estado: { not: 'CANCELADA' },
                NOT: [
                    { fin: { lte: nuevoInicio } }, // r.fin <= nuevoInicio
                    { inicio: { gte: nuevoFin } }, // r.inicio >= nuevoFin
                ],
            },
        });

        if (solape) {
            return res.status(409).json({ error: "Horario no disponible" });
        }

        const r = await prisma.reserva.create({
            data: {
                usuarioId: data.usuarioId,
                espacioId: data.espacioId,
                inicio: data.inicio,
                fin: data.fin,
                // estado -> usa el default(CONFIRMADA) del schema
            },
        });

        res.status(201).json(r);
    } catch (e) {
        next(e);
    }
});

// PATCH /api/reservas/:id  { estado: 'PENDIENTE'|'CONFIRMADA'|'CANCELADA' }
reservasRouter.patch("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const estado = req.body?.estado;
        if (!["PENDIENTE", "CONFIRMADA", "CANCELADA"].includes(estado))
            return res.status(400).json({ error: "Estado no válido" });

        const r = await prisma.reserva.update({
            where: { id },
            data: { estado },
        });
        res.json(r);
    } catch (e) {
        next(e);
    }
});

