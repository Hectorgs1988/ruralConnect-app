import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { createEspacioSchema } from '../schemas/espacios.js';

export const espaciosRouter = Router();

// GET /api/espacios
espaciosRouter.get('/', async (_req, res, next) => {
    try {
        const espacios = await prisma.espacio.findMany({ orderBy: { nombre: 'asc' } });
        res.json(espacios);
    } catch (e) { next(e); }
});

// POST /api/espacios
espaciosRouter.post('/', async (req, res, next) => {
    try {
        const body = createEspacioSchema.parse(req.body);
        const espacio = await prisma.espacio.create({ data: body });
        res.status(201).json(espacio);
    } catch (e) { next(e); }
});

// DELETE /api/espacios/:id
espaciosRouter.delete('/:id', async (req, res, next) => {
    try {
        await prisma.espacio.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (e) { next(e); }
});
