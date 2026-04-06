// Server/src/routes/reservas.ts
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { createReservaSchema, listReservasQuerySchema, } from "../schemas/reservas.js";
import { requireAuth } from "../middlewares/auth.js";
import { sendReservationConfirmationEmail, sendReservationCancelledEmail, } from "../services/email.js";

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
            where.inicio = { ...where.inicio, gte: new Date(q.desde) };
        }
        if (q.hasta) {
            where.fin = { ...where.fin, lte: new Date(q.hasta) };
        }

        const reservas = await prisma.reserva.findMany({
            where,
            orderBy: { inicio: "asc" },
            include: {
                User: { select: { id: true, name: true } },
                Espacio: { select: { id: true, nombre: true } },
            },
        });

        const publicReservas = reservas.map((r) => ({
            id: r.id,
            usuarioId: r.usuarioId,
            espacioId: r.espacioId,
            inicio: r.inicio,
            fin: r.fin,
            estado: r.estado,
            usuario: r.User ? { id: r.User.id, name: r.User.name } : null,
            espacio: r.Espacio ? { id: r.Espacio.id, nombre: r.Espacio.nombre } : null,
        }));

        res.json(publicReservas);
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
reservasRouter.post('/', requireAuth, async (req, res, next) => {
    try {
        const body = createReservaSchema.parse(req.body);
        const user = (req as any).user;
        const userId: string = user.sub;

        // solapes (ignorando reservas canceladas)
        const solape = await prisma.reserva.findFirst({
            where: {
                espacioId: body.espacioId,
                estado: { not: "CANCELADA" },
                AND: [
                    { inicio: { lt: body.fin } },
                    { fin: { gt: body.inicio } },
                ],
            },
        });
        if (solape) return res.status(409).json({ error: 'Horario no disponible' });

        const r = await prisma.reserva.create({
            data: {
                usuarioId: userId, // <-- tomado del JWT
                espacioId: body.espacioId,
                inicio: body.inicio,
                fin: body.fin,
                // estado: se queda por defecto CONFIRMADA
            },
        });

        // Intentar enviar email de confirmación (sin romper la respuesta si falla)
        if (user?.email) {
            try {
                const espacio = await prisma.espacio.findUnique({
                    where: { id: body.espacioId },
                    select: { nombre: true },
                });

                if (espacio) {
                    await sendReservationConfirmationEmail({
                        to: user.email,
                        name: user.name,
                        espacioNombre: espacio.nombre,
                        inicio: r.inicio,
                        fin: r.fin,
                    });
                }
            } catch (err) {
                console.error(
                    "Error enviando email de confirmación de reserva:",
                    err,
                );
            }
        }

        res.status(201).json(r);
    } catch (e) {
        next(e);
    }
});


// PATCH /api/reservas/:id  { estado: 'PENDIENTE'|'CONFIRMADA'|'CANCELADA' }
reservasRouter.patch("/:id", requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const authUser = (req as any).user;
        const estado = req.body?.estado;
        if (!["PENDIENTE", "CONFIRMADA", "CANCELADA"].includes(estado))
            return res.status(400).json({ error: "Estado no válido" });

        const reservaActual = await prisma.reserva.findUnique({
            where: { id },
            select: { id: true, usuarioId: true },
        });

        if (!reservaActual) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        const isAdmin = authUser?.role === "ADMIN";
        const isOwner = reservaActual.usuarioId === authUser?.sub;
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: "No autorizado" });
        }

        const r = await prisma.reserva.update({
            where: { id },
            data: { estado },
            include: {
                User: { select: { email: true, name: true } },
                Espacio: { select: { nombre: true } },
            },
        });

        // Enviar email al usuario cuando cancela la reserva
        if (estado === "CANCELADA" && r.User?.email && r.Espacio) {
            try {
                await sendReservationCancelledEmail({
                    to: r.User.email,
                    name: r.User.name,
                    espacioNombre: r.Espacio.nombre,
                    inicio: r.inicio,
                    fin: r.fin,
                });
            } catch (err) {
                console.error(
                    "Error enviando email de cancelación de reserva:",
                    err,
                );
            }
        }
        res.json({
            id: r.id,
            usuarioId: r.usuarioId,
            espacioId: r.espacioId,
            inicio: r.inicio,
            fin: r.fin,
            estado: r.estado,
        });
    } catch (e) {
        next(e);
    }
});

