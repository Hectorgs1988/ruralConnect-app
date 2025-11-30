import type { FC } from "react";
import Button from "@/components/ui/button";
import type { Travel } from "@/types/Travel";

interface ConfirmLeaveTravelModalProps {
    travel: Travel;
    onConfirm: () => void;
    onClose: () => void;
}

const ConfirmLeaveTravelModal: FC<ConfirmLeaveTravelModalProps> = ({
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
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-leave-travel-title"
                aria-describedby="confirm-leave-travel-description"
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
                    <div className="rc-pill bg-yellow-50 text-yellow-700">
                        ⚠️ Anular plaza
                    </div>
                    <h2 id="confirm-leave-travel-title" className="rc-modal-title">
                        ¿Estás seguro de anular tu plaza en este viaje?
                    </h2>
                    <p
                        id="confirm-leave-travel-description"
                        className="rc-modal-subtitle"
                    >
                        Perderás tu plaza en este viaje. Se enviará un email al conductor con tu cancelación.
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

                <div className="bg-surfaceMuted border border-borderSoft rounded-lg p-3 mb-6">
                    <p className="text-sm text-muted">
                        <strong>Plazas actualmente ocupadas:</strong> {travel.occupancy}
                    </p>
                </div>

                <div className="rc-modal-footer">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 sm:flex-initial rc-btn-secondary"
                        onClick={onClose}
                    >
                        No, mantener mi plaza
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white"
                        onClick={onConfirm}
                    >
                        Sí, anular mi plaza
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmLeaveTravelModal;

