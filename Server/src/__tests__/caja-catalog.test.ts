import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import type { CajaProduct } from '@prisma/client';

vi.mock('../db/prisma.js', () => ({
    prisma: {
        cajaProduct: {
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

import { app } from '../app.js';
import { prisma } from '../db/prisma.js';
import { JWT_SECRET } from '../config/jwt.js';

const mockedFindMany = vi.mocked(prisma.cajaProduct.findMany);
const mockedCreate = vi.mocked(prisma.cajaProduct.create);
const mockedUpdate = vi.mocked(prisma.cajaProduct.update);
const mockedDelete = vi.mocked(prisma.cajaProduct.delete);

function makeToken(role: 'ADMIN' | 'SOCIO') {
    return jwt.sign({ sub: 'user-1', role }, JWT_SECRET);
}

function makeProduct(overrides: Partial<CajaProduct> = {}): CajaProduct {
    return {
        id: 'cerveza',
        name: 'Cerveza',
        category: 'BEBIDA',
        priceCents: 150,
        active: true,
        createdAt: new Date('2026-10-07T10:00:00.000Z'),
        updatedAt: new Date('2026-10-07T11:00:00.000Z'),
        ...overrides,
    };
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

    describe('Caja product administration', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('rejects unauthenticated writes', async () => {
            const response = await request(app)
                .post('/api/caja/products')
                .send({ id: 'cerveza', name: 'Cerveza', category: 'BEBIDA', priceCents: 150 });

            expect(response.status).toBe(401);
            expect(mockedCreate).not.toHaveBeenCalled();
        });

        it('rejects writes from authenticated non-admin users', async () => {
            const response = await request(app)
                .post('/api/caja/products')
                .set('Authorization', `Bearer ${makeToken('SOCIO')}`)
                .send({ id: 'cerveza', name: 'Cerveza', category: 'BEBIDA', priceCents: 150 });

            expect(response.status).toBe(403);
            expect(mockedCreate).not.toHaveBeenCalled();
        });

        it('allows an ADMIN to create a product with a stable ID', async () => {
            const product = makeProduct();
            mockedCreate.mockResolvedValue(product);

            const response = await request(app)
                .post('/api/caja/products')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
                .send({ id: 'cerveza', name: 'Cerveza', category: 'BEBIDA', priceCents: 150 });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({ id: 'cerveza', priceCents: 150 });
            expect(mockedCreate).toHaveBeenCalledWith({
                data: { id: 'cerveza', name: 'Cerveza', category: 'BEBIDA', priceCents: 150 },
            });
        });

        it('allows an ADMIN to edit a product without changing its ID', async () => {
            mockedUpdate.mockResolvedValue(makeProduct({ name: 'Cerveza especial', priceCents: 200 }));

            const response = await request(app)
                .patch('/api/caja/products/cerveza')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
                .send({ name: 'Cerveza especial', priceCents: 200 });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({ id: 'cerveza', name: 'Cerveza especial', priceCents: 200 });
            expect(mockedUpdate).toHaveBeenCalledWith({
                where: { id: 'cerveza' },
                data: { name: 'Cerveza especial', priceCents: 200 },
            });
        });

        it('allows an ADMIN to deactivate a product without deleting it', async () => {
            mockedUpdate.mockResolvedValue(makeProduct({ active: false }));

            const response = await request(app)
                .patch('/api/caja/products/cerveza/deactivate')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({ id: 'cerveza', active: false });
            expect(mockedUpdate).toHaveBeenCalledWith({
                where: { id: 'cerveza' },
                data: { active: false },
            });
            expect(mockedDelete).not.toHaveBeenCalled();
        });

        it('rejects an invalid category', async () => {
            const response = await request(app)
                .post('/api/caja/products')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
                .send({ id: 'cerveza', name: 'Cerveza', category: 'BEBIDAS', priceCents: 150 });

            expect(response.status).toBe(400);
            expect(mockedCreate).not.toHaveBeenCalled();
        });

        it('rejects negative prices', async () => {
            const response = await request(app)
                .post('/api/caja/products')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
                .send({ id: 'cerveza', name: 'Cerveza', category: 'BEBIDA', priceCents: -1 });

            expect(response.status).toBe(400);
            expect(mockedCreate).not.toHaveBeenCalled();
        });

        it('rejects malformed create and update payloads', async () => {
            const token = `Bearer ${makeToken('ADMIN')}`;
            const malformedCreate = await request(app)
                .post('/api/caja/products')
                .set('Authorization', token)
                .send({ name: 'Cerveza', category: 'BEBIDA', priceCents: 150 });
            const malformedUpdate = await request(app)
                .patch('/api/caja/products/cerveza')
                .set('Authorization', token)
                .send({ id: 'otra-id' });

            expect(malformedCreate.status).toBe(400);
            expect(malformedUpdate.status).toBe(400);
            expect(mockedCreate).not.toHaveBeenCalled();
            expect(mockedUpdate).not.toHaveBeenCalled();
        });

        it('does not expose a hard-delete endpoint', async () => {
            const response = await request(app)
                .delete('/api/caja/products/cerveza')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

            expect(response.status).toBe(404);
            expect(mockedDelete).not.toHaveBeenCalled();
        });
    });
});
