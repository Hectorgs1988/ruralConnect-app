import { z } from "zod";

const preguntaEventoSchema = z
    .object({
        texto: z.string().trim().min(2),
        tipo: z.enum(["TEXTO", "NUMERO", "OPCION_UNICA", "BOOLEANO"]),
        esObligatoria: z.boolean().optional().default(false),
        opciones: z.array(z.string().trim().min(1)).max(20).optional(),
    })
    .superRefine((val, ctx) => {
        if (val.tipo === "OPCION_UNICA") {
            if (!val.opciones || val.opciones.length < 2) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Las preguntas de opción única deben tener al menos 2 opciones.",
                    path: ["opciones"],
                });
                return;
            }

            const set = new Set(val.opciones.map((opt) => opt.toLowerCase()));
            if (set.size !== val.opciones.length) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Las opciones no pueden estar duplicadas.",
                    path: ["opciones"],
                });
            }
            return;
        }

        if (val.opciones && val.opciones.length > 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Solo las preguntas de opción única pueden definir opciones.",
                path: ["opciones"],
            });
        }
    });

const respuestaEventoSchema = z
    .object({
        preguntaId: z.string().min(1),
        valorTexto: z.string().trim().min(1).optional(),
        valorNumero: z.number().int().optional(),
        valorBooleano: z.boolean().optional(),
        valorOpcion: z.string().trim().min(1).optional(),
    })
    .superRefine((val, ctx) => {
        const provided = [
            val.valorTexto !== undefined,
            val.valorNumero !== undefined,
            val.valorBooleano !== undefined,
            val.valorOpcion !== undefined,
        ].filter(Boolean).length;

        if (provided !== 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Cada respuesta debe incluir exactamente un valor.",
            });
        }
    });

export const createEventoSchema = z.object({
    titulo: z.string().min(2),
    descripcion: z.string().optional(),
    fecha: z.coerce.date(),
    lugar: z.string().optional(),
    aforo: z.number().int().positive().optional(),
    estado: z.enum(["BORRADOR", "PUBLICADO", "CANCELADO"]).optional(),
    preguntas: z.array(preguntaEventoSchema).max(30).optional(),
});

// Para PATCH /api/eventos/:id (sin edición de preguntas en esta iteración)
export const updateEventoSchema = z.object({
    titulo: z.string().min(2).optional(),
    descripcion: z.string().optional(),
    fecha: z.coerce.date().optional(),
    lugar: z.string().optional(),
    aforo: z.number().int().positive().optional(),
    estado: z.enum(["BORRADOR", "PUBLICADO", "CANCELADO"]).optional(),
});

export const upsertInscripcionSchema = z.object({
    asistentes: z.number().int().positive().max(20).default(1),
    respuestas: z.array(respuestaEventoSchema).max(100).optional(),
});
