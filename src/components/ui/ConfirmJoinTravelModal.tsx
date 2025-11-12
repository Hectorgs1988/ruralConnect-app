import type { FC } from "react";
import Button from "@/components/ui/button";
import type { Travel } from "@/types/Travel";

interface ConfirmJoinTravelModalProps {
    travel: Travel;
    onConfirm: () => void;
    onClose: () => void;
}

const ConfirmJoinTravelModal: FC<ConfirmJoinTravelModalProps> = ({
    travel,
    onConfirm,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-xl relative p-6">
                <h2 className="text-2xl font-bold mb-2 text-center">
                    Confirmar reserva de viaje
                </h2>
                <p className="text-center text-sm md:text-base text-gray-700 mb-4">
                    ¿Deseas unirte a este viaje?
                </p>

                <div className="h-[2px] bg-yellow-300 mb-4" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm md:text-base">
                    <div>
                        <p className="font-medium">Origen → <span className="font-normal">{travel.from}</span></p>
                        <p className="font-medium mt-2">Destino → <span className="font-normal">{travel.to}</span></p>
                    </div>
                    <div>
                        <p className="font-medium">Fecha → <span className="font-normal">{travel.date}</span></p>
                        <p className="font-medium mt-2">Hora → <span className="font-normal">{travel.time}</span></p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 bg-yellow-200 hover:bg-yellow-300 text-black font-semibold"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 font-semibold"
                        onClick={onConfirm}
                    >
                        Confirmar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmJoinTravelModal;
