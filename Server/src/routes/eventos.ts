import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { createEventoSchema, upsertInscripcionSchema, updateEventoSchema } from "../schemas/eventos.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { sendEventInscriptionEmail, sendEventUnsubscribeEmail } from "../services/email.js";


export const eventosRouter = Router();

type PreguntaConOpciones = {
    id: string;
    texto: string;
    tipo: "TEXTO" | "NUMERO" | "OPCION_UNICA" | "BOOLEANO";
    esObligatoria: boolean;
    Opciones: { valor: string; orden: number }[];
};

type RespuestaInput = {
    preguntaId: string;
    valorTexto?: string;
    valorNumero?: number;
    valorBooleano?: boolean;
    valorOpcion?: string;
};

const mapPreguntas = (preguntas: PreguntaConOpciones[] | undefined) =>
    (preguntas ?? []).map((p) => ({
        id: p.id,
        texto: p.texto,
        tipo: p.tipo,
        esObligatoria: p.esObligatoria,
        opciones: p.Opciones
            .sort((a, b) => a.orden - b.orden)
            .map((o) => o.valor),
    }));

const mapEventoConInscripciones = (
    e: any,
    userId?: string
) => {
    const apuntados = (e.Inscripciones ?? []).reduce((acc: number, i: any) => acc + i.asistentes, 0);
    const miInscripcion = userId
        ? (e.Inscripciones ?? []).find((i: any) => i.userId === userId)
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
        preguntas: mapPreguntas(e.Preguntas),
    };
};

function normalizarRespuesta(resp: RespuestaInput) {
    return {
        preguntaId: resp.preguntaId,
        valorTexto: resp.valorTexto,
        valorNumero: resp.valorNumero,
        valorBooleano: resp.valorBooleano,
        valorOpcion: resp.valorOpcion,
    };
}

function validarRespuestasEvento(params: {
    preguntas: PreguntaConOpciones[];
    respuestas: RespuestaInput[];
}) {
    const { preguntas, respuestas } = params;
    const respuestasPorPregunta = new Map<string, RespuestaInput>();

    for (const resp of respuestas) {
        respuestasPorPregunta.set(resp.preguntaId, resp);
    }

    const respuestasValidadas: Array<{
        preguntaId: string;
        valorTexto?: string;
        valorNumero?: number;
        valorBooleano?: boolean;
        valorOpcion?: string;
    }> = [];

    for (const pregunta of preguntas) {
        const respuesta = respuestasPorPregunta.get(pregunta.id);

        if (!respuesta) {
            if (pregunta.esObligatoria) {
                return {
                    ok: false as const,
                    error: `Falta responder la pregunta obligatoria: ${pregunta.texto}`,
                };
            }
            continue;
        }

        if (pregunta.tipo === "TEXTO") {
            const valor = respuesta.valorTexto?.trim();
            if (!valor) {
                return {
                    ok: false as const,
                    error: `La pregunta \"${pregunta.texto}\" requiere una respuesta de texto.`,
                };
            }
            respuestasValidadas.push({ preguntaId: pregunta.id, valorTexto: valor });
            continue;
        }

        if (pregunta.tipo === "NUMERO") {
            if (!Number.isInteger(respuesta.valorNumero)) {
                return {
                    ok: false as const,
                    error: `La pregunta \"${pregunta.texto}\" requiere un número entero.`,
                };
            }
            respuestasValidadas.push({ preguntaId: pregunta.id, valorNumero: respuesta.valorNumero });
            continue;
        }

        if (pregunta.tipo === "BOOLEANO") {
            if (typeof respuesta.valorBooleano !== "boolean") {
                return {
                    ok: false as const,
                    error: `La pregunta \"${pregunta.texto}\" requiere una respuesta de sí/no.`,
                };
            }
            respuestasValidadas.push({ preguntaId: pregunta.id, valorBooleano: respuesta.valorBooleano });
            continue;
        }

        const valor = respuesta.valorOpcion?.trim();
        const opciones = new Set(pregunta.Opciones.map((o) => o.valor));
        if (!valor || !opciones.has(valor)) {
            return {
                ok: false as const,
                error: `La pregunta \"${pregunta.texto}\" requiere una opción válida.`,
            };
        }
        respuestasValidadas.push({ preguntaId: pregunta.id, valorOpcion: valor });
    }

    for (const respuesta of respuestas) {
        if (!preguntas.some((p) => p.id === respuesta.preguntaId)) {
            return {
                ok: false as const,
                error: "Se ha enviado una respuesta para una pregunta que no pertenece al evento.",
            };
        }
    }

    return { ok: true as const, respuestas: respuestasValidadas };
}

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
                Preguntas: {
                    include: {
                        Opciones: {
                            orderBy: { orden: "asc" },
                        },
                    },
                    orderBy: { orden: "asc" },
                },
            },
        });

        // Obtener userId si está autenticado
        const userId = req.user?.sub;

        // suma asistentes por evento y verifica si el usuario está inscrito
        const enriched = eventos.map((e) => mapEventoConInscripciones(e, userId));

        res.json(enriched);
    } catch (e) { next(e); }
});

/** POST /api/eventos  (ADMIN) */
eventosRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const data = createEventoSchema.parse(req.body);
        const preguntas = data.preguntas ?? [];

        const evento = await prisma.evento.create({
            data: {
                titulo: data.titulo,
                descripcion: data.descripcion,
                fecha: data.fecha,
                lugar: data.lugar,
                aforo: data.aforo,
                estado: data.estado,
                Preguntas: preguntas.length > 0
                    ? {
                        create: preguntas.map((pregunta, index) => ({
                            texto: pregunta.texto.trim(),
                            tipo: pregunta.tipo,
                            esObligatoria: pregunta.esObligatoria ?? false,
                            orden: index,
                            Opciones: pregunta.tipo === "OPCION_UNICA"
                                ? {
                                    create: (pregunta.opciones ?? []).map((op, optIndex) => ({
                                        valor: op.trim(),
                                        orden: optIndex,
                                    })),
                                }
                                : undefined,
                        })),
                    }
                    : undefined,
            },
            include: {
                Preguntas: {
                    include: {
                        Opciones: {
                            orderBy: { orden: "asc" },
                        },
                    },
                    orderBy: { orden: "asc" },
                },
            },
        });

        res.status(201).json({
            id: evento.id,
            titulo: evento.titulo,
            fecha: evento.fecha,
            lugar: evento.lugar,
            aforo: evento.aforo,
            estado: evento.estado,
            descripcion: evento.descripcion,
            preguntas: mapPreguntas(evento.Preguntas as any),
        });
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
        const { asistentes, respuestas } = upsertInscripcionSchema.parse(req.body);

        const evento = await prisma.evento.findUnique({
            where: { id },
            include: {
                Preguntas: {
                    include: {
                        Opciones: {
                            orderBy: { orden: "asc" },
                        },
                    },
                    orderBy: { orden: "asc" },
                },
            },
        });
        if (!evento) return res.status(404).json({ error: "Evento no encontrado" });

        const inscripcionExistente = await prisma.inscripcionEvento.findUnique({
            where: { eventId_userId: { eventId: id, userId } },
            include: { Respuestas: true },
        });

        // Aforo (si tiene)
        const apuntados = await prisma.inscripcionEvento.aggregate({
            where: { eventId: id },
            _sum: { asistentes: true },
        });
        const asistentesPrevios = inscripcionExistente?.asistentes ?? 0;
        const total = (apuntados._sum.asistentes ?? 0) - asistentesPrevios + asistentes;
        if (evento.aforo && total > evento.aforo)
            return res.status(409).json({ error: "Aforo completo" });

        const preguntas = evento.Preguntas as unknown as PreguntaConOpciones[];
        const respuestasProcesadas = respuestas
            ? respuestas.map((resp) => normalizarRespuesta(resp as RespuestaInput))
            : null;

        if (preguntas.length > 0) {
            const respuestasBase = respuestasProcesadas
                ?? inscripcionExistente?.Respuestas.map((r) => ({
                    preguntaId: r.preguntaId,
                    valorTexto: r.valorTexto ?? undefined,
                    valorNumero: r.valorNumero ?? undefined,
                    valorBooleano: r.valorBooleano ?? undefined,
                    valorOpcion: r.valorOpcion ?? undefined,
                }))
                ?? [];

            const validacion = validarRespuestasEvento({
                preguntas,
                respuestas: respuestasBase,
            });

            if (!validacion.ok) {
                return res.status(400).json({ error: validacion.error });
            }
        }

        const ins = await prisma.$transaction(async (tx) => {
            const inscripcion = await tx.inscripcionEvento.upsert({
                where: { eventId_userId: { eventId: id, userId } },
                update: { asistentes },
                create: { eventId: id, userId, asistentes },
            });

            if (respuestasProcesadas) {
                const validacion = validarRespuestasEvento({
                    preguntas,
                    respuestas: respuestasProcesadas,
                });

                if (!validacion.ok) {
                    throw new Error(validacion.error);
                }

                await tx.respuestaEvento.deleteMany({
                    where: { inscripcionId: inscripcion.id },
                });

                if (validacion.respuestas.length > 0) {
                    await tx.respuestaEvento.createMany({
                        data: validacion.respuestas.map((respuesta) => ({
                            inscripcionId: inscripcion.id,
                            preguntaId: respuesta.preguntaId,
                            valorTexto: respuesta.valorTexto,
                            valorNumero: respuesta.valorNumero,
                            valorBooleano: respuesta.valorBooleano,
                            valorOpcion: respuesta.valorOpcion,
                        })),
                    });
                }
            }

            return inscripcion;
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

/** GET /api/eventos/:id/respuestas  (ADMIN) */
eventosRouter.get("/:id/respuestas", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        const evento = await prisma.evento.findUnique({
            where: { id },
            include: {
                Preguntas: {
                    include: {
                        Opciones: {
                            orderBy: { orden: "asc" },
                        },
                    },
                    orderBy: { orden: "asc" },
                },
            },
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
                Respuestas: {
                    include: {
                        Pregunta: {
                            select: {
                                id: true,
                                texto: true,
                                tipo: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        const respuestaPayload = {
            evento: {
                id: evento.id,
                titulo: evento.titulo,
                preguntas: mapPreguntas(evento.Preguntas as any),
            },
            inscripciones: inscripciones
                .filter((ins) => !!ins.User)
                .map((ins) => ({
                    userId: ins.userId,
                    name: ins.User?.name,
                    asistentes: ins.asistentes,
                    respuestas: ins.Respuestas.map((r) => ({
                        preguntaId: r.preguntaId,
                        pregunta: r.Pregunta.texto,
                        tipo: r.Pregunta.tipo,
                        valorTexto: r.valorTexto,
                        valorNumero: r.valorNumero,
                        valorBooleano: r.valorBooleano,
                        valorOpcion: r.valorOpcion,
                    })),
                })),
        };

        res.json(respuestaPayload);
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
                        Inscripciones: { select: { asistentes: true, userId: true } },
                        Preguntas: {
                            include: {
                                Opciones: {
                                    orderBy: { orden: "asc" },
                                },
                            },
                            orderBy: { orden: "asc" },
                        },
                    },
                },
            },
            orderBy: { Evento: { fecha: "asc" } },
        });

        // Mapear a formato con apuntados totales e información de inscripción del usuario
        const eventosInscritos = inscripciones.map((ins) => {
            const evento = ins.Evento;
            return {
                ...mapEventoConInscripciones(evento, userId),
                misAsistentes: ins.asistentes,
                isJoined: true, // El usuario está inscrito en todos estos eventos
            };
        });

        res.json(eventosInscritos);
    } catch (e) { next(e); }
});
