import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import type { CajaProduct } from '@prisma/client';

vi.mock('../db/prisma.js', () => ({
    prisma: {
        cajaProduct: {
            findMany: vi.fn(),
        },
    },
}));

import { app } from '../app.js';
import { prisma } from '../db/prisma.js';
import { JWT_SECRET } from '../config/jwt.js';

const mockedFindMany = vi.mocked(prisma.cajaProduct.findMany);

function makeToken(role: 'ADMIN' | 'SOCIO') {
    return jwt.sign({ sub: 'user-1', role }, JWT_SECRET);
}

describe('GET /api/caja/products', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects requests without Rural Connect authentication', async () => {
        const response = await request(app).get('/api/caja/products');

        expect(response.status).toBe(401);
        expect(mockedFindMany).not.toHaveBeenCalled();
    });

    it('returns the active catalog fields in deterministic order', async () => {
        const createdAt = new Date('2026-10-07T10:00:00.000Z');
        const updatedAt = new Date('2026-10-07T11:00:00.000Z');
        const catalog: CajaProduct[] = [
            {
                id: 'cerveza',
                name: 'Cerveza',
                category: 'BEBIDA',
                priceCents: 150,
                active: true,
                createdAt,
                updatedAt,
            },
            {
                id: 'inactiva',
                name: 'Producto inactivo',
                category: 'BEBIDA',
                priceCents: 100,
                active: false,
                createdAt,
                updatedAt,
            },
        ];
        mockedFindMany.mockResolvedValue(catalog.filter((product) => product.active));

        const response = await request(app)
            .get('/api/caja/products')
            .set('Authorization', `Bearer ${makeToken('SOCIO')}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                id: 'cerveza',
                name: 'Cerveza',
                category: 'BEBIDA',
                priceCents: 150,
                active: true,
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAt.toISOString(),
            },
        ]);
        expect(response.body.map((product: { id: string }) => product.id)).not.toContain('inactiva');
        expect(mockedFindMany).toHaveBeenCalledWith({
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
    });
});
