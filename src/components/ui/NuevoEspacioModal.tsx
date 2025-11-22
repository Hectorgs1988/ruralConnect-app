import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import Input from "./input";
import TextArea from "./TextArea";
import { useAuth } from "@/context/AuthContext";
import { createEspacio } from "@/api/espacios";

interface NuevoEspacioModalProps {
    onClose: () => void;
    onCreated?: () => void;
}

const NuevoEspacioModal: FC<NuevoEspacioModalProps> = ({ onClose, onCreated }) => {
    const { token } = useAuth();

    const [nombre, setNombre] = useState("");
    const [tipo, setTipo] = useState("");
    const [aforo, setAforo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Debes iniciar sesión como admin.");
            return;
        }

        if (!nombre.trim() || !tipo.trim()) {
            setError("Nombre y tipo son obligatorios.");
            return;
        }

        let aforoNumber: number | undefined;
        if (aforo.trim()) {
            const parsed = Number(aforo.trim());
            if (!Number.isFinite(parsed) || parsed <= 0) {
                setError("El aforo debe ser un número positivo.");
                return;
            }
            aforoNumber = parsed;
        }

        try {
            setSubmitting(true);
            await createEspacio(
                {
                    nombre: nombre.trim(),
                    tipo: tipo.trim(),
                    aforo: aforoNumber,
                    descripcion: descripcion.trim() || undefined,
                },
                token,
            );

            onCreated?.();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al crear el espacio");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rc-modal-overlay" onClick={onClose}>
            <div
                className="rc-modal-panel max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="mb-6">
                    <h2 className="rc-modal-title">Nuevo espacio</h2>
                    <p className="rc-modal-subtitle">
                        Crea un nuevo espacio que podrá reservarse desde la app
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="text-sm text-error mb-2">{error}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre *</label>
                            <Input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Nombre del espacio"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tipo *</label>
                            <Input
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                placeholder="Ej. comedor, cocina, pista padel..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Aforo (opcional)</label>
                            <Input
                                value={aforo}
                                onChange={(e) => setAforo(e.target.value)}
                                placeholder="Número máximo de personas"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                        <TextArea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Descripción breve del espacio"
                            rows={3}
                        />
                    </div>

                    <div className="rc-modal-footer">
                        <Button
                            type="button"
                            onClick={onClose}
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
                            {submitting ? "Creando espacio..." : "Crear espacio"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NuevoEspacioModal;

