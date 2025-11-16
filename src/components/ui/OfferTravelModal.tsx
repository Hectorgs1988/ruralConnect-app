import { useState, type FC } from "react";
import Button from "./button";
import Input from "./input";
import Textarea from "./TextArea";

interface OfferTravelPayload {
    from: string;
    to: string;
    date: string;       
    time: string;      
    plazas: number;
    description?: string;
}

interface OfferTravelModalProps {
    onClose: () => void;
    onSubmit: (travel: OfferTravelPayload) => void;
}

const OfferTravelModal: FC<OfferTravelModalProps> = ({ onClose, onSubmit }) => {
    const [origen, setOrigen] = useState("");
    const [destino, setDestino] = useState("");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [plazas, setPlazas] = useState<string>("");
    const [descripcion, setDescripcion] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // validaciones mínimas
        if (!origen || !destino || !fecha || !hora) {
            return setError("Rellena origen, destino, fecha y hora.");
        }
        const plazasNum = Number(plazas);
        if (!plazas || Number.isNaN(plazasNum) || plazasNum < 1) {
            return setError("Indica un número de plazas válido (≥ 1).");
        }

        try {
            setSending(true);
            onSubmit({
                from: origen,
                to: destino,
                date: fecha,
                time: hora,
                plazas: plazasNum,
                description: descripcion || undefined,
            });
            onClose();
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            className="rc-modal-overlay"
            onClick={onClose}
        >
            <div
                className="rc-modal-panel max-w-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                    onClick={onClose}
                    aria-label="Cerrar modal"
                >
                    ✕
                </button>

                <div className="mb-4">
                    <h2 className="rc-modal-title">Ofrecer nuevo viaje</h2>
                    <p className="rc-modal-subtitle">
                        Publica tu viaje para que otros socios puedan unirse
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/2">
                            <label className="text-sm text-dark block mb-1">Origen</label>
                            <Input
                                placeholder="Ej: Burgos"
                                value={origen}
                                onChange={(e) => setOrigen(e.target.value)}
                            />
                        </div>
                        <div className="md:w-1/2">
                            <label className="text-sm text-dark block mb-1">Destino</label>
                            <Input
                                placeholder="Ej: Susinos"
                                value={destino}
                                onChange={(e) => setDestino(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/2">
                            <label className="text-sm text-dark block mb-1">Fecha</label>
                            <Input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                            />
                        </div>
                        <div className="md:w-1/2">
                            <label className="text-sm text-dark block mb-1">Hora</label>
                            <Input
                                type="time"
                                value={hora}
                                onChange={(e) => setHora(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-dark block mb-1">Plazas disponibles</label>
                        <Input
                            type="number"
                            min={1}
                            placeholder="Ej: 3"
                            value={plazas}
                            onChange={(e) => setPlazas(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-dark block mb-1">Descripción del viaje</label>
                        <Textarea
                            className="bg-surfaceMuted border border-borderSoft rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="Información adicional sobre el viaje..."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-error text-sm">
                            {error}
                        </p>
                    )}

                    <div className="rc-modal-footer">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="w-full md:w-auto rc-btn-secondary"
                            disabled={sending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="w-full md:w-auto rc-btn-primary"
                            disabled={sending}
                        >
                            {sending ? "Publicando…" : "Publicar viaje"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OfferTravelModal;
