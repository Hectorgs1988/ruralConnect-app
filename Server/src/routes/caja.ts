import { Router } from 'express';
import { ZodError } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { createCajaProductSchema, updateCajaProductSchema } from '../schemas/caja.js';

export const cajaRouter = Router();
const requireAdmin = requireRole('ADMIN');

function handleValidationError(error: unknown, res: import('express').Response): boolean {
    if (error instanceof ZodError) {
        res.status(400).json({ error: 'Payload inválido' });
        return true;
    }
    return false;
}

function handlePrismaWriteError(error: unknown, res: import('express').Response): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
        const code = error.code;
        if (code === 'P2002') {
            res.status(409).json({ error: 'Ya existe un producto de Caja con ese ID' });
            return true;
        }
        if (code === 'P2025') {
            res.status(404).json({ error: 'Producto de Caja no encontrado' });
            return true;
        }
    }
    return false;
}

cajaRouter.get('/products', requireAuth, async (_req, res, next) => {
    try {
        const products = await prisma.cajaProduct.findMany({
            where: { active: true },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
                { id: 'asc' },
            ],
            select: {
                id: true,
                name: true,
                category: true,
                priceCents: true,
                active: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(products);
    } catch (error) {
        next(error);
    }
});

cajaRouter.get('/admin/products', requireAuth, requireAdmin, async (_req, res, next) => {
    try {
        const products = await prisma.cajaProduct.findMany({
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
                { id: 'asc' },
            ],
            select: {
                id: true,
                name: true,
                category: true,
                priceCents: true,
                active: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(products);
    } catch (error) {
        next(error);
    }
});

cajaRouter.post('/products', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const body = createCajaProductSchema.parse(req.body);
        const product = await prisma.cajaProduct.create({ data: body });
        res.status(201).json(product);
    } catch (error) {
        if (handleValidationError(error, res) || handlePrismaWriteError(error, res)) return;
        next(error);
    }
});

cajaRouter.patch('/products/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const body = updateCajaProductSchema.parse(req.body);
        const product = await prisma.cajaProduct.update({
            where: { id: req.params.id },
            data: body,
        });
        res.json(product);
    } catch (error) {
        if (handleValidationError(error, res) || handlePrismaWriteError(error, res)) return;
        next(error);
    }
});

cajaRouter.patch('/products/:id/deactivate', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const product = await prisma.cajaProduct.update({
            where: { id: req.params.id },
            data: { active: false },
        });
        res.json(product);
    } catch (error) {
        if (handlePrismaWriteError(error, res)) return;
        next(error);
    }
});

cajaRouter.patch('/products/:id/reactivate', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const product = await prisma.cajaProduct.update({
            where: { id: req.params.id },
            data: { active: true },
        });
        res.json(product);
    } catch (error) {
        if (handlePrismaWriteError(error, res)) return;
        next(error);
    }
});
