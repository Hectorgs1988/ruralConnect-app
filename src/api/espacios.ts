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

export interface CreateEspacioInput {
    nombre: string;
    tipo: string;
    aforo?: number;
    descripcion?: string | null;
}

export async function createEspacio(
    input: CreateEspacioInput,
    token: string
): Promise<Espacio> {
    const res = await fetch("/api/espacios", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al crear el espacio`)
        );
    }

    return (await res.json()) as Espacio;
}

export interface UpdateEspacioInput {
    nombre?: string;
    tipo?: string;
    aforo?: number | null;
    descripcion?: string | null;
}

export async function updateEspacio(
    id: string,
    input: UpdateEspacioInput,
    token: string
): Promise<Espacio> {
    const res = await fetch(`/api/espacios/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al actualizar el espacio`)
        );
    }

    return (await res.json()) as Espacio;
}

export async function deleteEspacio(id: string, token: string): Promise<void> {
    const res = await fetch(`/api/espacios/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok && res.status !== 204) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al eliminar el espacio`)
        );
    }
}
