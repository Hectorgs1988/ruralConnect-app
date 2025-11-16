import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import Input from "./input";
import Textarea from "./TextArea";
import { useAuth } from "@/context/AuthContext";
import { createEvento } from "@/api/eventos";

interface NuevoEventoModalProps {
    onClose: () => void;
    onCreated?: () => void;
}

const ESTADOS_EVENTO = [
    { value: "BORRADOR", label: "Borrador" },
    { value: "PUBLICADO", label: "Publicado" },
    { value: "CANCELADO", label: "Cancelado" },
];

const NuevoEventoModal: FC<NuevoEventoModalProps> = ({ onClose, onCreated }) => {
    const { token } = useAuth();

    const [titulo, setTitulo] = useState("");
    const [fecha, setFecha] = useState("");
    const [lugar, setLugar] = useState("");
    const [aforo, setAforo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [estado, setEstado] = useState("PUBLICADO");
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

        const body: any = {
            titulo: titulo.trim(),
            fecha: fecha.trim(),
        };

        const descTrim = descripcion.trim();
        const lugarTrim = lugar.trim();

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
            await createEvento(body, token);

            if (onCreated) onCreated();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al crear el evento");
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
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center px-4">
            <div className="bg-[#FAFAF0] rounded-xl p-6 md:p-8 w-full max-w-2xl relative shadow-lg">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="absolute top-4 right-6 text-gray-500 hover:text-black text-xl font-semibold"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-1">Crear nuevo evento</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Introduce los datos del nuevo evento
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

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
                            className="w-full px-3 py-2 rounded-md bg-[#FAFAF0] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            {ESTADOS_EVENTO.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 justify-end pt-2">
                        <Button
                            type="button"
                            onClick={handleCancel}
                            className="w-full md:w-auto bg-white border border-gray-300 text-black hover:bg-gray-50"
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="w-full md:w-auto"
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

export default NuevoEventoModal;

