// src/components/ui/EventModal.tsx
import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import Input from "./input";

interface EventModalProps {
    onClose: () => void;
    event: {
        title: string;
        date: string;
        location: string;
    };
}

const EventModal: FC<EventModalProps> = ({ onClose, event }) => {
    const [name, setName] = useState("");
    const [peopleCount, setPeopleCount] = useState(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí podrías guardar o enviar los datos donde quieras
        console.log("Apuntado:", { name, peopleCount });
        onClose();
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
                    <Input
                        placeholder="Tu nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                        type="number"
                        placeholder="Número de personas"
                        value={peopleCount.toString()}
                        onChange={(e) => setPeopleCount(Number(e.target.value))}
                    />
                    <Button type="submit" className="w-full">
                        Apuntarme
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
