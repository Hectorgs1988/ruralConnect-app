import { apiFetch, getErrorMessage } from "@/api/client";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";

export type CajaProductCreate = Pick<CajaProduct, "id" | "name" | "category" | "priceCents">;
export type CajaProductUpdate = Pick<CajaProduct, "name" | "category" | "priceCents">;

async function assertSuccessfulResponse(response: Response, fallback: string): Promise<void> {
    if (!response.ok) {
        throw new Error(await getErrorMessage(response, `${fallback} (HTTP ${response.status})`));
    }
}

function authenticatedOptions(token: string, method?: string, body?: unknown): RequestInit {
    return {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    };
}

export async function listCajaProducts(token?: string): Promise<CajaProduct[]> {
    const options = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;
    const response = await apiFetch("/api/caja/products", options);

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(response, `Error ${response.status} al cargar el catálogo de Caja`)
        );
    }

    return (await response.json()) as CajaProduct[];
}

export async function listAdminCajaProducts(token: string): Promise<CajaProduct[]> {
    const response = await apiFetch("/api/caja/admin/products", authenticatedOptions(token));
    await assertSuccessfulResponse(response, "Error al cargar la administración de Caja");
    return (await response.json()) as CajaProduct[];
}

export async function createCajaProduct(
    token: string,
    product: CajaProductCreate,
): Promise<CajaProduct> {
    const response = await apiFetch(
        "/api/caja/products",
        authenticatedOptions(token, "POST", product),
    );
    await assertSuccessfulResponse(response, "Error al crear el producto de Caja");
    return (await response.json()) as CajaProduct;
}

export async function updateCajaProduct(
    token: string,
    id: CajaProduct["id"],
    product: CajaProductUpdate,
): Promise<CajaProduct> {
    const response = await apiFetch(
        `/api/caja/products/${encodeURIComponent(id)}`,
        authenticatedOptions(token, "PATCH", product),
    );
    await assertSuccessfulResponse(response, "Error al editar el producto de Caja");
    return (await response.json()) as CajaProduct;
}

export async function deactivateCajaProduct(
    token: string,
    id: CajaProduct["id"],
): Promise<CajaProduct> {
    const response = await apiFetch(
        `/api/caja/products/${encodeURIComponent(id)}/deactivate`,
        authenticatedOptions(token, "PATCH"),
    );
    await assertSuccessfulResponse(response, "Error al desactivar el producto de Caja");
    return (await response.json()) as CajaProduct;
}

export async function reactivateCajaProduct(
    token: string,
    id: CajaProduct["id"],
): Promise<CajaProduct> {
    const response = await apiFetch(
        `/api/caja/products/${encodeURIComponent(id)}/reactivate`,
        authenticatedOptions(token, "PATCH"),
    );
    await assertSuccessfulResponse(response, "Error al reactivar el producto de Caja");
    return (await response.json()) as CajaProduct;
}

export async function deleteCajaProduct(
    token: string,
    id: CajaProduct["id"],
): Promise<void> {
    const response = await apiFetch(
        `/api/caja/products/${encodeURIComponent(id)}`,
        authenticatedOptions(token, "DELETE"),
    );
    await assertSuccessfulResponse(response, "Error al eliminar definitivamente el producto de Caja");
}
