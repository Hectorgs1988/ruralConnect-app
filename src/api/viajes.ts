import type { Viaje } from "@/types/Travel";

export async function listViajes(params?: { from?: string; to?: string; desde?: string }) {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    if (params?.desde) q.set("desde", params.desde);
    const res = await fetch(`/api/viajes${q.toString() ? `?${q}` : ""}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Viaje[];
}

export async function createViaje(body: {
    conductorId: string;
    from: string;
    to: string;
    fecha: string;   // ISO
    plazas: number;
    notas?: string;
}) {
    const res = await fetch("/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as Viaje;
}

export async function joinViaje(viajeId: string, userId: string) {
    const res = await fetch(`/api/viajes/${viajeId}/unirse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
}

export async function leaveViaje(viajeId: string, userId: string) {
    const res = await fetch(`/api/viajes/${viajeId}/unirse`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
    });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
}
