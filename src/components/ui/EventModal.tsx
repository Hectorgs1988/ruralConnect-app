// src/components/ui/EventModal.tsx
import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import Input from "./input";
import { useAuth } from "@/context/AuthContext";
import { joinEvento } from "@/api/eventos";

interface EventModalProps {
    onClose: () => void;
    event: {
        id?: string;
        title: string;
        date: string;
        location: string;
    };
}

const EventModal: FC<EventModalProps> = ({ onClose, event }) => {
    const [name, setName] = useState("");
    const [peopleCount, setPeopleCount] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Debes iniciar sesión para apuntarte a un evento.");
            return;
        }

        if (!event.id) {
            setError("No se ha podido identificar el evento.");
            return;
        }

        if (!peopleCount || peopleCount < 1) {
            setError("El número de asistentes debe ser al menos 1.");
            return;
        }

        try {
            setSubmitting(true);
            await joinEvento(event.id, { asistentes: peopleCount }, token);

            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al apuntarte al evento");
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
                className="rc-modal-panel max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="mb-4">
                    <h2 className="rc-modal-title">{event.title}</h2>
                    <p className="rc-modal-subtitle">{event.date} · {event.location}</p>
                </div>

                <form className="space-y-3" onSubmit={handleSubmit}>
                    {error && (
                        <p className="text-sm text-error mb-1">
                            {error}
                        </p>
                    )}

                    <label className="text-sm text-dark block mb-1">Nombre</label>
                    <Input
                        placeholder="nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <label className="text-sm text-dark block mb-1">Número de asistentes</label>
                    <Input
                        type="number"
                        min={1}
                        value={peopleCount.toString()}
                        onChange={(e) => setPeopleCount(Number(e.target.value))}
                    />

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
                            {submitting ? "Apuntando..." : "Apuntarme"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
