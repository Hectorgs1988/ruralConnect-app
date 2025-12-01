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
    tipo: "IDA" | "IDA_VUELTA";
    fromVuelta?: string;
    toVuelta?: string;
    dateVuelta?: string;
    timeVuelta?: string;
}

interface OfferTravelModalProps {
    onClose: () => void;
    onSubmit: (travel: OfferTravelPayload) => void;
    initialTravel?: {
        from: string;
        to: string;
        date: string;
        seats: number;
        notes?: string;
    };
}

const OfferTravelModal: FC<OfferTravelModalProps> = ({ onClose, onSubmit, initialTravel }) => {
    // Helpers
    const isoToDateInput = (iso: string) => {
        const d = new Date(iso);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}`;
    };

    const isoToTimeInput = (iso: string) => {
        const d = new Date(iso);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
            2,
            "0"
        )}`;
    };

    const [origen, setOrigen] = useState(initialTravel?.from ?? "");
    const [destino, setDestino] = useState(initialTravel?.to ?? "");
    const [fecha, setFecha] = useState(initialTravel?.date ? isoToDateInput(initialTravel.date) : "");
    const [hora, setHora] = useState(initialTravel?.date ? isoToTimeInput(initialTravel.date) : "");
    const [origenVuelta, setOrigenVuelta] = useState("");
    const [destinoVuelta, setDestinoVuelta] = useState("");
    const [fechaVuelta, setFechaVuelta] = useState("");
    const [horaVuelta, setHoraVuelta] = useState("");
    const [plazas, setPlazas] = useState(initialTravel?.seats ? String(initialTravel.seats) : "");
    const [descripcion, setDescripcion] = useState(initialTravel?.notes ?? "");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tipoViaje, setTipoViaje] = useState<"IDA" | "IDA_VUELTA">("IDA");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!origen || !destino || !fecha || !hora) {
            return setError("Rellena origen, destino, fecha y hora.");
        }

        if (
            tipoViaje === "IDA_VUELTA" &&
            (!origenVuelta || !destinoVuelta || !fechaVuelta || !horaVuelta)
        ) {
            return setError("Rellena también origen, destino, fecha y hora de la vuelta.");
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
                tipo: tipoViaje,
                fromVuelta: tipoViaje === "IDA_VUELTA" ? origenVuelta : undefined,
                toVuelta: tipoViaje === "IDA_VUELTA" ? destinoVuelta : undefined,
                dateVuelta: tipoViaje === "IDA_VUELTA" ? fechaVuelta : undefined,
                timeVuelta: tipoViaje === "IDA_VUELTA" ? horaVuelta : undefined
            });
            onClose();
        } finally {
            setSending(false);
        }
    };

    // Componente para fecha/hora con placeholder falso
	    const DateTimeField = ({
        type,
        value,
        onChange,
        placeholder
    }: {
        type: "date" | "time";
        value: string;
        placeholder: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	    }) => (
	        <div className="relative w-full mb-4">
	            <input
	                type={type}
	                value={value}
	                onChange={onChange}
	                className="
	                    w-full h-11 px-4 py-2 rounded-full bg-surfaceMuted border text-sm border-borderSoft
	                    focus:outline-none focus:ring-2 focus:ring-primary/60
	                    [appearance:none] [-webkit-appearance:none]
	                "
	            />
            {!value && (
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                    {placeholder}
                </span>
            )}
        </div>
    );

    return (
        <div className="rc-modal-overlay" onClick={onClose}>
            <div
                className="rc-modal-panel max-w-full sm:max-w-lg overflow-x-hidden"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute top-3 right-3 md:top-4 md:right-4 text-muted hover:text-dark text-xl font-semibold"
                    onClick={onClose}
                >
                    ✕
                </button>

                <div className="mb-4 pr-8">
                    <h2 className="rc-modal-title">
                        {initialTravel ? "Aceptar solicitud de viaje" : "Ofrecer nuevo viaje"}
                    </h2>
                    <p className="rc-modal-subtitle">
                        {initialTravel
                            ? "Confirma los detalles del viaje"
                            : "Publica tu viaje para que otros socios puedan unirse"}
                    </p>
                </div>

                <form className="space-y-3 md:space-y-4" onSubmit={handleSubmit}>
                    {/* ORIGEN - DESTINO */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/2">
                            <label className="text-sm text-dark block mb-1">Origen</label>
                            <Input
                                placeholder="Ej: Burgos"
                                value={origen}
                                onChange={(e) => setOrigen(e.target.value)}
                                className="rounded-full"
                            />
                        </div>
                        <div className="md:w-1/2">
                            <label className="text-sm text-dark block mb-1">Destino</label>
                            <Input
                                placeholder="Ej: Susinos"
                                value={destino}
                                onChange={(e) => setDestino(e.target.value)}
                                className="rounded-full"
                            />
                        </div>
                    </div>

                    {/* FECHA - HORA */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/2">
                            <label className="text-sm text-dark block mb-1">Fecha</label>
                            <DateTimeField
                                type="date"
                                placeholder="Selecciona fecha"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                            />
                        </div>

                        <div className="md:w-1/2">
                            <label className="text-sm text-dark block mb-1">Hora</label>
                            <DateTimeField
                                type="time"
                                placeholder="Selecciona hora"
                                value={hora}
                                onChange={(e) => setHora(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* PLAZAS */}
                    <div>
                        <label className="text-sm text-dark block mb-1">Plazas disponibles</label>
                        <Input
                            type="number"
                            min={1}
                            placeholder="Ej: 3"
                            value={plazas}
                            onChange={(e) => setPlazas(e.target.value)}
                            className="rounded-full"
                        />
                    </div>

                    {/* TIPO VIAJE */}
                    {!initialTravel && (
                        <div>
                            <label className="text-sm text-dark block mb-1">Tipo de viaje</label>
                            <div className="flex gap-4 text-sm">
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipoViaje"
                                        checked={tipoViaje === "IDA"}
                                        onChange={() => setTipoViaje("IDA")}
                                    />
                                    <span>Solo ida</span>
                                </label>

                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipoViaje"
                                        checked={tipoViaje === "IDA_VUELTA"}
                                        onChange={() => setTipoViaje("IDA_VUELTA")}
                                    />
                                    <span>Ida y vuelta</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* VUELTA */}
                    {tipoViaje === "IDA_VUELTA" && (
                        <div className="pt-3 border-t border-borderSoft space-y-3 md:space-y-4">
                            <p className="text-sm font-medium text-dark">Datos del viaje de vuelta</p>

                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="md:w-1/2">
                                    <label className="text-sm text-dark block mb-1">
                                        Origen (vuelta)
                                    </label>
                                    <Input
                                        placeholder="Ej: Susinos"
                                        value={origenVuelta}
                                        onChange={(e) => setOrigenVuelta(e.target.value)}
                                        className="rounded-full"
                                    />
                                </div>

                                <div className="md:w-1/2">
                                    <label className="text-sm text-dark block mb-1">
                                        Destino (vuelta)
                                    </label>
                                    <Input
                                        placeholder="Ej: Burgos"
                                        value={destinoVuelta}
                                        onChange={(e) => setDestinoVuelta(e.target.value)}
                                        className="rounded-full"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="md:w-1/2">
                                    <label className="text-sm text-dark block mb-1">Fecha (vuelta)</label>
                                    <DateTimeField
                                        type="date"
                                        placeholder="Selecciona fecha"
                                        value={fechaVuelta}
                                        onChange={(e) => setFechaVuelta(e.target.value)}
                                    />
                                </div>

                                <div className="md:w-1/2">
                                    <label className="text-sm text-dark block mb-1">Hora (vuelta)</label>
                                    <DateTimeField
                                        type="time"
                                        placeholder="Selecciona hora"
                                        value={horaVuelta}
                                        onChange={(e) => setHoraVuelta(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DESCRIPCIÓN */}
                    <div>
                        <label className="text-sm text-dark block mb-1">Descripción del viaje</label>
                        <Textarea
                            placeholder="Información adicional sobre el viaje..."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-error text-sm">{error}</p>}

                    <div className="rc-modal-footer">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-initial rc-btn-secondary"
                            disabled={sending}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            className="flex-1 sm:flex-initial rc-btn-primary"
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
