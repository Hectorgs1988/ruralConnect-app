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
    const [peopleCount, setPeopleCount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmStep, setConfirmStep] = useState(false);
    const { token } = useAuth();

    const parsedPeopleCount = Number(peopleCount || "0");

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

        const trimmedName = name.trim();
        const countStr = peopleCount.trim();

        if (!trimmedName || !countStr) {
            setError("Rellena tu nombre y el número de asistentes.");
            setConfirmStep(false);
            return;
        }

        const count = Number(countStr);
        if (!Number.isFinite(count) || count < 1) {
            setError("El número de asistentes debe ser al menos 1.");
            setConfirmStep(false);
            return;
        }

        if (!confirmStep) {
            setConfirmStep(true);
            return;
        }

        try {
            setSubmitting(true);
            await joinEvento(event.id, { asistentes: count }, token);
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al apuntarte al evento");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    return (
        <div
            className="rc-modal-overlay"
            onClick={handleClose}
        >
            <div
                className="rc-modal-panel max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleClose}
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
                        placeholder="Tu nombre"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setConfirmStep(false);
                        }}
                    />

                    <label className="text-sm text-dark block mb-1">Número de asistentes</label>
                    <Input
                        type="number"
                        min={1}
                        placeholder="Número de asistentes"
                        value={peopleCount}
                        onChange={(e) => {
                            setPeopleCount(e.target.value);
                            setConfirmStep(false);
                        }}
                    />

                    {confirmStep && !error && (
                        <p className="text-sm text-dark">
                            Confirma que quieres apuntarte al evento con{" "}
                            <span className="font-semibold">
                                {parsedPeopleCount} asistente{parsedPeopleCount > 1 ? "s" : ""}
                            </span>
                            .
                        </p>
                    )}

                    <div className="rc-modal-footer">
                        <Button
                            type="button"
                            onClick={handleClose}
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
                            {submitting
                                ? "Apuntando..."
                                : confirmStep
                                    ? "Confirmar asistencia"
                                    : "Apuntarme"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
