export type EstadoSolicitudViaje = "ABIERTA" | "ACEPTADA" | "CANCELADA";

export interface SolicitudViaje {
    id: string;
    solicitanteId: string;
    origen: string;
    destino: string;
    fecha: string;
    horaDesde: string;
    horaHasta: string;
    notas?: string | null;
    estado: EstadoSolicitudViaje;
    aceptadaPorId?: string | null;
    viajeId?: string | null;
    createdAt: string;
    updatedAt: string;

    // viene del include del backend
    Solicitante?: { id: string; name: string };
    AceptadaPor?: { id: string; name: string } | null;
    Viaje?: { id: string; estado: string } | null;
}

export interface SolicitudViajeCreateInput {
    origen: string;
    destino: string;
    fecha: string;   
    horaDesde: string;  
    horaHasta: string; 
    notas?: string | null;
}
