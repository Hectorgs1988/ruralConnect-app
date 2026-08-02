import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import {
    checkoutDespensaSchema,
    createProductoDespensaSchema,
    updateProductoDespensaSchema,
} from '../schemas/despensa.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const despensaRouter = Router();

const requireAdmin = requireRole('ADMIN');

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
        const compras = await prisma.compraDespensa.findMany({
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

            return {
                compraId: compra.id,
                paymentStatus: 'SIMULATED' as const,
                totalCentimos,
                items: resumenItems,
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

        const data: any = {};
        if (body.nombre !== undefined) data.nombre = body.nombre;
        if (body.descripcion !== undefined) data.descripcion = body.descripcion;
        if (body.precioCentimos !== undefined) data.precioCentimos = body.precioCentimos;
        if (body.unidadesDisponibles !== undefined) data.unidadesDisponibles = body.unidadesDisponibles;

        const producto = await prisma.productoDespensa.update({
            where: { id: req.params.id },
            data,
        });

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
        await prisma.productoDespensa.delete({ where: { id: req.params.id } });
        res.status(204).end();
    } catch (e) {
        next(e);
    }
});