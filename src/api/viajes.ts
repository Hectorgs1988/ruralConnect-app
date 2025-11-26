import type { Viaje } from "@/types/Travel";
import { apiFetch, getErrorMessage } from "./client";

export interface ListViajesParams {
    from?: string;
    to?: string;
    desde?: string;
}

export async function listViajes(
    params: ListViajesParams = {},
    token?: string
): Promise<Viaje[]> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.desde) searchParams.set("desde", params.desde);

    const query = searchParams.toString();

    const headers: Record<string, string> = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await apiFetch(`/api/viajes${query ? `?${query}` : ""}` , {
        headers,
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar los viajes`)
        );
    }

    return (await res.json()) as Viaje[];
}

export interface CreateViajeInput {
    from: string;
    to: string;
    fecha: string; // ISO
    plazas: number;
    notas?: string;
}

export async function createViaje(
    input: CreateViajeInput,
    token: string
): Promise<Viaje> {
    const res = await apiFetch("/api/viajes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al crear el viaje`)
        );
    }

    return (await res.json()) as Viaje;
}

export async function joinViaje(
    viajeId: string,
    userId: string,
    token: string
): Promise<void> {
    const res = await apiFetch(`/api/viajes/${viajeId}/unirse`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
    });

    if (res.status === 409) {
        throw new Error(
            await getErrorMessage(
                res,
                "No hay plazas disponibles o ya estás unido a este viaje"
            )
        );
    }

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al unirte al viaje`)
        );
    }
}

export async function leaveViaje(
    viajeId: string,
    userId: string,
    token: string
): Promise<void> {
    const res = await apiFetch(`/api/viajes/${viajeId}/unirse`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
    });

    if (!res.ok && res.status !== 204) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al salir del viaje`)
        );
    }
}


export async function cancelViaje(
    viajeId: string,
    token: string
): Promise<{ message: string; pasajerosNotificados: number }> {
    const res = await apiFetch(`/api/viajes/${viajeId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cancelar el viaje`)
        );
    }

    return await res.json();
}
