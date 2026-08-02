import { prisma } from '../db/prisma.js';

const productos = [
    {
        nombre: 'Pan',
        descripcion: 'Barra de pan del día',
        precioCentimos: 120,
        unidadesDisponibles: 30,
    },
    {
        nombre: 'Arroz',
        descripcion: 'Paquete de arroz de 1 kg',
        precioCentimos: 210,
        unidadesDisponibles: 24,
    },
    {
        nombre: 'Pasta',
        descripcion: 'Macarrones de 500 g',
        precioCentimos: 145,
        unidadesDisponibles: 28,
    },
    {
        nombre: 'Leche',
        descripcion: 'Leche entera de 1 litro',
        precioCentimos: 115,
        unidadesDisponibles: 18,
    },
    {
        nombre: 'Aceite de oliva',
        descripcion: 'Botella de 1 litro',
        precioCentimos: 675,
        unidadesDisponibles: 12,
    },
    {
        nombre: 'Galletas',
        descripcion: 'Paquete surtido familiar',
        precioCentimos: 250,
        unidadesDisponibles: 20,
    },
];

async function main() {
    for (const producto of productos) {
        await prisma.productoDespensa.upsert({
            where: { nombre: producto.nombre },
            update: {
                descripcion: producto.descripcion,
                precioCentimos: producto.precioCentimos,
                unidadesDisponibles: producto.unidadesDisponibles,
            },
            create: producto,
        });
    }

    console.log(`Productos de despensa cargados: ${productos.length}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});