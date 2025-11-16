import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import { useAuth } from "@/context/AuthContext";
import { deleteUser } from "@/api/users";

interface EliminarSocioModalProps {
    socio: {
        id: string;
        nombre: string;
    };
    onClose: () => void;
    onDeleted?: () => void;
}

const EliminarSocioModal: FC<EliminarSocioModalProps> = ({ socio, onClose, onDeleted }) => {
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
            await deleteUser(socio.id, token);

            if (onDeleted) onDeleted();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al eliminar el socio");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center px-4">
            <div className="bg-[#FAFAF0] rounded-xl p-6 md:p-8 w-full max-w-lg relative shadow-lg">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-6 text-gray-500 hover:text-black text-xl font-semibold"
                >
                    X
                </button>

                <h2 className="text-2xl font-bold mb-2">
                    Eliminar socio <span className="font-semibold">[{socio.nombre}]</span>
                </h2>
                <p className="text-sm text-gray-700 mb-6">Deseas eliminar a este socio?</p>

                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

                <div className="flex flex-col md:flex-row gap-3 justify-end">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="w-full md:w-auto bg-white border border-gray-300 text-black hover:bg-gray-50"
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDelete}
                        className="w-full md:w-auto"
                        disabled={submitting}
                    >
                        {submitting ? "Eliminando..." : "Eliminar"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EliminarSocioModal;

