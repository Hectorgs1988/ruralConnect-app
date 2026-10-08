import { prisma } from '../db/prisma.js';
import type { Prisma } from '@prisma/client';

const productos: Prisma.CajaProductCreateManyInput[] = [
    { id: 'cerveza', name: 'Cerveza', category: 'BEBIDA', priceCents: 150 },
    { id: 'refresco', name: 'Refresco', category: 'BEBIDA', priceCents: 180 },
    { id: 'zumo', name: 'Zumo', category: 'BEBIDA', priceCents: 180 },
    { id: 'agua', name: 'Agua', category: 'BEBIDA', priceCents: 100 },
    { id: 'batido', name: 'Batido', category: 'BEBIDA', priceCents: 180 },
    { id: 'mosto-pequeño', name: 'Mosto pequeño', category: 'BEBIDA', priceCents: 90 },
    { id: 'mosto-grande', name: 'Mosto grande', category: 'BEBIDA', priceCents: 150 },
    { id: 'vino', name: 'Vino', category: 'BEBIDA', priceCents: 150 },
    { id: 'vermut', name: 'Vermut', category: 'BEBIDA', priceCents: 210 },
    { id: 'marianito', name: 'Marianito', category: 'BEBIDA', priceCents: 150 },
    { id: 'cafe', name: 'Café', category: 'BEBIDA', priceCents: 150 },
    { id: 'cafe-bailys', name: 'Café Baileys', category: 'BEBIDA', priceCents: 180 },
    { id: 'vaso-chupito', name: 'Vaso chupito', category: 'BEBIDA', priceCents: 150 },
    { id: 'vaso-chupito-especial', name: 'Vaso chupito especial', category: 'BEBIDA', priceCents: 180 },
    { id: 'chupito-hielo', name: 'Chupito hielo', category: 'BEBIDA', priceCents: 210 },
    { id: 'chupito-hielo-especial', name: 'Chupito hielo especial', category: 'BEBIDA', priceCents: 270 },
    { id: 'calimocho-vaso', name: 'Calimocho vaso', category: 'BEBIDA', priceCents: 300 },
    { id: 'calimocho-vaso-vino-cune', name: 'Calimocho vaso vino cune', category: 'BEBIDA', priceCents: 330 },
    { id: 'calimocho-cachi', name: 'Calimocho cachi', category: 'BEBIDA', priceCents: 510 },
    { id: 'calimocho-cachi-especial-vino-cune', name: 'Calimocho cachi vino cune', category: 'BEBIDA', priceCents: 600 },
    { id: 'cubata', name: 'Cubata', category: 'BEBIDA', priceCents: 450 },
    { id: 'mojito', name: 'Mojito', category: 'BEBIDA', priceCents: 300 },
    { id: 'mojito-grande', name: 'Mojito grande', category: 'BEBIDA', priceCents: 540 },
    { id: 'fideua', name: 'Fideuá', category: 'COMIDA', priceCents: 450 },
    { id: 'montadito-jamon', name: 'Montadito jamón', category: 'COMIDA', priceCents: 300 },
    { id: 'montadito-chorizo', name: 'Montadito chorizo', category: 'COMIDA', priceCents: 150 },
    { id: 'montadito-lomo-bacon-queso', name: 'Montadito lomo bacon queso', category: 'COMIDA', priceCents: 300 },
    { id: 'pincho-morro', name: 'Pincho morro', category: 'COMIDA', priceCents: 150 },
    { id: 'gambas-1/2', name: 'Gambas 1/2', category: 'COMIDA', priceCents: 600 },
    { id: 'gambas', name: 'Gambas', category: 'COMIDA', priceCents: 1050 },
    { id: 'gildas', name: 'Gildas', category: 'COMIDA', priceCents: 150 },
    { id: 'aceitunas', name: 'Aceitunas', category: 'COMIDA', priceCents: 150 },
    { id: 'banderillas', name: 'Banderillas', category: 'COMIDA', priceCents: 50 },
    { id: 'bolsa-patatas', name: 'Bolsa patatas', category: 'COMIDA', priceCents: 150 },
    { id: 'bolsas', name: 'Bolsas', category: 'COMIDA', priceCents: 70 },
    { id: '1-gominola', name: '1 Gominola', category: 'COMIDA', priceCents: 10 },
    { id: '2-gominola', name: '2 Gominolas', category: 'COMIDA', priceCents: 15 },
];

async function main() {
    const result = await prisma.$transaction(async (transaction) => {
        const currentProducts = await transaction.cajaProduct.findMany({
            select: { id: true, category: true, sortOrder: true },
        });
        const existingIds = new Set(currentProducts.map((product) => product.id));
        const nextPosition = {
            BEBIDA: currentProducts
                .filter((product) => product.category === 'BEBIDA')
                .reduce((next, product) => Math.max(next, product.sortOrder + 1), 0),
            COMIDA: currentProducts
                .filter((product) => product.category === 'COMIDA')
                .reduce((next, product) => Math.max(next, product.sortOrder + 1), 0),
        };
        const missingProducts = productos
            .filter((product) => !existingIds.has(product.id))
            .map((product) => ({
                ...product,
                sortOrder: nextPosition[product.category]++,
            }));

        return transaction.cajaProduct.createMany({
            data: missingProducts,
            skipDuplicates: true,
        });
    });

    console.log(`Productos de Caja añadidos: ${result.count}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
