import { getErrorMessage } from "./client";

export type ApiReservaEstado = "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

export type ApiReserva = {
    id: string;
    usuarioId: string;
    espacioId: string;
    inicio: string; // ISO
    fin: string; // ISO
    estado?: ApiReservaEstado;
};

export interface ListReservasParams {
    espacioId?: string;
    desde?: string;
    hasta?: string;
    estado?: ApiReservaEstado;
}

export async function listReservas(
    params: ListReservasParams = {},
    token?: string
): Promise<ApiReserva[]> {
    const searchParams = new URLSearchParams();

    if (params.espacioId) searchParams.set("espacioId", params.espacioId);
    if (params.desde) searchParams.set("desde", params.desde);
    if (params.hasta) searchParams.set("hasta", params.hasta);
    if (params.estado) searchParams.set("estado", params.estado);

    const query = searchParams.toString();

    const headers: Record<string, string> = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`/api/reservas${query ? `?${query}` : ""}`, {
        headers,
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar las reservas`)
        );
    }

    return (await res.json()) as ApiReserva[];
}

export interface CreateReservaInput {
    espacioId: string;
    inicio: string;
    fin: string;
}

export async function createReserva(
    input: CreateReservaInput,
    token: string
): Promise<ApiReserva> {
    const res = await fetch("/api/reservas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (res.status === 409) {
        throw new Error(await getErrorMessage(res, "Horario no disponible"));
    }

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al crear la reserva`)
        );
    }

    return (await res.json()) as ApiReserva;
}

export interface UpdateReservaInput {
    estado: ApiReservaEstado;
}

export async function updateReserva(
    id: string,
    input: UpdateReservaInput,
    token: string
): Promise<ApiReserva> {
    const res = await fetch(`/api/reservas/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al actualizar la reserva`)
        );
    }

    return (await res.json()) as ApiReserva;
}

