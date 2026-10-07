import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middlewares/auth.js';

export const cajaRouter = Router();

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
