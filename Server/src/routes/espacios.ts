import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const espaciosRouter = Router();

// GET /api/espacios -> lista todos los espacios
espaciosRouter.get('/', async (_req, res, next) => {
    try {
        const espacios = await prisma.espacio.findMany({ orderBy: { nombre: 'asc' } });
        res.json(espacios);
    } catch (err) {
        next(err);
    }
});
