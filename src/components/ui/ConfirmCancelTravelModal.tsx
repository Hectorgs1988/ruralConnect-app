import type { FC } from "react";
import Button from "@/components/ui/button";
import type { Travel } from "@/types/Travel";

interface ConfirmCancelTravelModalProps {
    travel: Travel;
    onConfirm: () => void;
    onClose: () => void;
}

const ConfirmCancelTravelModal: FC<ConfirmCancelTravelModalProps> = ({
    travel,
    onConfirm,
    onClose,
}) => {
    return (
        <div
            className="rc-modal-overlay"
            onClick={onClose}
        >
            <div
                className="rc-modal-panel"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3 right-3 md:top-4 md:right-4 text-muted hover:text-dark text-xl font-semibold z-10"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="flex flex-col items-center text-center gap-2 mb-4 md:mb-5">
                    <div className="rc-pill bg-red-50 text-red-600">
                        ⚠️ Cancelar viaje
                    </div>
                    <h2 className="rc-modal-title">
                        ¿Estás seguro de cancelar este viaje?
                    </h2>
                    <p className="rc-modal-subtitle">
                        Esta acción no se puede deshacer. Se enviará un email a todos los pasajeros notificándoles la cancelación.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm md:text-base">
                    <div className="space-y-2">
                        <p className="font-medium text-dark">
                            Origen →{" "}
                            <span className="font-normal text-muted">
                                {travel.from}
                            </span>
                        </p>
                        <p className="font-medium text-dark">
                            Destino →{" "}
                            <span className="font-normal text-muted">
                                {travel.to}
                            </span>
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-medium text-dark">
                            Fecha →{" "}
                            <span className="font-normal text-muted">
                                {travel.date}
                            </span>
                        </p>
                        <p className="font-medium text-dark">
                            Hora →{" "}
                            <span className="font-normal text-muted">
                                {travel.time}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                    <p className="text-sm text-red-800">
                        <strong>Pasajeros afectados:</strong> {travel.occupancy}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                        Todos los pasajeros recibirán un email de notificación.
                    </p>
                </div>

                <div className="rc-modal-footer">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 sm:flex-initial rc-btn-secondary"
                        onClick={onClose}
                    >
                        No, mantener viaje
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white"
                        onClick={onConfirm}
                    >
                        Sí, cancelar viaje
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmCancelTravelModal;

