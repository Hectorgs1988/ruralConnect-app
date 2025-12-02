// src/components/ui/RequestTravelModal.tsx
import { useState, type FC, type FormEvent } from "react";
import Button from "@/components/ui/button";
import DatePickerField from "./DatePickerField";
import TimePickerField from "./TimePickerField";
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
                    <h2 id="request-travel-modal-title" className="rc-modal-title">
                        Solicitar viaje
                    </h2>
                    <p id="request-travel-modal-description" className="rc-modal-subtitle">
                        Indica tu origen, destino y horario preferido
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                    {/* ORIGEN */}
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

                    {/* DESTINO */}
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

                    {/* FECHA / HORARIOS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* DÍA */}
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark">Día</label>
	                            <DatePickerField
	                                value={fecha}
	                                onChange={setFecha}
	                                placeholder="Selecciona día"
	                            />
                        </div>

                        {/* DESDE */}
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark">Desde</label>
	                            <TimePickerField
	                                value={horaDesde}
	                                onChange={setHoraDesde}
	                                placeholder="Selecciona hora"
	                            />
                        </div>

                        {/* HASTA */}
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark">Hasta</label>
	                            <TimePickerField
	                                value={horaHasta}
	                                onChange={setHoraHasta}
	                                placeholder="Selecciona hora"
	                            />
                        </div>
                    </div>

                    {/* NOTAS */}
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

                    {/* FOOTER */}
                    <div className="rc-modal-footer">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-initial rc-btn-secondary"
                        >
                            Cancelar
                        </Button>

                        <Button type="submit" className="flex-1 sm:flex-initial rc-btn-primary">
                            Crear solicitud
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestTravelModal;
