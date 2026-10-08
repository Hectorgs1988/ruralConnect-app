import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateMany, mockFindMany, mockDisconnect } = vi.hoisted(() => ({
    mockCreateMany: vi.fn(),
    mockFindMany: vi.fn(),
    mockDisconnect: vi.fn(),
}));

vi.mock('../db/prisma.js', () => ({
    prisma: {
        cajaProduct: {
            findMany: mockFindMany,
            createMany: mockCreateMany,
        },
        $transaction: (callback: (transaction: unknown) => Promise<unknown>) => callback({
            cajaProduct: {
                findMany: mockFindMany,
                createMany: mockCreateMany,
            },
        }),
        $disconnect: mockDisconnect,
    },
}));

type SourceProduct = { id: string; name: string; price: number };
type SourceCatalog = { bebida: SourceProduct[]; comida: SourceProduct[] };

describe('Caja catalog seed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFindMany.mockResolvedValue([]);
        mockCreateMany.mockResolvedValue({ count: 37 });
        mockDisconnect.mockResolvedValue(undefined);
    });

    it('maps only approved JSON products to cents and uses duplicate-safe inserts', async () => {
        const source = JSON.parse(
            await readFile(new URL('../../../legacy/CajaSusinos/public/products.json', import.meta.url), 'utf8'),
        ) as SourceCatalog;
        const expectedProducts = [
            ...source.bebida.map(({ id, name, price }, sortOrder) => ({
                id,
                name,
                category: 'BEBIDA',
                priceCents: Math.round(price * 100),
                sortOrder,
            })),
            ...source.comida.map(({ id, name, price }, sortOrder) => ({
                id,
                name,
                category: 'COMIDA',
                priceCents: Math.round(price * 100),
                sortOrder,
            })),
        ];

        await import('../scripts/seed-caja.js');
        await vi.waitFor(() => expect(mockDisconnect).toHaveBeenCalledTimes(1));

        expect(mockFindMany).toHaveBeenCalledWith({
            select: { id: true, category: true, sortOrder: true },
        });
        expect(mockCreateMany).toHaveBeenCalledWith({
            data: expectedProducts,
            skipDuplicates: true,
        });
        expect(expectedProducts).toHaveLength(37);
        expect(expectedProducts.find(({ id }) => id === 'refresco')?.priceCents).toBe(180);
        expect(expectedProducts.find(({ id }) => id === 'zumo')?.priceCents).toBe(180);

        vi.resetModules();
        vi.clearAllMocks();
        mockFindMany.mockResolvedValue(expectedProducts.map(({ id, category, sortOrder }) => ({
            id,
            category,
            sortOrder,
        })));
        mockCreateMany.mockResolvedValue({ count: 0 });
        mockDisconnect.mockResolvedValue(undefined);

        await import('../scripts/seed-caja.js');
        await vi.waitFor(() => expect(mockDisconnect).toHaveBeenCalledTimes(1));

        expect(mockCreateMany).toHaveBeenCalledWith({
            data: [],
            skipDuplicates: true,
        });
    });
});
