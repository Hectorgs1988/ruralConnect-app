import { useState, type FC } from "react";
import Button from "./button";
import Input from "./input";
import Textarea from "./TextArea";

interface OfferTravelModalProps {
    onClose: () => void;
    onSubmit: (travel: any) => void; // Puedes sustituir `any` por una interfaz Travel
}

const OfferTravelModal: FC<OfferTravelModalProps> = ({ onClose, onSubmit }) => {
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [plazas, setPlazas] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newTravel = {
            name: "Héctor García", // Esto podría venir de Auth más adelante
            car: "Volkswagen Golf azul", // Esto también podría personalizarse
            from: origen,
            to: destino,
            date: fecha,
            time: hora,
            phone: "637915472",
            occupancy: `${plazas}/4 plazas`,
            description: descripcion,
        };

        onSubmit(newTravel); // Envía el viaje al componente padre
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
            <div className="bg-[#FAFAF0] w-full max-w-lg rounded-xl shadow-xl relative p-6">
                {/* Botón cerrar */}
                <button
                    className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
                    onClick={onClose}
                    aria-label="Cerrar modal"
                >
                    ✕
                </button>

                {/* Título */}
                <h2 className="text-xl font-semibold mb-1">Ofrecer nuevo viaje</h2>
                <p className="text-sm text-gray-600 mb-5">
                    Publica tu viaje para que otros socios puedan unirse
                </p>

                {/* Formulario */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="text-sm text-gray-700 block mb-1">Origen</label>
                            <Input
                                placeholder="Ej: Burgos"
                                value={origen}
                                onChange={(e) => setOrigen(e.target.value)}
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="text-sm text-gray-700 block mb-1">Destino</label>
                            <Input
                                placeholder="Ej: Susinos"
                                value={destino}
                                onChange={(e) => setDestino(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="text-sm text-gray-700 block mb-1">Fecha</label>
                            <Input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="text-sm text-gray-700 block mb-1">Hora</label>
                            <Input
                                type="time"
                                value={hora}
                                onChange={(e) => setHora(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 block mb-1">Plazas disponibles</label>
                        <Input
                            type="number"
                            placeholder="Ej: 3"
                            value={plazas}
                            onChange={(e) => setPlazas(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700 block mb-1">Descripción del viaje</label>
                        <Textarea
                            placeholder="Información adicional sobre el viaje..."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        Publicar viaje
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default OfferTravelModal;
