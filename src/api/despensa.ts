import { apiFetch, getErrorMessage } from './client';
import type {
    CompraDespensa,
    CompraDespensaAdmin,
    CheckoutDespensaItem,
    CheckoutDespensaResponse,
    MovimientoInventarioDespensa,
    ProductoDespensa,
} from '@/types/ProductoDespensa';

export interface SaveProductoDespensaInput {
    nombre: string;
    descripcion?: string | null;
    precioCentimos: number;
    unidadesDisponibles: number;
    detalleMovimiento?: string | null;
}

export interface DespensaHistoryFilters {
    q?: string;
    from?: string;
    to?: string;
    tipo?: string;
}

function buildQuery(filters?: DespensaHistoryFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
    }

    const query = params.toString();
    return query ? `?${query}` : '';
}

export async function listProductosDespensa(token: string): Promise<ProductoDespensa[]> {
    const res = await apiFetch('/api/despensa', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar la despensa`)
        );
    }

    return (await res.json()) as ProductoDespensa[];
}

export async function checkoutDespensa(
    items: CheckoutDespensaItem[],
    token: string
): Promise<CheckoutDespensaResponse> {
    const res = await apiFetch('/api/despensa/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al procesar la compra`)
        );
    }

    return (await res.json()) as CheckoutDespensaResponse;
}

export async function listMisComprasDespensa(token: string): Promise<CompraDespensa[]> {
    const res = await apiFetch('/api/despensa/mis-compras', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar el historial de compras`)
        );
    }

    return (await res.json()) as CompraDespensa[];
}

export async function listComprasDespensaAdmin(token: string): Promise<CompraDespensaAdmin[]> {
    const res = await apiFetch('/api/despensa/compras', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar las compras de la despensa`)
        );
    }

    return (await res.json()) as CompraDespensaAdmin[];
}

export async function listComprasDespensaAdminFiltered(
    token: string,
    filters?: DespensaHistoryFilters
): Promise<CompraDespensaAdmin[]> {
    const res = await apiFetch(`/api/despensa/compras${buildQuery(filters)}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar las compras de la despensa`)
        );
    }

    return (await res.json()) as CompraDespensaAdmin[];
}

export async function listMovimientosDespensaAdmin(
    token: string,
    filters?: DespensaHistoryFilters
): Promise<MovimientoInventarioDespensa[]> {
    const res = await apiFetch(`/api/despensa/movimientos${buildQuery(filters)}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar los movimientos de inventario`)
        );
    }

    return (await res.json()) as MovimientoInventarioDespensa[];
}

export async function createProductoDespensa(
    input: SaveProductoDespensaInput,
    token: string
): Promise<ProductoDespensa> {
    const res = await apiFetch('/api/despensa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al crear el producto`)
        );
    }

    return (await res.json()) as ProductoDespensa;
}

export async function updateProductoDespensa(
    id: string,
    input: Partial<SaveProductoDespensaInput>,
    token: string
): Promise<ProductoDespensa> {
    const res = await apiFetch(`/api/despensa/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al actualizar el producto`)
        );
    }

    return (await res.json()) as ProductoDespensa;
}

export async function deleteProductoDespensa(id: string, token: string): Promise<void> {
    const res = await apiFetch(`/api/despensa/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok && res.status !== 204) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al eliminar el producto`)
        );
    }
}