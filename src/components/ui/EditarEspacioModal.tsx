import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import Input from "./input";
import TextArea from "./TextArea";
import { useAuth } from "@/context/AuthContext";
import { updateEspacio } from "@/api/espacios";
import type { Espacio } from "@/types/Espacio";

interface EditarEspacioModalProps {
    espacio: Espacio;
    onClose: () => void;
    onUpdated?: () => void;
}

const EditarEspacioModal: FC<EditarEspacioModalProps> = ({ espacio, onClose, onUpdated }) => {
    const { token } = useAuth();

    const [nombre, setNombre] = useState(espacio.nombre);
    const [tipo, setTipo] = useState(espacio.tipo);
    const [aforo, setAforo] = useState(
        espacio.aforo != null ? String(espacio.aforo) : "",
    );
    const [descripcion, setDescripcion] = useState(espacio.descripcion ?? "");
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

        let aforoNumber: number | null | undefined = null;
        if (aforo.trim()) {
            const parsed = Number(aforo.trim());
            if (!Number.isFinite(parsed) || parsed <= 0) {
                setError("El aforo debe ser un número positivo.");
                return;
            }
            aforoNumber = parsed;
        } else {
            aforoNumber = null;
        }

        try {
            setSubmitting(true);
            await updateEspacio(
                espacio.id,
                {
                    nombre: nombre.trim(),
                    tipo: tipo.trim(),
                    aforo: aforoNumber,
                    descripcion: descripcion.trim() || null,
                },
                token,
            );

            onUpdated?.();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al actualizar el espacio");
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
                    className="absolute top-3 right-3 md:top-4 md:right-4 text-muted hover:text-dark text-xl font-semibold z-10"
                    aria-label="Cerrar"
                >
                    ✕
                </button>
                <div className="mb-4 md:mb-6 pr-8">
                    <h2 className="rc-modal-title">Editar espacio</h2>
                    <p className="rc-modal-subtitle">Modifica los datos del espacio</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
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
                            {submitting ? "Guardando cambios..." : "Guardar cambios"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditarEspacioModal;

