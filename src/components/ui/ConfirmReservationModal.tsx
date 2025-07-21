import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

type ConfirmReservationModalProps = {
    onClose: () => void;
};

const ConfirmReservationModal = ({ onClose }: ConfirmReservationModalProps) => {
    const [username, setUsername] = useState('');

    const handleRecover = () => {
    alert(`Se ha confirmado la reserva para: ${username}`);
    onClose();
};

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
        className="absolute top-2 right-2 text-gray-600"
        onClick={onClose}
        >
        ✕
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">
            Unirse a un viaje
        </h2>

        <label htmlFor="username" className="text-sm font-medium">
            Usuario
        </label>
        <Input
            id="username"
            placeholder="Introduce tu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
        />

        <Button onClick={handleRecover} className="mt-4 w-full">
            Confirmar reserva de viaje
        </Button>
        </div>
        </div>
    );
};

export default ConfirmReservationModal;
