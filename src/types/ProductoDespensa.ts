export interface ProductoDespensa {
    id: string;
    nombre: string;
    descripcion?: string | null;
    precioCentimos: number;
    unidadesDisponibles: number;
    createdAt: string;
    updatedAt: string;
}

export interface CheckoutDespensaItem {
    productoId: string;
    cantidad: number;
}

export interface CheckoutDespensaResponse {
    compraId: string;
    createdAt: string;
    paymentStatus: 'SIMULATED';
    totalCentimos: number;
    items: Array<{
        productoId: string;
        nombre: string;
        cantidad: number;
        precioUnitarioCentimos: number;
        subtotalCentimos: number;
    }>;
}

export interface CompraDespensaItem {
    id: string;
    compraId: string;
    productoId?: string | null;
    nombreProducto: string;
    precioUnitarioCentimos: number;
    cantidad: number;
    subtotalCentimos: number;
    createdAt: string;
}

export interface CompraDespensa {
    id: string;
    userId: string;
    totalCentimos: number;
    estadoPago: string;
    createdAt: string;
    updatedAt: string;
    items: CompraDespensaItem[];
}

export interface CompraDespensaAdmin extends CompraDespensa {
    User: {
        id: string;
        name: string;
        email: string;
    };
}

export interface MovimientoInventarioDespensa {
    id: string;
    productoId?: string | null;
    compraId?: string | null;
    userId?: string | null;
    tipo: 'ALTA' | 'COMPRA' | 'REPOSICION' | 'AJUSTE' | 'ELIMINACION';
    nombreProducto: string;
    deltaUnidades: number;
    stockAnterior: number;
    stockPosterior: number;
    detalle?: string | null;
    createdAt: string;
    User?: {
        id: string;
        name: string;
        email: string;
    } | null;
}