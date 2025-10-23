// Tipo de la CARD (front/UI)
export interface Travel {
    id: string;

    // datos para mostrar
    name: string;           // lo sacas de Conductor.name o "Tú u otro socio"
    car: string;            // de momento texto fijo en UI
    from: string;
    to: string;
    date: string;           // "YYYY-MM-DD" (derivado de fecha ISO)
    time: string;           // "HH:mm"       (derivado de fecha ISO)
    phone: string;          // aún no de backend
    occupancy: string;      // "1/3 plazas" (calculado con Pasajeros.length / plazas)
    description?: string;   // mapeado desde notas

    // flags calculados en el front
    joined?: boolean;       // si el usuario ya es pasajero
    isDriver?: boolean;     // si el usuario es el conductor
}

// Tipo que devuelve el BACKEND (ajústalo si tu API difiere)
export interface Viaje {
    id: string;
    conductorId: string;
    from: string;
    to: string;
    fecha: string;          // ISO (DateTime de Prisma serializado)
    plazas: number;
    notas?: string | null;
    estado: 'ABIERTO' | 'COMPLETO' | 'CANCELADO';

    // relaciones si las incluyes en el GET
    Pasajeros?: Array<{ userId: string }>;
    Conductor?: { id: string; name: string };

    // meta, por si lo necesitas
    createdAt?: string;
    updatedAt?: string;
}
