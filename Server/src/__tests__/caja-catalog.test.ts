import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { Prisma, type CajaProduct } from '@prisma/client';

vi.mock('../db/prisma.js', () => ({
    prisma: {
        $transaction: vi.fn(),
        cajaProduct: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
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
const mockedFindFirst = vi.mocked(prisma.cajaProduct.findFirst);
const mockedFindUnique = vi.mocked(prisma.cajaProduct.findUnique);
const mockedCreate = vi.mocked(prisma.cajaProduct.create);
const mockedUpdate = vi.mocked(prisma.cajaProduct.update);
const mockedDelete = vi.mocked(prisma.cajaProduct.delete);
const mockedTransaction = vi.mocked(prisma.$transaction);
mockedTransaction.mockImplementation((async (callback: (transaction: typeof prisma) => Promise<unknown>) =>
    callback(prisma)) as never);

function makeToken(role: 'ADMIN' | 'SOCIO') {
    return jwt.sign({ sub: 'user-1', role }, JWT_SECRET);
}

function adminAuthorizationHeader() {
    return ['Bearer', makeToken('ADMIN')].join(' ');
}

function makeProduct(overrides: Partial<CajaProduct> = {}): CajaProduct {
    return {
        id: 'cerveza',
        name: 'Cerveza',
        category: 'BEBIDA',
        sortOrder: 0,
        priceCents: 150,
        active: true,
        createdAt: new Date('2026-10-07T10:00:00.000Z'),
        updatedAt: new Date('2026-10-07T11:00:00.000Z'),
        ...overrides,
    };
}

function omitSortOrder(product: CajaProduct) {
    const { sortOrder: _sortOrder, ...publicFields } = product;
    return publicFields;
}

function writeRequest(
    operation: 'create' | 'edit' | 'deactivate' | 'reactivate' | 'delete' | 'reorder',
    role?: 'ADMIN' | 'SOCIO',
    body?: Record<string, unknown>,
) {
    let testRequest;

    if (operation === 'create') {
        testRequest = request(app)
            .post('/api/caja/products')
            .send(body ?? { id: 'cerveza', name: 'Cerveza', category: 'BEBIDA', priceCents: 150 });
    } else if (operation === 'edit') {
        testRequest = request(app)
            .patch('/api/caja/products/cerveza')
            .send(body ?? { name: 'Cerveza especial' });
    } else if (operation === 'deactivate') {
        testRequest = request(app).patch('/api/caja/products/cerveza/deactivate');
    } else if (operation === 'reactivate') {
        testRequest = request(app).patch('/api/caja/products/cerveza/reactivate');
    } else if (operation === 'delete') {
        testRequest = request(app).delete('/api/caja/products/cerveza');
    } else {
        testRequest = request(app)
            .put('/api/caja/admin/products/order')
            .send(body ?? { category: 'BEBIDA', orderedIds: ['cerveza'] });
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

    it('allows anonymous catalog reads with active products in deterministic order and no account data', async () => {
        const createdAt = new Date('2026-10-07T10:00:00.000Z');
        const updatedAt = new Date('2026-10-07T11:00:00.000Z');
        const catalog: CajaProduct[] = [
            {
                id: 'montadito',
                name: 'Montadito',
                category: 'COMIDA',
                sortOrder: 0,
                priceCents: 300,
                active: true,
                createdAt,
                updatedAt,
            },
            {
                id: 'cerveza-z',
                name: 'Cerveza',
                category: 'BEBIDA',
                sortOrder: 2,
                priceCents: 150,
                active: true,
                createdAt,
                updatedAt,
            },
            {
                id: 'cerveza',
                name: 'Cerveza',
                category: 'BEBIDA',
                sortOrder: 0,
                priceCents: 150,
                active: true,
                createdAt,
                updatedAt,
            },
            {
                id: 'inactiva',
                name: 'Producto inactivo',
                category: 'BEBIDA',
                sortOrder: 0,
                priceCents: 100,
                active: false,
                createdAt,
                updatedAt,
            },
            {
                id: 'agua',
                name: 'Agua',
                category: 'BEBIDA',
                sortOrder: 1,
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
                left.sortOrder - right.sortOrder ||
                left.name.localeCompare(right.name) ||
                left.id.localeCompare(right.id));
        mockedFindMany.mockResolvedValue(databaseResult.map(omitSortOrder) as CajaProduct[]);

        const response = await request(app).get('/api/caja/products');

        expect(response.status).toBe(200);
        expect(response.body.map((product: { id: string }) => product.id)).toEqual([
            'cerveza',
            'agua',
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
        expect(response.body.every((product: Record<string, unknown>) =>
            Object.keys(product).sort().join(',') === 'active,category,createdAt,id,name,priceCents,updatedAt',
        )).toBe(true);
        expect(mockedFindMany).toHaveBeenCalledWith({
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
                makeProduct({ id: 'fideua', name: 'Fideuá', category: 'COMIDA', active: false, sortOrder: 0 }),
                makeProduct({ id: 'cerveza-z', name: 'Cerveza', active: true, sortOrder: 0 }),
                makeProduct({ id: 'agua', name: 'Agua', active: false, sortOrder: 2 }),
                makeProduct({ id: 'cerveza', name: 'Cerveza', active: true, sortOrder: 1 }),
            ].map((product) => ({ ...product, createdAt, updatedAt }));
            const databaseResult = [...products].sort((left, right) =>
                left.category.localeCompare(right.category) ||
                left.sortOrder - right.sortOrder ||
                left.name.localeCompare(right.name) ||
                left.id.localeCompare(right.id));
            mockedFindMany.mockResolvedValue(databaseResult.map(omitSortOrder) as CajaProduct[]);

            const response = await request(app)
                .get('/api/caja/admin/products')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

            expect(response.status).toBe(200);
            expect(response.body.map((product: { id: string }) => product.id)).toEqual([
                'cerveza-z',
                'cerveza',
                'agua',
                'fideua',
            ]);
            expect(response.body.map((product: { active: boolean }) => product.active))
                .toEqual([true, true, false, false]);
            expect(response.body[0]).toEqual({
                id: 'cerveza-z',
                name: 'Cerveza',
                category: 'BEBIDA',
                priceCents: 150,
                active: true,
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAt.toISOString(),
            });
            expect(mockedFindMany).toHaveBeenCalledWith({
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
        });
    });

    describe('Caja product administration', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it.each(['create', 'edit', 'deactivate', 'reactivate', 'delete', 'reorder'] as const)(
            'rejects unauthenticated %s requests',
            async (operation) => {
                const response = await writeRequest(operation);

                expect(response.status).toBe(401);
                expect(mockedCreate).not.toHaveBeenCalled();
                expect(mockedUpdate).not.toHaveBeenCalled();
                expect(mockedDelete).not.toHaveBeenCalled();
            },
        );

        it.each(['create', 'edit', 'deactivate', 'reactivate', 'delete', 'reorder'] as const)(
            'rejects non-admin %s requests',
            async (operation) => {
                const response = await writeRequest(operation, 'SOCIO');

                expect(response.status).toBe(403);
                expect(mockedCreate).not.toHaveBeenCalled();
                expect(mockedUpdate).not.toHaveBeenCalled();
                expect(mockedDelete).not.toHaveBeenCalled();
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
                data: { id: 'cerveza', name: 'Cerveza', category: 'BEBIDA', priceCents: 150, sortOrder: 0 },
            });
        });

        it('appends a created product after the last product in its category', async () => {
            mockedFindFirst.mockResolvedValue(makeProduct({ sortOrder: 11 }));
            mockedCreate.mockResolvedValue(makeProduct({ sortOrder: 12 }));

            const response = await writeRequest('create', 'ADMIN');

            expect(response.status).toBe(201);
            expect(mockedFindFirst).toHaveBeenCalledWith({
                where: { category: 'BEBIDA' },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });
            expect(mockedCreate).toHaveBeenCalledWith({
                data: {
                    id: 'cerveza',
                    name: 'Cerveza',
                    category: 'BEBIDA',
                    priceCents: 150,
                    sortOrder: 12,
                },
            });
            expect(mockedTransaction).toHaveBeenCalledTimes(1);
        });

        it('accepts the maximum Prisma Int price on create and edit', async () => {
            mockedFindFirst.mockResolvedValue(null);
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
                    sortOrder: 0,
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

        it('retains sortOrder when editing a product without changing its category', async () => {
            mockedUpdate.mockResolvedValue(makeProduct({ name: 'Cerveza especial', sortOrder: 8 }));

            const response = await request(app)
                .patch('/api/caja/products/cerveza')
                .set('Authorization', `******'ADMIN')}`)
                .send({ name: 'Cerveza especial' })
                .set('Authorization', adminAuthorizationHeader());

            expect(response.status).toBe(200);
            expect(mockedUpdate).toHaveBeenCalledWith({
                where: { id: 'cerveza' },
                data: { name: 'Cerveza especial' },
            });
        });

        it('appends a product to the destination category when its category changes', async () => {
            mockedFindUnique.mockResolvedValue(makeProduct({ category: 'BEBIDA' }));
            mockedFindFirst.mockResolvedValue(makeProduct({
                id: 'ultima-comida',
                category: 'COMIDA',
                sortOrder: 5,
            }));
            mockedUpdate.mockResolvedValue(makeProduct({ category: 'COMIDA', sortOrder: 6 }));

            const response = await request(app)
                .patch('/api/caja/products/cerveza')
                .set('Authorization', `******'ADMIN')}`)
                .send({ category: 'COMIDA' })
                .set('Authorization', adminAuthorizationHeader());

            expect(response.status).toBe(200);
            expect(mockedFindFirst).toHaveBeenCalledWith({
                where: { category: 'COMIDA' },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });
            expect(mockedUpdate).toHaveBeenCalledWith({
                where: { id: 'cerveza' },
                data: { category: 'COMIDA', sortOrder: 6 },
            });
            expect(mockedTransaction).toHaveBeenCalledTimes(1);
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

        it('allows an ADMIN to reactivate a product without changing its other fields or ID', async () => {
            const inactiveProduct = makeProduct({ active: false });
            mockedUpdate.mockResolvedValue({ ...inactiveProduct, active: true });

            const response = await writeRequest('reactivate', 'ADMIN');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                id: inactiveProduct.id,
                name: inactiveProduct.name,
                category: inactiveProduct.category,
                priceCents: inactiveProduct.priceCents,
                active: true,
            });
            expect(mockedUpdate).toHaveBeenCalledWith({
                where: { id: 'cerveza' },
                data: { active: true },
            });
            expect(mockedDelete).not.toHaveBeenCalled();
        });

        it('returns 404 when an ADMIN reactivates a missing product', async () => {
            mockedUpdate.mockRejectedValue(Object.assign(new Error('missing'), { code: 'P2025' }));

            const response = await writeRequest('reactivate', 'ADMIN');

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

        it('does not accept sortOrder in the normal create payload', async () => {
            const response = await request(app)
                .post('/api/caja/products')
                .set('Authorization', `******'ADMIN')}`)
                .send({
                    id: 'cerveza',
                    name: 'Cerveza',
                    category: 'BEBIDA',
                    priceCents: 150,
                    sortOrder: -20,
                })
                .set('Authorization', adminAuthorizationHeader());

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

        it('allows an ADMIN to permanently delete only the requested product', async () => {
            const requestedProduct = makeProduct({ id: 'cerveza' });
            const unrelatedProduct = makeProduct({ id: 'agua', name: 'Agua' });
            mockedDelete.mockResolvedValue(requestedProduct);

            const response = await writeRequest('delete', 'ADMIN');

            expect(response.status).toBe(204);
            expect(response.text).toBe('');
            expect(mockedDelete).toHaveBeenCalledTimes(1);
            expect(mockedDelete).toHaveBeenCalledWith({
                where: { id: requestedProduct.id },
            });
            expect(mockedCreate).not.toHaveBeenCalled();
            expect(mockedUpdate).not.toHaveBeenCalled();

            mockedFindMany.mockResolvedValue([unrelatedProduct]);

            const adminListResponse = await request(app)
                .get('/api/caja/admin/products')
                .set('Authorization', `Bearer ${makeToken('ADMIN')}`);
            expect(adminListResponse.status).toBe(200);
            expect(adminListResponse.body.map((product: { id: string }) => product.id))
                .toEqual([unrelatedProduct.id]);

            mockedFindMany.mockResolvedValue([unrelatedProduct]);

            const publicCatalogResponse = await request(app).get('/api/caja/products');
            expect(publicCatalogResponse.status).toBe(200);
            expect(publicCatalogResponse.body.map((product: { id: string }) => product.id))
                .toEqual([unrelatedProduct.id]);
            expect(mockedFindMany).toHaveBeenLastCalledWith({
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

        });

        it('returns 404 when an ADMIN permanently deletes a missing product', async () => {
            mockedDelete.mockRejectedValue(Object.assign(new Error('missing'), { code: 'P2025' }));

            const response = await writeRequest('delete', 'ADMIN');

            expect(response.status).toBe(404);
            expect(mockedDelete).toHaveBeenCalledWith({
                where: { id: 'cerveza' },
            });
            expect(mockedCreate).not.toHaveBeenCalled();
            expect(mockedUpdate).not.toHaveBeenCalled();
        });

        it('reorders the complete category, including inactive products, in one transaction', async () => {
            mockedUpdate.mockResolvedValue(makeProduct());
            mockedFindMany.mockResolvedValue([
                makeProduct({ id: 'agua', name: 'Agua', sortOrder: 0, active: true }),
                makeProduct({ id: 'inactiva', name: 'Inactiva', sortOrder: 1, active: false }),
                makeProduct({ id: 'cerveza', name: 'Cerveza', sortOrder: 2, active: true }),
            ]);

            const response = await request(app)
                .put('/api/caja/admin/products/order')
                .set('Authorization', `******'ADMIN')}`)
                .send({
                    category: 'BEBIDA',
                    orderedIds: ['cerveza', 'inactiva', 'agua'],
                })
                .set('Authorization', adminAuthorizationHeader());

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                category: 'BEBIDA',
                orderedIds: ['cerveza', 'inactiva', 'agua'],
            });
            expect(mockedTransaction).toHaveBeenCalledTimes(1);
            expect(mockedTransaction).toHaveBeenCalledWith(
                expect.any(Function),
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
            );
            expect(mockedFindMany).toHaveBeenCalledWith({
                where: { category: 'BEBIDA' },
                select: { id: true },
            });
            expect(mockedUpdate).toHaveBeenNthCalledWith(1, {
                where: { id: 'cerveza' },
                data: { sortOrder: 0 },
            });
            expect(mockedUpdate).toHaveBeenNthCalledWith(2, {
                where: { id: 'inactiva' },
                data: { sortOrder: 1 },
            });
            expect(mockedUpdate).toHaveBeenNthCalledWith(3, {
                where: { id: 'agua' },
                data: { sortOrder: 2 },
            });
        });

        it('rejects duplicate IDs before opening a transaction', async () => {
            const response = await request(app)
                .put('/api/caja/admin/products/order')
                .set('Authorization', `******'ADMIN')}`)
                .send({ category: 'BEBIDA', orderedIds: ['cerveza', 'cerveza'] })
                .set('Authorization', adminAuthorizationHeader());

            expect(response.status).toBe(400);
            expect(mockedTransaction).not.toHaveBeenCalled();
            expect(mockedUpdate).not.toHaveBeenCalled();
        });

        it.each([
            ['missing', ['agua']],
            ['unknown', ['agua', 'cerveza', 'not-a-product']],
            ['foreign-category', ['agua', 'cerveza', 'fideua']],
        ])('rejects %s or incomplete ordered ID sets without updating products', async (_kind, orderedIds) => {
            mockedFindMany.mockResolvedValue([
                makeProduct({ id: 'agua', name: 'Agua', active: true }),
                makeProduct({ id: 'cerveza', name: 'Cerveza', active: false }),
            ]);

            const response = await request(app)
                .put('/api/caja/admin/products/order')
                .set('Authorization', `******'ADMIN')}`)
                .send({ category: 'BEBIDA', orderedIds })
                .set('Authorization', adminAuthorizationHeader());

            expect(response.status).toBe(400);
            expect(mockedTransaction).toHaveBeenCalledTimes(1);
            expect(mockedUpdate).not.toHaveBeenCalled();
        });

        it('rejects malformed categories and ID lists', async () => {
            const token = `******'ADMIN')}`;
            const invalidCategory = await request(app)
                .put('/api/caja/admin/products/order')
                .set('Authorization', token)
                .send({ category: 'OTRA', orderedIds: [] })
                .set('Authorization', adminAuthorizationHeader());
            const invalidIds = await request(app)
                .put('/api/caja/admin/products/order')
                .set('Authorization', token)
                .send({ category: 'BEBIDA', orderedIds: [''] })
                .set('Authorization', adminAuthorizationHeader());

            expect(invalidCategory.status).toBe(400);
            expect(invalidIds.status).toBe(400);
            expect(mockedTransaction).not.toHaveBeenCalled();
        });

        it('does not report success when a transactional order update fails', async () => {
            mockedFindMany.mockResolvedValue([
                makeProduct({ id: 'agua', name: 'Agua' }),
                makeProduct({ id: 'cerveza', name: 'Cerveza' }),
            ]);
            mockedUpdate.mockRejectedValue(new Error('update failed'));

            const response = await request(app)
                .put('/api/caja/admin/products/order')
                .set('Authorization', `******'ADMIN')}`)
                .send({ category: 'BEBIDA', orderedIds: ['cerveza', 'agua'] })
                .set('Authorization', adminAuthorizationHeader());

            expect(response.status).toBe(500);
            expect(mockedTransaction).toHaveBeenCalledTimes(1);
        });
    });
});
