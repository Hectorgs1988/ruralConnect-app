import { getErrorMessage } from "./client";
import type { SolicitudViaje, SolicitudViajeCreateInput } from "../types/SolicitudViaje";
import type { Viaje } from "../types/Travel";
import type { CreateViajeInput } from "./viajes";

export async function listSolicitudesViaje(token: string): Promise<SolicitudViaje[]> {
    const res = await fetch("/api/solicitudes-viaje", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar las solicitudes`)
        );
    }

    return (await res.json()) as SolicitudViaje[];
}

export async function createSolicitudViaje(
    data: SolicitudViajeCreateInput,
    token: string
): Promise<SolicitudViaje> {
    const res = await fetch("/api/solicitudes-viaje", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al crear la solicitud`)
        );
    }

    return (await res.json()) as SolicitudViaje;
}

// Aceptar solicitud y ofrecer viaje asociado
export async function ofrecerDesdeSolicitud(
    solicitudId: string,
    viajeData: CreateViajeInput,
    token: string
): Promise<{ viaje: Viaje; solicitudActualizada: SolicitudViaje }> {
    const res = await fetch(`/api/solicitudes-viaje/${solicitudId}/ofrecer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(viajeData),
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al aceptar la solicitud`)
        );
    }

    return (await res.json()) as { viaje: Viaje; solicitudActualizada: SolicitudViaje };
}

export async function cancelarSolicitudViaje(
    solicitudId: string,
    token: string
): Promise<void> {
    const res = await fetch(`/api/solicitudes-viaje/${solicitudId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok && res.status !== 204) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cancelar la solicitud`)
        );
    }
}
