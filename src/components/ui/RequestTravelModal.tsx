// src/components/ui/RequestTravelModal.tsx
import { useState, type FC, type FormEvent } from "react";
import Button from '@/components/ui/button';
import type { SolicitudViajeCreateInput } from "@/types/SolicitudViaje";

interface Props {
    onClose: () => void;
    onSubmit: (data: SolicitudViajeCreateInput) => void;
}

const RequestTravelModal: FC<Props> = ({ onClose, onSubmit }) => {
    const [origen, setOrigen] = useState("");
    const [destino, setDestino] = useState("");
    const [fecha, setFecha] = useState(""); // YYYY-MM-DD
    const [horaDesde, setHoraDesde] = useState("");
    const [horaHasta, setHoraHasta] = useState("");
    const [notas, setNotas] = useState("");

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        onSubmit({
            origen: origen.trim(),
            destino: destino.trim(),
            fecha: new Date(fecha).toISOString(),
            horaDesde,
            horaHasta,
            notas: notas.trim() ? notas.trim() : null,
        });
    };

    return (
        <div className="rc-modal-overlay" onClick={onClose}>
            <div
                className="rc-modal-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="request-travel-modal-title"
                aria-describedby="request-travel-modal-description"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3 right-3 md:top-4 md:right-4 text-muted hover:text-dark text-xl font-semibold"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="mb-4">
                    <h2 id="request-travel-modal-title" className="rc-modal-title">Solicitar viaje</h2>
                    <p
                        id="request-travel-modal-description"
                        className="rc-modal-subtitle"
                    >
                        Indica tu origen, destino y horario preferido
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark">Origen</label>
                        <input
                            className="w-full border border-borderSoft rounded-full px-4 py-2 text-sm bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="Ej: Madrid"
                            value={origen}
                            onChange={(e) => setOrigen(e.target.value)}
                            required
                            minLength={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark">Destino</label>
                        <input
                            className="w-full border border-borderSoft rounded-full px-4 py-2 text-sm bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="Ej: Susinos"
                            value={destino}
                            onChange={(e) => setDestino(e.target.value)}
                            required
                            minLength={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                            <label className="block text-sm font-medium mb-1 text-dark">Día</label>
	                            <div className="relative">
	                                <input
	                                    type="date"
	                                    className="w-full border border-borderSoft rounded-full px-4 py-2 text-sm bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-primary/60"
	                                    value={fecha}
	                                    onChange={(e) => setFecha(e.target.value)}
	                                    required
	                                />
	                                {!fecha && (
	                                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted">
	                                        Selecciona día
	                                    </span>
	                                )}
	                            </div>
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-sm font-medium mb-1 text-dark">Desde</label>
	                            <div className="relative">
	                                <input
	                                    type="time"
	                                    className="w-full border border-borderSoft rounded-full px-4 py-2 text-sm bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-primary/60"
	                                    value={horaDesde}
	                                    onChange={(e) => setHoraDesde(e.target.value)}
	                                    required
	                                />
	                                {!horaDesde && (
	                                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted">
	                                        Selecciona hora
	                                    </span>
	                                )}
	                            </div>
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-sm font-medium mb-1 text-dark">Hasta</label>
	                            <div className="relative">
	                                <input
	                                    type="time"
	                                    className="w-full border border-borderSoft rounded-full px-4 py-2 text-sm bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-primary/60"
	                                    value={horaHasta}
	                                    onChange={(e) => setHoraHasta(e.target.value)}
	                                    required
	                                />
	                                {!horaHasta && (
	                                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted">
	                                        Selecciona hora
	                                    </span>
	                                )}
	                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark">Notas (opcional)</label>
                        <textarea
                            className="w-full border border-borderSoft rounded-lg px-4 py-2 text-sm bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-primary/60"
                            rows={3}
                            placeholder="Ej: Prefiero salir temprano"
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                        />
                    </div>

                    <div className="rc-modal-footer">
                        <Button variant="secondary" type="button" onClick={onClose} className="flex-1 sm:flex-initial rc-btn-secondary">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 sm:flex-initial rc-btn-primary">Crear solicitud</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestTravelModal;
