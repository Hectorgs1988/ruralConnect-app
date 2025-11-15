import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { createEventoSchema, upsertInscripcionSchema, updateEventoSchema } from "../schemas/eventos.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

export const eventosRouter = Router();

/** GET /api/eventos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&estado=PUBLICADO */
eventosRouter.get("/", async (req, res, next) => {
    try {
        const { desde, hasta, estado } = req.query as Record<string, string | undefined>;
        const where: any = {};
        if (estado) where.estado = estado;
        if (desde || hasta) {
            where.fecha = {
                gte: desde ? new Date(desde) : undefined,
                lte: hasta ? new Date(hasta) : undefined,
            };
        }
        const eventos = await prisma.evento.findMany({
            where,
            orderBy: { fecha: "asc" },
            include: {
                Inscripciones: { select: { asistentes: true } },
            },
        });

        // suma asistentes por evento
        const enriched = eventos.map(e => ({
            ...e,
            apuntados: e.Inscripciones.reduce((acc, i) => acc + i.asistentes, 0),
        }));

        res.json(enriched);
    } catch (e) { next(e); }
});

/** POST /api/eventos  (ADMIN) */
eventosRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const data = createEventoSchema.parse(req.body);
        const evento = await prisma.evento.create({ data });
        res.status(201).json(evento);
    } catch (e) { next(e); }
});

/** PATCH /api/eventos/:id  (ADMIN) */
eventosRouter.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = updateEventoSchema.parse(req.body);
        const evento = await prisma.evento.update({ where: { id }, data });
        res.json(evento);
    } catch (e) { next(e); }
});

/** DELETE /api/eventos/:id  (ADMIN) */
eventosRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.evento.delete({ where: { id } });
        res.status(204).end();
    } catch (e) { next(e); }
});

/** POST /api/eventos/:id/inscribirme  (SOCIO) */
eventosRouter.post("/:id/inscribirme", requireAuth, async (req: any, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.sub; // del JWT
        const { asistentes } = upsertInscripcionSchema.parse(req.body);

        const evento = await prisma.evento.findUnique({ where: { id } });
        if (!evento) return res.status(404).json({ error: "Evento no encontrado" });

        // Aforo (si tiene)
        const apuntados = await prisma.inscripcionEvento.aggregate({
            where: { eventId: id },
            _sum: { asistentes: true },
        });
        const total = (apuntados._sum.asistentes ?? 0) + asistentes;
        if (evento.aforo && total > evento.aforo)
            return res.status(409).json({ error: "Aforo completo" });

        const ins = await prisma.inscripcionEvento.upsert({
            where: { eventId_userId: { eventId: id, userId } },
            update: { asistentes },
            create: { eventId: id, userId, asistentes },
        });

        res.status(201).json(ins);
    } catch (e) { next(e); }
});

/** DELETE /api/eventos/:id/desinscribirme  (SOCIO) */
eventosRouter.delete("/:id/desinscribirme", requireAuth, async (req: any, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.sub;

        await prisma.inscripcionEvento.delete({
            where: { eventId_userId: { eventId: id, userId } },
        });

        res.status(204).end();
    } catch (e) { next(e); }
});
