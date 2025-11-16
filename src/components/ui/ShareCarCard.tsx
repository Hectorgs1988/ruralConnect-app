import type { FC } from "react";
import Button from "@/components/ui/button";
import { Phone, Calendar, MapPin, UsersRound } from "lucide-react";

interface ShareCarCardProps {
    name: string;
    car: string;
    from: string;
    to: string;
    date: string;
    time: string;
    phone: string;
    occupancy: string;
    description?: string;
    joined?: boolean;
    isDriver?: boolean;
    onJoin?: () => void;
    onLeave?: () => void;
}

const ShareCarCard: FC<ShareCarCardProps> = ({
    name,
    car,
    from,
    to,
    date,
    time,
    phone,
    occupancy,
    description,
    joined,
    isDriver,
    onJoin,
    onLeave,
}) => {
    return (
        <div className="rc-card p-4 w-full max-w-sm">
            <h3 className="font-bold text-lg flex items-center gap-2 text-dark">
                🚗 {name}
            </h3>

            <p className="text-sm text-muted">{car}</p>

            <div className="text-sm text-muted mt-2 flex items-center gap-2">
                <MapPin size={16} /> {from} → {to}
            </div>

            <div className="text-sm text-muted mt-1 flex items-center gap-2">
                <Calendar size={16} /> {date} -- {time}
            </div>

            <div className="text-sm text-muted mt-1 flex items-center gap-2">
                <Phone size={16} /> {phone}
            </div>

            {description && (
                <p className="text-xs text-muted mt-1">{description}</p>
            )}

            <div className="flex justify-between items-center mt-3">
                <span className="text-sm flex items-center gap-1 text-muted">
                    <UsersRound size={16} /> {occupancy}
                </span>

                {/* Botones según rol/estado */}
                {isDriver && (
                    <span className="text-xs text-muted">Eres el conductor</span>
                )}

                {!isDriver && !joined && onJoin && (
                    <Button
                        type="button"
                        className="rc-btn-primary text-xs md:text-sm px-4 py-1"
                        onClick={onJoin}
                    >
                        Unirse
                    </Button>
                )}

                {!isDriver && joined && onLeave && (
                    <Button
                        type="button"
                        variant="secondary"
                        className="text-xs md:text-sm px-4 py-1 rounded-full border border-borderSoft text-muted hover:bg-surfaceMuted"
                        onClick={onLeave}
                    >
                        Salir
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ShareCarCard;
