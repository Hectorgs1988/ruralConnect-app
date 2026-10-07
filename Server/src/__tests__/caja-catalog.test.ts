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

function writeRequest(operation: 'create' | 'edit' | 'deactivate', role?: 'ADMIN' | 'SOCIO') {
    let testRequest;

    if (operation === 'create') {
        testRequest = request(app)
            .post('/api/caja/products')
            .send({ id: 'cerveza', name: 'Cerveza', category: 'BEBIDA', priceCents: 150 });
    } else if (operation === 'edit') {
        testRequest = request(app)
            .patch('/api/caja/products/cerveza')
            .send({ name: 'Cerveza especial' });
    } else {
        testRequest = request(app).patch('/api/caja/products/cerveza/deactivate');
    }

    if (role) {
        testRequest.set('Authorization', ['Bearer', makeToken(role)].join(' '));
    }
    return testRequest;
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

    it('returns active products in deterministic order with the catalog response shape', async () => {
        const createdAt = new Date('2026-10-07T10:00:00.000Z');
        const updatedAt = new Date('2026-10-07T11:00:00.000Z');
        const catalog: CajaProduct[] = [
            {
                id: 'montadito',
                name: 'Montadito',
                category: 'COMIDA',
                priceCents: 300,
                active: true,
                createdAt,
                updatedAt,
            },
            {
                id: 'cerveza-z',
                name: 'Cerveza',
                category: 'BEBIDA',
                priceCents: 150,
                active: true,
                createdAt,
                updatedAt,
            },
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
            {
                id: 'agua',
                name: 'Agua',
                category: 'BEBIDA',
                priceCents: 100,
                active: true,
                createdAt,
                updatedAt,
            },
        ];
        const databaseResult = catalog
            .filter((product) => product.active)
            .sort((left, right) =>
                left.category.localeCompare(right.category) ||
                left.name.localeCompare(right.name) ||
                left.id.localeCompare(right.id));
        mockedFindMany.mockResolvedValue(databaseResult);

        const response = await request(app)
            .get('/api/caja/products')
            .set('Authorization', `Bearer ${makeToken('SOCIO')}`);

        expect(response.status).toBe(200);
        expect(response.body.map((product: { id: string }) => product.id)).toEqual([
            'agua',
            'cerveza',
            'cerveza-z',
            'montadito',
        ]);
        expect(response.body).toEqual(expect.arrayContaining([
            {
                id: 'agua',
                name: 'Agua',
                category: 'BEBIDA',
                priceCents: 100,
                active: true,
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAt.toISOString(),
            },
            {
                id: 'montadito',
                name: 'Montadito',
                category: 'COMIDA',
                priceCents: 300,
                active: true,
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAt.toISOString(),
            },
        ]));
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

    describe('GET /api/caja/admin/products', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('rejects requests without Rural Connect authentication', async () => {
            const response = await request(app).get('/api/caja/admin/products');

            expect(response.status).toBe(401);
            expect(mockedFindMany).not.toHaveBeenCalled();
        });

        it('rejects authenticated non-admin users', async () => {
            const response = await request(app)
                .get('/api/caja/admin/products')
                .set('Authorization', `Bearer ${makeToken('SOCIO')}`);

            expect(response.status).toBe(403);
            expect(mockedFindMany).not.toHaveBeenCalled();
        });

        it('returns active and inactive products with deterministic order and the CajaProduct fields', async () => {
            const createdAt = new Date('2026-10-07T10:00:00.000Z');
            const updatedAt = new Date('2026-10-07T11:00:00.000Z');
            const products = [
                makeProduct({ id: 'fideua', name: 'Fideuá', category: 'COMIDA', active: false }),
                makeProduct({ id: 'cerveza-z', name: 'Cerveza', active: true }),
                makeProduct({ id: 'agua', name: 'Agua', active: false }),
                makeProduct({ id: 'cerveza', name: 'Cerveza', active: true }),
            ].map((product) => ({ ...product, createdAt, updatedAt }));
            const databaseResult = [...products].sort((left, right) =>
                left.category.localeCompare(right.category) ||
                left.name.localeCompare(right.name) ||
                left.id.localeCompare(right.id));
            mockedFindMany.mockResolvedValue(databaseResult);

            const response = await request(app)
                .get('/api/caja/admin/products')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

            expect(response.status).toBe(200);
            expect(response.body.map((product: { id: string }) => product.id)).toEqual([
                'agua',
                'cerveza',
                'cerveza-z',
                'fideua',
            ]);
            expect(response.body.map((product: { active: boolean }) => product.active))
                .toEqual([false, true, true, false]);
            expect(response.body[0]).toEqual({
                id: 'agua',
                name: 'Agua',
                category: 'BEBIDA',
                priceCents: 150,
                active: false,
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAt.toISOString(),
            });
            expect(mockedFindMany).toHaveBeenCalledWith({
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

    describe('Caja product administration', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it.each(['create', 'edit', 'deactivate'] as const)(
            'rejects unauthenticated %s requests',
            async (operation) => {
                const response = await writeRequest(operation);

                expect(response.status).toBe(401);
                expect(mockedCreate).not.toHaveBeenCalled();
                expect(mockedUpdate).not.toHaveBeenCalled();
            },
        );

        it.each(['create', 'edit', 'deactivate'] as const)(
            'rejects non-admin %s requests',
            async (operation) => {
                const response = await writeRequest(operation, 'SOCIO');

                expect(response.status).toBe(403);
                expect(mockedCreate).not.toHaveBeenCalled();
                expect(mockedUpdate).not.toHaveBeenCalled();
            },
        );

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

        it('accepts the maximum Prisma Int price on create and edit', async () => {
            const maxPriceCents = 2_147_483_647;
            mockedCreate.mockResolvedValue(makeProduct({ priceCents: maxPriceCents }));

            const createResponse = await request(app)
                .post('/api/caja/products')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
                .send({
                    id: 'cerveza',
                    name: 'Cerveza',
                    category: 'BEBIDA',
                    priceCents: maxPriceCents,
                });

            expect(createResponse.status).toBe(201);
            expect(mockedCreate).toHaveBeenCalledWith({
                data: {
                    id: 'cerveza',
                    name: 'Cerveza',
                    category: 'BEBIDA',
                    priceCents: maxPriceCents,
                },
            });

            mockedUpdate.mockResolvedValue(makeProduct({ priceCents: maxPriceCents }));
            const editResponse = await request(app)
                .patch('/api/caja/products/cerveza')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
                .send({ priceCents: maxPriceCents });

            expect(editResponse.status).toBe(200);
            expect(mockedUpdate).toHaveBeenCalledWith({
                where: { id: 'cerveza' },
                data: { priceCents: maxPriceCents },
            });
        });

        it.each(['create', 'edit'] as const)(
            'rejects prices above the Prisma Int maximum on %s without persistence',
            async (operation) => {
                const response = operation === 'create'
                    ? await request(app)
                        .post('/api/caja/products')
                        .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
                        .send({
                            id: 'cerveza',
                            name: 'Cerveza',
                            category: 'BEBIDA',
                            priceCents: 2_147_483_648,
                        })
                    : await request(app)
                        .patch('/api/caja/products/cerveza')
                        .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
                        .send({ priceCents: 2_147_483_648 });

                expect(response.status).toBe(400);
                expect(mockedCreate).not.toHaveBeenCalled();
                expect(mockedUpdate).not.toHaveBeenCalled();
            },
        );

        it.each([
            ['negative', -1],
            ['non-integer', 150.5],
        ])('rejects %s prices on create and edit', async (_kind, priceCents) => {
            const token = `Bearer ${makeToken('ADMIN')}`;
            const createResponse = await request(app)
                .post('/api/caja/products')
                .set('Authorization', token)
                .send({
                    id: 'cerveza',
                    name: 'Cerveza',
                    category: 'BEBIDA',
                    priceCents,
                });
            const editResponse = await request(app)
                .patch('/api/caja/products/cerveza')
                .set('Authorization', token)
                .send({ priceCents });

            expect(createResponse.status).toBe(400);
            expect(editResponse.status).toBe(400);
            expect(mockedCreate).not.toHaveBeenCalled();
            expect(mockedUpdate).not.toHaveBeenCalled();
        });

        it('returns 409 when an ADMIN creates a duplicate product ID', async () => {
            mockedCreate.mockRejectedValue(Object.assign(new Error('duplicate'), { code: 'P2002' }));

            const response = await writeRequest('create', 'ADMIN');

            expect(response.status).toBe(409);
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

        it('returns 404 when an ADMIN edits a missing product', async () => {
            mockedUpdate.mockRejectedValue(Object.assign(new Error('missing'), { code: 'P2025' }));

            const response = await writeRequest('edit', 'ADMIN');

            expect(response.status).toBe(404);
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

        it('returns 404 when an ADMIN deactivates a missing product', async () => {
            mockedUpdate.mockRejectedValue(Object.assign(new Error('missing'), { code: 'P2025' }));

            const response = await writeRequest('deactivate', 'ADMIN');

            expect(response.status).toBe(404);
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
