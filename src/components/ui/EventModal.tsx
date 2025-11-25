// src/components/ui/EventModal.tsx
import type { FC } from "react";
import { useState, useEffect } from "react";
import Button from "./button";
import Input from "./input";
import { useAuth } from "@/context/AuthContext";
import { joinEvento, leaveEvento } from "@/api/eventos";

interface EventModalProps {
    onClose: () => void;
    onUpdate?: () => void; // Callback para refrescar la lista
    event: {
        id?: string;
        title: string;
        date: string;
        location: string;
        apuntados?: number; // Total de personas apuntadas
        aforo?: number | null; // Aforo máximo
        isJoined?: boolean; // Si el usuario ya está inscrito
        misAsistentes?: number; // Cuántos asistentes registró el usuario
    };
}

const EventModal: FC<EventModalProps> = ({ onClose, onUpdate, event }) => {
    const [name, setName] = useState("");
    const [peopleCount, setPeopleCount] = useState(
        event.misAsistentes ? String(event.misAsistentes) : ""
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmStep, setConfirmStep] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Para modo edición
    const { token, user } = useAuth();

    const parsedPeopleCount = Number(peopleCount || "0");
    const isJoined = event.isJoined ?? false;

    // Si el usuario está logueado, rellenar automáticamente el nombre
    useEffect(() => {
        if (user?.name) {
            setName(user.name);
        }
    }, [user]);

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

        const countStr = peopleCount.trim();

        // Si ya está inscrito, solo necesita el número de asistentes
        if (isJoined) {
            if (!countStr) {
                setError("Indica el número de asistentes.");
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
                if (onUpdate) onUpdate();
                setIsEditing(false);
                setConfirmStep(false);
                setError(null);
            } catch (err: any) {
                setError(err?.message ?? "Error al actualizar el evento");
            } finally {
                setSubmitting(false);
            }
            return;
        }

        // Si no está inscrito, necesita número y, si no hay nombre en el campo,
        // usaremos el nombre del usuario logueado si existe.
        const effectiveName = (name || user?.name || "").trim();

        if (!effectiveName || !countStr) {
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
            if (onUpdate) onUpdate();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al apuntarte al evento");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLeave = async () => {
        if (!token || !event.id) return;

        try {
            setSubmitting(true);
            setError(null);
            await leaveEvento(event.id, token);
            if (onUpdate) onUpdate();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al salirte del evento");
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
                    className="absolute top-3 right-3 md:top-4 md:right-4 text-muted hover:text-dark text-xl font-semibold z-10"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="mb-4 pr-8">
                    <h2 className="rc-modal-title">{event.title}</h2>
                    <p className="rc-modal-subtitle">{event.date} · {event.location}</p>
                </div>

                {/* Información de asistencia */}
                <div className="mb-4 p-3 bg-soft rounded-lg border border-borderSoft">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">Personas apuntadas:</span>
                        <span className="font-semibold text-dark">
                            {event.apuntados ?? 0}
                            {event.aforo && ` / ${event.aforo}`}
                        </span>
                    </div>
                    {isJoined && event.misAsistentes && (
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-borderSoft">
                            <span className="text-muted">Tus asistentes:</span>
                            <span className="font-semibold text-primary">
                                {event.misAsistentes}
                            </span>
                        </div>
                    )}
                </div>

                {isJoined ? (
                    // Usuario ya inscrito - Mostrar opción de editar o salirse
                    <div className="space-y-3 md:space-y-4">
                        {error && (
                            <p className="text-sm text-error mb-1">
                                {error}
                            </p>
                        )}

                        {!isEditing ? (
                            // Modo visualización
                            <>
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">
                                        ✓ Ya estás inscrito en este evento con{" "}
                                        <span className="font-semibold">{event.misAsistentes}</span>{" "}
                                        asistente{event.misAsistentes && event.misAsistentes > 1 ? "s" : ""}.
                                    </p>
                                </div>

                                <div className="rc-modal-footer">
                                    <Button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 sm:flex-initial rc-btn-secondary"
                                        disabled={submitting}
                                    >
                                        Cerrar
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="flex-1 sm:flex-initial rc-btn-primary"
                                        disabled={submitting}
                                    >
                                        Modificar asistentes
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleLeave}
                                        className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Saliendo..." : "Salirme"}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            // Modo edición
                            <form onSubmit={handleSubmit}>
                                <label className="text-sm text-dark block mb-1">
                                    Número de asistentes
                                </label>
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
                                    <p className="text-sm text-dark mt-3">
                                        Confirma que quieres actualizar a{" "}
                                        <span className="font-semibold">
                                            {parsedPeopleCount} asistente{parsedPeopleCount > 1 ? "s" : ""}
                                        </span>
                                        .
                                    </p>
                                )}

                                <div className="rc-modal-footer">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setPeopleCount(String(event.misAsistentes || 1));
                                            setConfirmStep(false);
                                            setError(null);
                                        }}
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
                                        {submitting
                                            ? "Actualizando..."
                                            : confirmStep
                                                ? "Confirmar cambio"
                                                : "Actualizar"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    // Usuario no inscrito - Mostrar formulario de inscripción
                    <form className="space-y-3 md:space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <p className="text-sm text-error mb-1">
                                {error}
                            </p>
                        )}

                        <label className="text-sm text-dark block mb-1">Nombre</label>
                        <Input
                            placeholder="Tu nombre"
                            value={name}
                            disabled={!!user?.name}
                            readOnly={!!user?.name}
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
                                {submitting
                                    ? "Apuntando..."
                                    : confirmStep
                                        ? "Confirmar asistencia"
                                        : "Apuntarme"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EventModal;
