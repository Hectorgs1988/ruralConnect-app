import { getErrorMessage } from "./client";

export type UltimoEvento = {
    id: string;
    titulo: string;
    fecha: string;
    estado: "BORRADOR" | "PUBLICADO" | "CANCELADO";
};

export type UltimoSocio = {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "SOCIO";
};

export type ResumenStats = {
    sociosTotales: number;
    sociosActivos: number;
    eventosPublicados: number;
    viajesCompartidos: number;
    reservasTotales: number;
    espaciosDisponibles: number;
    ultimosEventos: UltimoEvento[];
    ultimosSocios: UltimoSocio[];
};

export async function getResumenDashboard(token: string): Promise<ResumenStats> {
    const res = await fetch("/api/dashboard/resumen", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(
            await getErrorMessage(res, `Error ${res.status} al cargar el resumen`)
        );
    }

    return (await res.json()) as ResumenStats;
}

