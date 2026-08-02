import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import Input from "./input";
import Textarea from "./TextArea";
import DatePickerField from "./DatePickerField";
import TimePickerField from "./TimePickerField";
import { useAuth } from "@/context/AuthContext";
import { createEvento, type ApiEventoPreguntaTipo } from "@/api/eventos";

interface NuevoEventoModalProps {
    onClose: () => void;
    onCreated?: () => void;
}

const ESTADOS_EVENTO = [
    { value: "BORRADOR", label: "Borrador" },
    { value: "PUBLICADO", label: "Publicado" },
    { value: "CANCELADO", label: "Cancelado" },
];

const TIPOS_PREGUNTA: Array<{ value: ApiEventoPreguntaTipo; label: string }> = [
    { value: "TEXTO", label: "Texto" },
    { value: "NUMERO", label: "Numero" },
    { value: "OPCION_UNICA", label: "Seleccion unica" },
    { value: "BOOLEANO", label: "Si/No" },
];

type PreguntaDraft = {
    id: string;
    texto: string;
    tipo: ApiEventoPreguntaTipo;
    esObligatoria: boolean;
    opciones: string[];
};

const createPreguntaDraft = (): PreguntaDraft => ({
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    texto: "",
    tipo: "TEXTO",
    esObligatoria: false,
    opciones: ["", ""],
});

const NuevoEventoModal: FC<NuevoEventoModalProps> = ({ onClose, onCreated }) => {
    const { token } = useAuth();

    const [titulo, setTitulo] = useState("");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [lugar, setLugar] = useState("");
    const [aforo, setAforo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [estado, setEstado] = useState("PUBLICADO");
    const [preguntas, setPreguntas] = useState<PreguntaDraft[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Debes iniciar sesion como admin.");
            return;
        }

        const tituloTrim = titulo.trim();
        const fechaTrim = fecha.trim();
        const horaTrim = hora.trim();

        if (!tituloTrim || !fechaTrim || !horaTrim || !estado) {
            setError("Rellena los campos obligatorios: titulo, fecha, hora y estado.");
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

        // Construimos la fecha completa combinando fecha (YYYY-MM-DD) y hora (HH:MM)
        // y la convertimos a ISO UTC para evitar desfases de huso horario en el frontend.
        const fechaLocal = new Date(`${fechaTrim}T${horaTrim}`);
        if (Number.isNaN(fechaLocal.getTime())) {
            setError("La fecha u hora no es valida.");
            return;
        }
        const fechaIso = fechaLocal.toISOString();

        const body: any = {
            titulo: tituloTrim,
            fecha: fechaIso,
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

        if (preguntas.length > 0) {
            const preguntasPayload: Array<{
                texto: string;
                tipo: ApiEventoPreguntaTipo;
                esObligatoria: boolean;
                opciones?: string[];
            }> = [];

            for (const pregunta of preguntas) {
                const textoPregunta = pregunta.texto.trim();
                if (!textoPregunta) {
                    setError("Todas las preguntas deben tener enunciado.");
                    return;
                }

                if (pregunta.tipo === "OPCION_UNICA") {
                    const opciones = pregunta.opciones
                        .map((opt) => opt.trim())
                        .filter(Boolean);

                    if (opciones.length < 2) {
                        setError(`La pregunta \"${textoPregunta}\" debe tener al menos 2 opciones.`);
                        return;
                    }

                    preguntasPayload.push({
                        texto: textoPregunta,
                        tipo: pregunta.tipo,
                        esObligatoria: pregunta.esObligatoria,
                        opciones,
                    });
                    continue;
                }

                preguntasPayload.push({
                    texto: textoPregunta,
                    tipo: pregunta.tipo,
                    esObligatoria: pregunta.esObligatoria,
                });
            }

            body.preguntas = preguntasPayload;
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

    const addPregunta = () => {
        setPreguntas((prev) => [...prev, createPreguntaDraft()]);
    };

    const removePregunta = (id: string) => {
        setPreguntas((prev) => prev.filter((p) => p.id !== id));
    };

    const updatePregunta = (id: string, patch: Partial<PreguntaDraft>) => {
        setPreguntas((prev) =>
            prev.map((p) => {
                if (p.id !== id) return p;
                const next = { ...p, ...patch };
                if (patch.tipo && patch.tipo !== "OPCION_UNICA") {
                    next.opciones = ["", ""];
                }
                return next;
            })
        );
    };

    const updateOpcion = (preguntaId: string, index: number, value: string) => {
        setPreguntas((prev) =>
            prev.map((p) => {
                if (p.id !== preguntaId) return p;
                const opciones = [...p.opciones];
                opciones[index] = value;
                return { ...p, opciones };
            })
        );
    };

    const addOpcion = (preguntaId: string) => {
        setPreguntas((prev) =>
            prev.map((p) => (p.id === preguntaId ? { ...p, opciones: [...p.opciones, ""] } : p))
        );
    };

    const removeOpcion = (preguntaId: string, index: number) => {
        setPreguntas((prev) =>
            prev.map((p) => {
                if (p.id !== preguntaId) return p;
                const opciones = p.opciones.filter((_, i) => i !== index);
                return { ...p, opciones: opciones.length === 0 ? [""] : opciones };
            })
        );
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
                    className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="mb-6">
                    <h2 className="rc-modal-title">Crear nuevo evento</h2>
                    <p className="rc-modal-subtitle">
                        Introduce los datos del nuevo evento
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="text-sm text-error mb-2">
                            {error}
                        </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Titulo *</label>
                            <Input
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Titulo del evento"
                                className="rounded-md"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Fecha *</label>
                            <DatePickerField
                                value={fecha}
                                onChange={setFecha}
                                placeholder="Selecciona fecha"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Hora *</label>
                            <TimePickerField
                                value={hora}
                                onChange={setHora}
                                placeholder="Selecciona hora"
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
                                className="rounded-md"
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
                                className="rounded-md"
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
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            {ESTADOS_EVENTO.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <section className="space-y-3 rounded-lg border border-borderSoft bg-surfaceMuted/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-dark">Preguntas de inscripcion</h3>
                                <p className="text-xs text-muted">
                                    Opcional: cada evento puede tener sus propias preguntas.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={addPregunta}
                                className="rc-btn-secondary px-3 py-1 text-xs"
                                disabled={submitting}
                            >
                                + Añadir pregunta
                            </Button>
                        </div>

                        {preguntas.length === 0 && (
                            <p className="text-xs text-muted">Este evento no tiene preguntas adicionales.</p>
                        )}

                        {preguntas.map((pregunta, index) => (
                            <div
                                key={pregunta.id}
                                className="space-y-3 rounded-lg border border-borderSoft bg-white p-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-semibold text-muted">Pregunta {index + 1}</p>
                                    <button
                                        type="button"
                                        onClick={() => removePregunta(pregunta.id)}
                                        className="text-xs text-error hover:underline"
                                        disabled={submitting}
                                    >
                                        Eliminar
                                    </button>
                                </div>

                                <Input
                                    value={pregunta.texto}
                                    onChange={(e) => updatePregunta(pregunta.id, { texto: e.target.value })}
                                    placeholder="Escribe la pregunta"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <select
                                        className="w-full px-3 py-2 rounded-md bg-surfaceMuted border border-borderSoft focus:outline-none focus:ring-2 focus:ring-primary/60 text-sm"
                                        value={pregunta.tipo}
                                        onChange={(e) => updatePregunta(pregunta.id, { tipo: e.target.value as ApiEventoPreguntaTipo })}
                                    >
                                        {TIPOS_PREGUNTA.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>

                                    <label className="inline-flex items-center gap-2 text-sm text-dark">
                                        <input
                                            type="checkbox"
                                            checked={pregunta.esObligatoria}
                                            onChange={(e) => updatePregunta(pregunta.id, { esObligatoria: e.target.checked })}
                                        />
                                        Respuesta obligatoria
                                    </label>
                                </div>

                                {pregunta.tipo === "OPCION_UNICA" && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted">Opciones (minimo 2)</p>
                                        {pregunta.opciones.map((opcion, opcionIndex) => (
                                            <div key={`${pregunta.id}-opt-${opcionIndex}`} className="flex items-center gap-2">
                                                <Input
                                                    value={opcion}
                                                    onChange={(e) => updateOpcion(pregunta.id, opcionIndex, e.target.value)}
                                                    placeholder={`Opcion ${opcionIndex + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeOpcion(pregunta.id, opcionIndex)}
                                                    className="text-xs text-error hover:underline"
                                                    disabled={submitting}
                                                >
                                                    Quitar
                                                </button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            onClick={() => addOpcion(pregunta.id)}
                                            className="rc-btn-secondary px-3 py-1 text-xs"
                                            disabled={submitting}
                                        >
                                            + Añadir opcion
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>

                    <div className="rc-modal-footer">
                        <Button
                            type="button"
                            onClick={handleCancel}
                            className="w-full md:w-auto rc-btn-secondary"
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="w-full md:w-auto rc-btn-primary"
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

