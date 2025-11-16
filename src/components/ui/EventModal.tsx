// src/components/ui/EventModal.tsx
import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import Input from "./input";
import { useAuth } from "@/context/AuthContext";

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
            const res = await fetch(`http://localhost:4000/api/eventos/${event.id}/inscribirme`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ asistentes: peopleCount }),
            });

            if (res.status === 409) {
                const j = await res.json().catch(() => null);
                throw new Error(j?.error ?? "Aforo completo para este evento");
            }

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Error ${res.status} al apuntarte al evento`);
            }

            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al apuntarte al evento");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center px-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-lg">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
                >
                    ✕
                </button>

                <h2 className="text-lg font-bold mb-2">{event.title}</h2>
                <p className="text-sm text-gray-600 mb-1">{event.date}</p>
                <p className="text-sm text-gray-600 mb-4">{event.location}</p>

                <form className="space-y-3" onSubmit={handleSubmit}>
                    {error && <p className="text-sm text-red-600 mb-1">{error}</p>}

                    <label className="text-sm text-gray-700 block mb-1">Nombre</label>
                    <Input
                        placeholder="nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <label className="text-sm text-gray-700 block mb-1">Número de asistentes</label>
                    <Input
                        type="number"
                        min={1}
                        value={peopleCount.toString()}
                        onChange={(e) => setPeopleCount(Number(e.target.value))}
                    />
                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? "Apuntando..." : "Apuntarme"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
