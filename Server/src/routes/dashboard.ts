import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

export const dashboardRouter = Router();

// GET /api/dashboard/resumen  (solo ADMIN)
dashboardRouter.get("/resumen", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
        const [
            sociosTotales,
            sociosActivos,
            eventosPublicados,
            viajesCompartidos,
            reservasTotales,
            espaciosDisponibles,
            ultimosEventos,
            ultimosSocios,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.evento.count({ where: { estado: "PUBLICADO" } }),
            prisma.viaje.count(),
            prisma.reserva.count(),
            prisma.espacio.count(),
            prisma.evento.findMany({
                orderBy: { fecha: "desc" },
                take: 5,
                select: {
                    id: true,
                    titulo: true,
                    fecha: true,
                    estado: true,
                },
            }),
            prisma.user.findMany({
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            }),
        ]);

        res.json({
            sociosTotales,
            sociosActivos,
            eventosPublicados,
            viajesCompartidos,
            reservasTotales,
            espaciosDisponibles,
            ultimosEventos,
            ultimosSocios,
        });
    } catch (e) {
        next(e);
    }
});

