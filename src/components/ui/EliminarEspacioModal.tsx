import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import { useAuth } from "@/context/AuthContext";
import { deleteEspacio } from "@/api/espacios";
import type { Espacio } from "@/types/Espacio";

interface EliminarEspacioModalProps {
    espacio: Espacio;
    onClose: () => void;
    onDeleted?: () => void;
}

const EliminarEspacioModal: FC<EliminarEspacioModalProps> = ({
    espacio,
    onClose,
    onDeleted,
}) => {
    const { token } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setError(null);

        if (!token) {
            setError("Debes iniciar sesión como admin.");
            return;
        }

        try {
            setSubmitting(true);
            await deleteEspacio(espacio.id, token);
            onDeleted?.();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al eliminar el espacio");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rc-modal-overlay" onClick={onClose}>
            <div
                className="rc-modal-panel max-w-lg"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-space-modal-title"
                aria-describedby="delete-space-modal-description"
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

                <div className="mb-4">
                    <h2 id="delete-space-modal-title" className="rc-modal-title">
                        Eliminar espacio
                        <span className="font-semibold"> [{espacio.nombre}]</span>
                    </h2>
                    <p
                        id="delete-space-modal-description"
                        className="rc-modal-subtitle"
                    >
                        ¿Deseas eliminar este espacio? Esta acción no se puede deshacer.
                    </p>
                </div>

                {error && (
                    <p className="text-sm text-error mb-4">{error}</p>
                )}

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
                        type="button"
                        onClick={handleDelete}
                        className="w-full md:w-auto rc-btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? "Eliminando..." : "Eliminar"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EliminarEspacioModal;

