import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import {
    comprasDespensaQuerySchema,
    checkoutDespensaSchema,
    createProductoDespensaSchema,
    movimientosDespensaQuerySchema,
    updateProductoDespensaSchema,
} from '../schemas/despensa.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const despensaRouter = Router();

const requireAdmin = requireRole('ADMIN');

function parseDateRange(from?: string, to?: string) {
    const createdAt: Record<string, Date> = {};

    if (from) {
        const start = new Date(`${from}T00:00:00.000Z`);
        if (!Number.isNaN(start.getTime())) createdAt.gte = start;
    }

    if (to) {
        const end = new Date(`${to}T23:59:59.999Z`);
        if (!Number.isNaN(end.getTime())) createdAt.lte = end;
    }

    return Object.keys(createdAt).length > 0 ? createdAt : undefined;
}

despensaRouter.get('/', requireAuth, async (_req, res, next) => {
    try {
        const productos = await prisma.productoDespensa.findMany({
            orderBy: { nombre: 'asc' },
        });
        res.json(productos);
    } catch (e) {
        next(e);
    }
});

despensaRouter.get('/mis-compras', requireAuth, async (req, res, next) => {
    try {
        const userId = (req as any).user?.sub as string | undefined;
        if (!userId) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const compras = await prisma.compraDespensa.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    orderBy: { createdAt: 'asc' },
                },
            },
            take: 10,
        });

        res.json(compras);
    } catch (e) {
        next(e);
    }
});

despensaRouter.get('/compras', requireAuth, requireAdmin, async (_req, res, next) => {
    try {
        const query = comprasDespensaQuerySchema.parse(_req.query);
        const createdAt = parseDateRange(query.from, query.to);

        const compras = await prisma.compraDespensa.findMany({
            where: {
                ...(createdAt ? { createdAt } : {}),
                ...(query.q ? {
                    OR: [
                        { User: { name: { contains: query.q } } },
                        { User: { email: { contains: query.q } } },
                        { items: { some: { nombreProducto: { contains: query.q } } } },
                    ],
                } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    orderBy: { createdAt: 'asc' },
                },
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            take: 25,
        });

        res.json(compras);
    } catch (e) {
        next(e);
    }
});

despensaRouter.get('/movimientos', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const query = movimientosDespensaQuerySchema.parse(req.query);
        const createdAt = parseDateRange(query.from, query.to);

        const movimientos = await prisma.movimientoInventarioDespensa.findMany({
            where: {
                ...(createdAt ? { createdAt } : {}),
                ...(query.tipo ? { tipo: query.tipo as any } : {}),
                ...(query.q ? {
                    OR: [
                        { nombreProducto: { contains: query.q } },
                        { detalle: { contains: query.q } },
                        { User: { name: { contains: query.q } } },
                        { User: { email: { contains: query.q } } },
                    ],
                } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            take: 50,
        });

        res.json(movimientos);
    } catch (e) {
        next(e);
    }
});

despensaRouter.post('/checkout', requireAuth, async (req, res, next) => {
    try {
        const body = checkoutDespensaSchema.parse(req.body);
        const userId = (req as any).user?.sub as string | undefined;

        if (!userId) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const productos = await tx.productoDespensa.findMany({
                where: {
                    id: { in: body.items.map((item) => item.productoId) },
                },
            });

            const productosPorId = new Map<string, (typeof productos)[number]>(
                productos.map((producto) => [producto.id, producto])
            );

            const resumenItems = [] as Array<{
                productoId: string;
                nombre: string;
                cantidad: number;
                precioUnitarioCentimos: number;
                subtotalCentimos: number;
                stockAnterior: number;
                stockPosterior: number;
            }>;

            for (const item of body.items) {
                const producto = productosPorId.get(item.productoId);

                if (!producto) {
                    const error = new Error('Hay productos seleccionados que ya no están disponibles');
                    (error as any).status = 404;
                    throw error;
                }

                if (producto.unidadesDisponibles < item.cantidad) {
                    const error = new Error(`Stock insuficiente para ${producto.nombre}`);
                    (error as any).status = 409;
                    throw error;
                }

                const updated = await tx.productoDespensa.updateMany({
                    where: {
                        id: producto.id,
                        unidadesDisponibles: { gte: item.cantidad },
                    },
                    data: {
                        unidadesDisponibles: { decrement: item.cantidad },
                    },
                });

                if (updated.count !== 1) {
                    const error = new Error(`No se pudo reservar stock para ${producto.nombre}`);
                    (error as any).status = 409;
                    throw error;
                }

                resumenItems.push({
                    productoId: producto.id,
                    nombre: producto.nombre,
                    cantidad: item.cantidad,
                    precioUnitarioCentimos: producto.precioCentimos,
                    subtotalCentimos: producto.precioCentimos * item.cantidad,
                    stockAnterior: producto.unidadesDisponibles,
                    stockPosterior: producto.unidadesDisponibles - item.cantidad,
                });
            }

            const totalCentimos = resumenItems.reduce((sum, item) => sum + item.subtotalCentimos, 0);
            const compra = await tx.compraDespensa.create({
                data: {
                    userId,
                    totalCentimos,
                    estadoPago: 'SIMULATED',
                    items: {
                        create: resumenItems.map((item) => ({
                            productoId: item.productoId,
                            nombreProducto: item.nombre,
                            precioUnitarioCentimos: item.precioUnitarioCentimos,
                            cantidad: item.cantidad,
                            subtotalCentimos: item.subtotalCentimos,
                        })),
                    },
                },
            });

            await tx.movimientoInventarioDespensa.createMany({
                data: resumenItems.map((item) => ({
                    productoId: item.productoId,
                    compraId: compra.id,
                    userId,
                    tipo: 'COMPRA',
                    nombreProducto: item.nombre,
                    deltaUnidades: -item.cantidad,
                    stockAnterior: item.stockAnterior,
                    stockPosterior: item.stockPosterior,
                    detalle: `Compra simulada asociada al pedido ${compra.id}`,
                })),
            });

            return {
                compraId: compra.id,
                createdAt: compra.createdAt,
                paymentStatus: 'SIMULATED' as const,
                totalCentimos,
                items: resumenItems.map(({ stockAnterior, stockPosterior, ...item }) => item),
            };
        });

        res.json(resultado);
    } catch (e) {
        next(e);
    }
});

despensaRouter.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const body = createProductoDespensaSchema.parse(req.body);

        const producto = await prisma.productoDespensa.create({
            data: {
                nombre: body.nombre,
                descripcion: body.descripcion ?? null,
                precioCentimos: body.precioCentimos,
                unidadesDisponibles: body.unidadesDisponibles,
            },
        });

        if (producto.unidadesDisponibles > 0) {
            await prisma.movimientoInventarioDespensa.create({
                data: {
                    productoId: producto.id,
                    userId: (req as any).user?.sub,
                    tipo: 'ALTA',
                    nombreProducto: producto.nombre,
                    deltaUnidades: producto.unidadesDisponibles,
                    stockAnterior: 0,
                    stockPosterior: producto.unidadesDisponibles,
                    detalle: body.detalleMovimiento ?? 'Alta inicial del producto en la despensa',
                },
            });
        }

        res.status(201).json(producto);
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return res.status(409).json({ error: 'Ya existe un producto con ese nombre' });
        }
        next(e);
    }
});

despensaRouter.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const body = updateProductoDespensaSchema.parse(req.body);
        const productoActual = await prisma.productoDespensa.findUnique({
            where: { id: req.params.id },
        });

        if (!productoActual) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const data: any = {};
        if (body.nombre !== undefined) data.nombre = body.nombre;
        if (body.descripcion !== undefined) data.descripcion = body.descripcion;
        if (body.precioCentimos !== undefined) data.precioCentimos = body.precioCentimos;
        if (body.unidadesDisponibles !== undefined) data.unidadesDisponibles = body.unidadesDisponibles;

        const producto = await prisma.productoDespensa.update({
            where: { id: req.params.id },
            data,
        });

        if (body.unidadesDisponibles !== undefined && body.unidadesDisponibles !== productoActual.unidadesDisponibles) {
            const delta = body.unidadesDisponibles - productoActual.unidadesDisponibles;

            await prisma.movimientoInventarioDespensa.create({
                data: {
                    productoId: producto.id,
                    userId: (req as any).user?.sub,
                    tipo: delta > 0 ? 'REPOSICION' : 'AJUSTE',
                    nombreProducto: producto.nombre,
                    deltaUnidades: delta,
                    stockAnterior: productoActual.unidadesDisponibles,
                    stockPosterior: body.unidadesDisponibles,
                    detalle: body.detalleMovimiento ?? (delta > 0
                        ? 'Reposición manual de stock desde administración'
                        : 'Ajuste manual de stock desde administración'),
                },
            });
        }

        res.json(producto);
    } catch (e: any) {
        if (e?.code === 'P2002') {
            return res.status(409).json({ error: 'Ya existe un producto con ese nombre' });
        }
        next(e);
    }
});

despensaRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const producto = await prisma.productoDespensa.findUnique({ where: { id: req.params.id } });
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.movimientoInventarioDespensa.create({
                data: {
                    productoId: producto.id,
                    userId: (req as any).user?.sub,
                    tipo: 'ELIMINACION',
                    nombreProducto: producto.nombre,
                    deltaUnidades: -producto.unidadesDisponibles,
                    stockAnterior: producto.unidadesDisponibles,
                    stockPosterior: 0,
                    detalle: 'Producto eliminado desde administración',
                },
            });

            await tx.productoDespensa.delete({ where: { id: req.params.id } });
        });

        res.status(204).end();
    } catch (e) {
        next(e);
    }
});