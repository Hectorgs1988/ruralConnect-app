import type { Espacio } from "@/types/Espacio";
import { getErrorMessage } from "./client";

export async function listEspacios(): Promise<Espacio[]> {
    const res = await fetch("/api/espacios");

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar los espacios`)
        );
    }

    return (await res.json()) as Espacio[];
}

