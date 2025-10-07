// src/components/ui/JoinTripModal.tsx
import type { FC } from "react";
import Button from "./button";
import Input from "./input";

export interface JoinTripModalProps {
    onClose: () => void;
    onConfirm: (payload: { name: string; email: string; phone: string }) => void;
}

const JoinTripModal: FC<JoinTripModalProps> = ({ onClose, onConfirm }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({ name, email, phone });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-xl relative p-6">
                <button
                    className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
                    onClick={onClose}
                    aria-label="Cerrar modal"
                >
                    ✕
                </button>

                <h2 className="text-xl font-semibold mb-1">Confirmar reserva de viaje</h2>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Teléfono</label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Tu teléfono" />
                    </div>

                    <Button type="submit" className="w-full">Confirmar reserva</Button>
                </form>
            </div>
        </div>
    );
};

export default JoinTripModal;
