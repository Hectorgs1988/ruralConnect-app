import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import { useAuth } from "@/context/AuthContext";
import { deleteEvento } from "@/api/eventos";

interface EliminarEventoModalProps {
    evento: {
        id: string;
        titulo: string;
    };
    onClose: () => void;
    onDeleted?: () => void;
}

const EliminarEventoModal: FC<EliminarEventoModalProps> = ({ evento, onClose, onDeleted }) => {
    const { token } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setError(null);

        if (!token) {
            setError("Debes iniciar sesion como admin.");
            return;
        }

        try {
            setSubmitting(true);
            await deleteEvento(evento.id, token);

            if (onDeleted) onDeleted();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al eliminar el evento");
        } finally {
            setSubmitting(false);
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
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="mb-4">
                    <h2 className="rc-modal-title">
                        Eliminar evento <span className="font-semibold">[{evento.titulo}]</span>
                    </h2>
                    <p className="rc-modal-subtitle">
                        Deseas eliminar este evento?
                    </p>
                </div>

                {error && (
                    <p className="text-sm text-error mb-4">
                        {error}
                    </p>
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

export default EliminarEventoModal;

