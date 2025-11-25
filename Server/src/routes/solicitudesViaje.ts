import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middlewares/auth.js";
import { createSolicitudViajeSchema } from "../schemas/solicitudesViaje.js";
import { createViajeSchema } from "../schemas/viajes.js";

export const solicitudesViajeRouter = Router();

/**
 * GET /api/solicitudes-viaje
 * Lista solicitudes ABIERTAS y no expiradas
 * Filtra: viajes cancelados y fechas pasadas
 */
solicitudesViajeRouter.get("/", requireAuth, async (req, res, next) => {
    try {
        const userId = (req as any).user.sub;
        const ahora = new Date();

        const solicitudes = await prisma.solicitudViaje.findMany({
            where: {
                OR: [
                    { estado: "ABIERTA" },
                    { solicitanteId: userId },
                ],
                // Filtrar fechas pasadas
                fecha: {
                    gte: ahora,
                },
            },
            orderBy: { createdAt: "desc" },
            include: {
                Solicitante: { select: { id: true, name: true } },
                AceptadaPor: { select: { id: true, name: true } },
                Viaje: { select: { id: true, estado: true } },
            },
        });

        // Filtrar solicitudes cuyo viaje asociado está cancelado
        const solicitudesFiltradas = solicitudes.filter((s) => {
            // Si no tiene viaje asociado, mostrarla
            if (!s.Viaje) return true;
            // Si tiene viaje asociado, solo mostrar si NO está cancelado
            return s.Viaje.estado !== "CANCELADO";
        });

        res.json(solicitudesFiltradas);
    } catch (e) {
        next(e);
    }
});

/**
 * POST /api/solicitudes-viaje
 * Crear solicitud (socio)
 */
solicitudesViajeRouter.post("/", requireAuth, async (req, res, next) => {
    try {
        const body = createSolicitudViajeSchema.parse(req.body);
        const userId = (req as any).user.sub;

        const solicitud = await prisma.solicitudViaje.create({
            data: {
                solicitanteId: userId,
                origen: body.origen,
                destino: body.destino,
                fecha: body.fecha,
                horaDesde: body.horaDesde,
                horaHasta: body.horaHasta,
                notas: body.notas ?? null,
                estado: "ABIERTA",
            },
        });

        res.status(201).json(solicitud);
    } catch (e) {
        next(e);
    }
});

/**
 * POST /api/solicitudes-viaje/:id/ofrecer
 * Aceptar solicitud y crear viaje ligado
 */
solicitudesViajeRouter.post("/:id/ofrecer", requireAuth, async (req, res, next) => {
    try {
        const solicitudId = req.params.id;
        const conductorId = (req as any).user.sub;

        const solicitud = await prisma.solicitudViaje.findUnique({
            where: { id: solicitudId },
        });

        if (!solicitud || solicitud.estado !== "ABIERTA") {
            return res.status(404).json({ error: "Solicitud no disponible" });
        }

        const body = createViajeSchema.parse(req.body);

        const result = await prisma.$transaction(async (tx) => {
            const viaje = await tx.viaje.create({
                data: {
                    conductorId,
                    origen: body.origen,
                    destino: body.destino,
                    fecha: body.fecha,
                    plazas: body.plazas,
                    notas: body.notas ?? null,
                    estado: "ABIERTO",
                },
            });

            await tx.pasajeroViaje.create({
                data: { viajeId: viaje.id, userId: solicitud.solicitanteId },
            });

            const solicitudActualizada = await tx.solicitudViaje.update({
                where: { id: solicitudId },
                data: {
                    estado: "ACEPTADA",
                    aceptadaPorId: conductorId,
                    viajeId: viaje.id,
                },
            });

            return { viaje, solicitudActualizada };
        });

        res.status(201).json(result);
    } catch (e) {
        next(e);
    }
});

/**
 * DELETE /api/solicitudes-viaje/:id
 * Cancelar/borrar solicitud (solo solicitante)
 */
solicitudesViajeRouter.delete("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = (req as any).user.sub;
        const solicitudId = req.params.id;

        const solicitud = await prisma.solicitudViaje.findUnique({
            where: { id: solicitudId },
        });

        if (!solicitud) {
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        if (solicitud.solicitanteId !== userId) {
            return res.status(403).json({ error: "No autorizado" });
        }

        // Si la solicitud ya fue aceptada y tiene viaje asociado, no permitir borrarla
        if (solicitud.estado === "ACEPTADA" && solicitud.viajeId) {
            return res.status(400).json({
                error: "No puedes cancelar una solicitud que ya fue aceptada. Debes salir del viaje primero."
            });
        }

        // Borrar la solicitud
        await prisma.solicitudViaje.delete({
            where: { id: solicitudId },
        });

        res.status(204).end();
    } catch (e) {
        next(e);
    }
});
