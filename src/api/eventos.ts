import {apiFetch, getErrorMessage } from "./client";

export type ApiEventoPreguntaTipo = "TEXTO" | "NUMERO" | "OPCION_UNICA" | "BOOLEANO";

export type ApiEventoPregunta = {
    id: string;
    texto: string;
    tipo: ApiEventoPreguntaTipo;
    esObligatoria: boolean;
    opciones: string[];
};

export type ApiEvento = {
    id: string;
    titulo: string;
    fecha: string;
    lugar: string | null;
    aforo: number | null;
    estado: "BORRADOR" | "PUBLICADO" | "CANCELADO";
    descripcion: string | null;
    apuntados?: number;
    isJoined?: boolean;
    misAsistentes?: number;
    preguntas?: ApiEventoPregunta[];
};

export type ApiEventoApuntado = {
    userId: string;
    name: string;
    asistentes: number;
};

export interface ListEventosParams {
    desde?: string;
    hasta?: string;
    estado?: "BORRADOR" | "PUBLICADO" | "CANCELADO";
}

export async function listEventos(
    params: ListEventosParams = {},
    token?: string
): Promise<ApiEvento[]> {
    const searchParams = new URLSearchParams();
    if (params.desde) searchParams.set("desde", params.desde);
    if (params.hasta) searchParams.set("hasta", params.hasta);
    if (params.estado) searchParams.set("estado", params.estado);

    const query = searchParams.toString();

    const headers: Record<string, string> = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await apiFetch(`/api/eventos${query ? `?${query}` : ""}`, {
        headers,
    });

    if (!res.ok) {
        throw new Error(await getErrorMessage(res, `Error ${res.status} al cargar los eventos`));
    }

    return (await res.json()) as ApiEvento[];
}

export interface CreateEventoInput {
    titulo: string;
    fecha: string;
    lugar?: string;
    aforo?: number;
    descripcion?: string;
    estado?: "BORRADOR" | "PUBLICADO" | "CANCELADO";
    preguntas?: {
        texto: string;
        tipo: ApiEventoPreguntaTipo;
        esObligatoria?: boolean;
        opciones?: string[];
    }[];
}

export async function createEvento(
    input: CreateEventoInput,
    token: string
): Promise<ApiEvento> {
    const res = await apiFetch(`/api/eventos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        throw new Error(await getErrorMessage(res, `Error ${res.status} al crear el evento`));
    }

    return (await res.json()) as ApiEvento;
}

export interface UpdateEventoInput {
    titulo?: string;
    fecha?: string;
    lugar?: string;
    aforo?: number;
    descripcion?: string;
    estado?: "BORRADOR" | "PUBLICADO" | "CANCELADO";
}

export async function updateEvento(
    id: string,
    input: UpdateEventoInput,
    token: string
): Promise<ApiEvento> {
    const res = await apiFetch(`/api/eventos/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        throw new Error(await getErrorMessage(res, `Error ${res.status} al actualizar el evento`));
    }

    return (await res.json()) as ApiEvento;
}

export async function deleteEvento(id: string, token: string): Promise<void> {
    const res = await apiFetch(`/api/eventos/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok && res.status !== 204) {
        throw new Error(await getErrorMessage(res, `Error ${res.status} al eliminar el evento`));
    }
}



export interface JoinEventoInput {
    asistentes: number;
    respuestas?: {
        preguntaId: string;
        valorTexto?: string;
        valorNumero?: number;
        valorBooleano?: boolean;
        valorOpcion?: string;
    }[];
}

export async function joinEvento(
    eventId: string,
    input: JoinEventoInput,
    token: string
): Promise<void> {
    const res = await apiFetch(`/api/eventos/${eventId}/inscribirme`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });

    if (res.status === 409) {
        throw new Error(await getErrorMessage(res, "Aforo completo para este evento"));
    }

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al apuntarte al evento`)
        );
    }
}

export async function leaveEvento(eventId: string, token: string): Promise<void> {
    const res = await apiFetch(`/api/eventos/${eventId}/desinscribirme`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok && res.status !== 204) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al desinscribirte del evento`)
        );
    }
}

/**
 * Obtiene los eventos a los que el usuario está inscrito
 */
export async function getMyEventos(token: string): Promise<ApiEvento[]> {
    const res = await apiFetch(`/api/eventos/mis-eventos`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar tus eventos`)
        );
    }

    return (await res.json()) as ApiEvento[];
}

export async function getEventoApuntados(
    eventId: string,
    token: string
): Promise<ApiEventoApuntado[]> {
    const res = await apiFetch(`/api/eventos/${eventId}/apuntados`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar la lista de apuntados`)
        );
    }

    return (await res.json()) as ApiEventoApuntado[];
}

export type ApiEventoRespuesta = {
    preguntaId: string;
    pregunta: string;
    tipo: ApiEventoPreguntaTipo;
    valorTexto: string | null;
    valorNumero: number | null;
    valorBooleano: boolean | null;
    valorOpcion: string | null;
};

export type ApiEventoInscripcionRespuestas = {
    userId: string;
    name: string;
    asistentes: number;
    respuestas: ApiEventoRespuesta[];
};

export type ApiEventoRespuestasAdmin = {
    evento: {
        id: string;
        titulo: string;
        preguntas: ApiEventoPregunta[];
    };
    inscripciones: ApiEventoInscripcionRespuestas[];
};

export async function getEventoRespuestasAdmin(
    eventId: string,
    token: string
): Promise<ApiEventoRespuestasAdmin> {
    const res = await apiFetch(`/api/eventos/${eventId}/respuestas`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar respuestas del evento`)
        );
    }

    return (await res.json()) as ApiEventoRespuestasAdmin;
}
