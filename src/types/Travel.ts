// Tipo que usa TU CARD (vista)
export interface Travel {
    id: string;            // 👈 añadido para poder unirse/salir
    name: string;
    car: string;
    from: string;
    to: string;
    date: string;          // "YYYY-MM-DD"
    time: string;          // "HH:mm"
    phone: string;
    occupancy: string;     // "2/4 plazas"
    description?: string;
    joined?: boolean;      // 👈 si el user ya está dentro
    isDriver?: boolean;    // 👈 si el user es el conductor
}

// Tipo que devuelve el BACKEND (ajústalo si tu API difiere)
export type Viaje = {
    id: string;
    conductorId: string;
    from: string;
    to: string;
    fecha: string;     // ISO
    plazas: number;
    notas?: string | null;
    // si tu GET /api/viajes incluye relaciones:
    Pasajeros?: { userId: string }[];
};
