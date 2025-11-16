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
                    className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="flex flex-col items-center text-center gap-2 mb-5">
                    <div className="rc-pill">
                        🚗 Confirmar viaje
                    </div>
                    <h2 className="rc-modal-title">
                        Confirmar reserva de viaje
                    </h2>
                    <p className="rc-modal-subtitle">
                        ¿Deseas unirte a este viaje?
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

                <div className="rc-modal-footer">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 rc-btn-secondary"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 rc-btn-primary"
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
