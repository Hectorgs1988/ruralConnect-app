import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { createEspacioSchema, updateEspacioSchema } from '../schemas/espacios.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const espaciosRouter = Router();

const requireAdmin = requireRole('ADMIN');

// GET /api/espacios
espaciosRouter.get('/', async (_req, res, next) => {
    try {
        const espacios = await prisma.espacio.findMany({ orderBy: { nombre: 'asc' } });
        res.json(espacios);
    } catch (e) {
        next(e);
    }
});

// POST /api/espacios
espaciosRouter.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const body = createEspacioSchema.parse(req.body);

        const espacio = await prisma.espacio.create({
            data: {
                nombre: body.nombre,
                tipo: body.tipo,
                aforo: body.aforo ?? null,
                descripcion: body.descripcion ?? null,
            },
        });

        res.status(201).json(espacio);
    } catch (e: any) {
        // capturar UNIQUE nombre (P2002)
        if (e?.code === 'P2002') {
            return res.status(409).json({ error: 'Ya existe un espacio con ese nombre' });
        }
        next(e);
    }
});

// PATCH /api/espacios/:id
espaciosRouter.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const body = updateEspacioSchema.parse(req.body);

        const data: any = {};
        if (body.nombre !== undefined) data.nombre = body.nombre;
        if (body.tipo !== undefined) data.tipo = body.tipo;
        if (body.aforo !== undefined) data.aforo = body.aforo;
        if (body.descripcion !== undefined) data.descripcion = body.descripcion;

        const espacio = await prisma.espacio.update({
            where: { id: req.params.id },
            data,
        });

        res.json(espacio);
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return res.status(409).json({ error: 'Ya existe un espacio con ese nombre' });
        }
        next(e);
    }
});

// DELETE /api/espacios/:id
espaciosRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        await prisma.espacio.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (e) {
        next(e);
    }
});
