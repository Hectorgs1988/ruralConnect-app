import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import Input from "./input";
import Textarea from "./TextArea";
import { useAuth } from "@/context/AuthContext";
import { updateEvento } from "@/api/eventos";

interface EditarEventoModalProps {
    evento: {
        id: string;
        titulo: string;
        fecha: string; // ISO string
        lugar: string;
        aforo: number | null;
        descripcion: string;
        estado: "BORRADOR" | "PUBLICADO" | "CANCELADO";
    };
    onClose: () => void;
    onUpdated?: () => void;
}

const ESTADOS_EVENTO = [
    { value: "BORRADOR", label: "Borrador" },
    { value: "PUBLICADO", label: "Publicado" },
    { value: "CANCELADO", label: "Cancelado" },
];

const EditarEventoModal: FC<EditarEventoModalProps> = ({ evento, onClose, onUpdated }) => {
    const { token } = useAuth();

    const [titulo, setTitulo] = useState(evento.titulo);
    const [fecha, setFecha] = useState(() => {
        const raw = evento.fecha || "";
        return raw.length >= 10 ? raw.slice(0, 10) : raw;
    });
    const [lugar, setLugar] = useState(evento.lugar ?? "");
    const [aforo, setAforo] = useState(
        evento.aforo !== null && evento.aforo !== undefined ? String(evento.aforo) : ""
    );
    const [descripcion, setDescripcion] = useState(evento.descripcion ?? "");
    const [estado, setEstado] = useState(evento.estado);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Debes iniciar sesion como admin.");
            return;
        }

        if (!titulo.trim() || !fecha.trim() || !estado) {
            setError("Rellena los campos obligatorios: titulo, fecha y estado.");
            return;
        }

        const aforoTrim = aforo.trim();
        let aforoNumber: number | undefined;
        if (aforoTrim) {
            const parsed = Number(aforoTrim);
            if (Number.isNaN(parsed) || parsed <= 0) {
                setError("El aforo debe ser un numero positivo.");
                return;
            }
            aforoNumber = parsed;
        }

        const body: any = {};

        const tituloTrim = titulo.trim();
        const fechaTrim = fecha.trim();
        const descTrim = descripcion.trim();
        const lugarTrim = lugar.trim();

        if (tituloTrim) body.titulo = tituloTrim;
        if (fechaTrim) body.fecha = fechaTrim;
        if (descTrim) body.descripcion = descTrim;
        if (lugarTrim) body.lugar = lugarTrim;
        if (aforoNumber !== undefined) {
            body.aforo = aforoNumber;
        }
        if (estado) {
            body.estado = estado;
        }

        try {
            setSubmitting(true);
            await updateEvento(evento.id, body, token);

            if (onUpdated) onUpdated();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al actualizar el evento");
        } finally {
            setSubmitting(false);
        }
    };


    const handleCancel = () => {
        if (!submitting) {
            onClose();
        }
    };

    return (
        <div
            className="rc-modal-overlay"
            onClick={handleCancel}
        >
            <div
                className="rc-modal-panel max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={handleCancel}
                    className="absolute top-3 right-3 md:top-4 md:right-4 text-muted hover:text-dark text-xl font-semibold z-10"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="mb-4 md:mb-6 pr-8">
                    <h2 className="rc-modal-title">Editar evento</h2>
                    <p className="rc-modal-subtitle">Actualiza la informacion del evento</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                    {error && (
                        <p className="text-sm text-error mb-2">
                            {error}
                        </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Titulo *</label>
                            <Input
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Titulo del evento"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Fecha *</label>
                            <Input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                placeholder="dd/mm/aaaa"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Lugar</label>
                            <Input
                                value={lugar}
                                onChange={(e) => setLugar(e.target.value)}
                                placeholder="Lugar del evento"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Aforo</label>
                            <Input
                                type="number"
                                min={1}
                                value={aforo}
                                onChange={(e) => setAforo(e.target.value)}
                                placeholder="Numero de plazas"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Descripcion del evento</label>
                        <Textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Descripcion del evento"
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Estado *</label>
                        <select
                            className="w-full px-3 py-2 rounded-md bg-surfaceMuted border border-borderSoft focus:outline-none focus:ring-2 focus:ring-primary/60 text-sm"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value as EditarEventoModalProps["evento"]["estado"])}
                        >
                            {ESTADOS_EVENTO.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rc-modal-footer">
                        <Button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 sm:flex-initial rc-btn-secondary"
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 sm:flex-initial rc-btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? "Guardando..." : "Guardar evento"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditarEventoModal;

