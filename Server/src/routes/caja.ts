import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
    createCajaProductSchema,
    reorderCajaProductsSchema,
    updateCajaProductSchema,
} from '../schemas/caja.js';

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
        if (code === 'P2034') {
            res.status(409).json({ error: 'El catálogo cambió durante la operación; recárgalo e inténtalo de nuevo' });
            return true;
        }
    }
    return false;
}

cajaRouter.get('/products', async (_req, res, next) => {
    try {
        const products = await prisma.cajaProduct.findMany({
            where: { active: true },
            orderBy: [
                { category: 'asc' },
                { sortOrder: 'asc' },
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
                { sortOrder: 'asc' },
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

cajaRouter.put('/admin/products/order', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { category, orderedIds } = reorderCajaProductsSchema.parse(req.body);
        const submittedIds = new Set(orderedIds);

        await prisma.$transaction(async (transaction) => {
            const products = await transaction.cajaProduct.findMany({
                where: { category },
                select: { id: true },
            });
            if (
                products.length !== orderedIds.length
                || products.some((product) => !submittedIds.has(product.id))
            ) {
                throw new ZodError([{
                    code: 'custom',
                    path: ['orderedIds'],
                    message: 'Debe incluir todos los productos actuales de la categoría y ningún otro ID',
                }]);
            }

            await Promise.all(orderedIds.map((id, sortOrder) =>
                transaction.cajaProduct.update({
                    where: { id },
                    data: { sortOrder },
                }),
            ));
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        res.json({ category, orderedIds });
    } catch (error) {
        if (handleValidationError(error, res) || handlePrismaWriteError(error, res)) return;
        next(error);
    }
});

cajaRouter.post('/products', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const body = createCajaProductSchema.parse(req.body);
        const product = await prisma.$transaction(async (transaction) => {
            const lastProduct = await transaction.cajaProduct.findFirst({
                where: { category: body.category },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });
            return transaction.cajaProduct.create({
                data: { ...body, sortOrder: (lastProduct?.sortOrder ?? -1) + 1 },
            });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        res.status(201).json(product);
    } catch (error) {
        if (handleValidationError(error, res) || handlePrismaWriteError(error, res)) return;
        next(error);
    }
});

cajaRouter.patch('/products/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const body = updateCajaProductSchema.parse(req.body);
        const product = body.category
            ? await prisma.$transaction(async (transaction) => {
                const currentProduct = await transaction.cajaProduct.findUnique({
                    where: { id: req.params.id },
                    select: { category: true },
                });
                if (!currentProduct) {
                    throw Object.assign(new Error('Producto de Caja no encontrado'), { code: 'P2025' });
                }

                const data = { ...body };
                if (body.category !== currentProduct.category) {
                    const lastProduct = await transaction.cajaProduct.findFirst({
                        where: { category: body.category },
                        orderBy: { sortOrder: 'desc' },
                        select: { sortOrder: true },
                    });
                    Object.assign(data, { sortOrder: (lastProduct?.sortOrder ?? -1) + 1 });
                }

                return transaction.cajaProduct.update({
                    where: { id: req.params.id },
                    data,
                });
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
            : await prisma.cajaProduct.update({
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

cajaRouter.delete('/products/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        await prisma.cajaProduct.delete({
            where: { id: req.params.id },
        });
        res.status(204).end();
    } catch (error) {
        if (handlePrismaWriteError(error, res)) return;
        next(error);
    }
});
