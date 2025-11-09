// src/types/Travel.ts

export interface Travel {
    id: string;
    name: string;
    car: string;
    from: string;
    to: string;
    date: string;
    time: string;
    phone: string;
    occupancy: string;
    description?: string;
    joined?: boolean;
    isDriver?: boolean;
}

// Tipo que devuelve el BACKEND
export interface Viaje {
    id: string;
    conductorId: string;
    origen: string;
    destino: string;
    fecha: string;          // ISO
    plazas: number;
    notas?: string | null;
    estado: "ABIERTO" | "COMPLETO" | "CANCELADO";

    // Lo que viene del include:
    Pasajeros?: Array<{
        userId: string;
        User: { id: string; name: string };
    }>;

    Conductor?: {
        id: string;
        name: string;
        phone?: string | null;
    };

    createdAt?: string;
    updatedAt?: string;
}
