import { apiFetch, getErrorMessage } from "@/api/client";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";

export async function listCajaProducts(token: string): Promise<CajaProduct[]> {
    const response = await apiFetch("/api/caja/products", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(response, `Error ${response.status} al cargar el catálogo de Caja`)
        );
    }

    return (await response.json()) as CajaProduct[];
}
