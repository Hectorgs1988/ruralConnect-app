import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { createEventoSchema, upsertInscripcionSchema, updateEventoSchema } from "../schemas/eventos.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { sendEventInscriptionEmail, sendEventUnsubscribeEmail } from "../services/email.js";


export const eventosRouter = Router();

/** GET /api/eventos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&estado=PUBLICADO */
eventosRouter.get("/", async (req: any, res, next) => {
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
                Inscripciones: { select: { asistentes: true, userId: true } },
            },
        });

        // Obtener userId si está autenticado
        const userId = req.user?.sub;

        // suma asistentes por evento y verifica si el usuario está inscrito
        const enriched = eventos.map(e => {
            const apuntados = e.Inscripciones.reduce((acc, i) => acc + i.asistentes, 0);
            const miInscripcion = userId
                ? e.Inscripciones.find(i => i.userId === userId)
                : undefined;

            return {
                id: e.id,
                titulo: e.titulo,
                fecha: e.fecha,
                lugar: e.lugar,
                aforo: e.aforo,
                estado: e.estado,
                descripcion: e.descripcion,
                apuntados,
                isJoined: !!miInscripcion,
                misAsistentes: miInscripcion?.asistentes,
            };
        });

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
        const user = req.user;
        const userId = user.sub; // del JWT
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

        // Intentar enviar email de inscripción (sin romper la respuesta si falla)
        if (user?.email) {
            try {
                await sendEventInscriptionEmail({
                    to: user.email,
                    name: user.name,
                    titulo: evento.titulo,
                    fecha: evento.fecha,
                    lugar: evento.lugar ?? null,
                    asistentes,
                });
            } catch (err) {
                console.error("Error enviando email de inscripci0n a evento:", err);
            }
        }

        res.status(201).json(ins);
    } catch (e) { next(e); }
});

/** DELETE /api/eventos/:id/desinscribirme  (SOCIO) */
eventosRouter.delete("/:id/desinscribirme", requireAuth, async (req: any, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const userId = user.sub;

        // Obtener la inscripción y el evento para poder mandar el email
        const inscripcion = await prisma.inscripcionEvento.findUnique({
            where: { eventId_userId: { eventId: id, userId } },
            include: { Evento: true },
        });

        if (!inscripcion) {
            // Si no encontramos inscripción, respondemos igualmente 204
            return res.status(204).end();
        }

        await prisma.inscripcionEvento.delete({
            where: { eventId_userId: { eventId: id, userId } },
        });

        // Intentar enviar email de baja de evento (sin romper la respuesta si falla)
        if (user?.email && inscripcion.Evento) {
            try {
                await sendEventUnsubscribeEmail({
                    to: user.email,
                    name: user.name,
                    titulo: inscripcion.Evento.titulo,
                    fecha: inscripcion.Evento.fecha,
                    lugar: inscripcion.Evento.lugar ?? null,
                    asistentes: inscripcion.asistentes,
                });
            } catch (err) {
                console.error("Error enviando email de baja de evento:", err);
            }
        }

        res.status(204).end();
    } catch (e) { next(e); }
});

/** GET /api/eventos/:id/apuntados  (SOCIO/ADMIN autenticado) */
eventosRouter.get("/:id/apuntados", requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const evento = await prisma.evento.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!evento) {
            return res.status(404).json({ error: "Evento no encontrado" });
        }

        const inscripciones = await prisma.inscripcionEvento.findMany({
            where: { eventId: id },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        const apuntados = inscripciones
            .filter((ins) => !!ins.User)
            .map((ins) => ({
                userId: ins.userId,
                name: ins.User?.name,
                asistentes: ins.asistentes,
            }));

        res.json(apuntados);
    } catch (e) {
        next(e);
    }
});

/** GET /api/eventos/mis-eventos  (SOCIO) - Eventos a los que está inscrito el usuario */
eventosRouter.get("/mis-eventos", requireAuth, async (req: any, res, next) => {
    try {
        const userId = req.user.sub;

        const inscripciones = await prisma.inscripcionEvento.findMany({
            where: { userId },
            include: {
                Evento: {
                    include: {
                        Inscripciones: { select: { asistentes: true } },
                    },
                },
            },
            orderBy: { Evento: { fecha: "asc" } },
        });

        // Mapear a formato con apuntados totales e información de inscripción del usuario
        const eventosInscritos = inscripciones.map((ins) => {
            const evento = ins.Evento;
            const apuntados = evento.Inscripciones.reduce((acc, i) => acc + i.asistentes, 0);
            return {
                id: evento.id,
                titulo: evento.titulo,
                fecha: evento.fecha,
                lugar: evento.lugar,
                aforo: evento.aforo,
                estado: evento.estado,
                descripcion: evento.descripcion,
                apuntados,
                misAsistentes: ins.asistentes,
                isJoined: true, // El usuario está inscrito en todos estos eventos
            };
        });

        res.json(eventosInscritos);
    } catch (e) { next(e); }
});
