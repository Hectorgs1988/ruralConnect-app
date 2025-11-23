import type { FC, ReactElement } from "react";

interface ReservationCardProps {
    title: string;
    icon: ReactElement;
    capacity: string;
    description: string;
    onClick?: () => void;
}

const ReservationCard: FC<ReservationCardProps> = ({
    title,
    icon,
    capacity,
    description,
    onClick,
}) => {
    return (
        <div
            onClick={onClick}
            className="rc-card p-4 flex flex-col gap-2 h-full transition-transform hover:-translate-y-0.5 hover:shadow-soft"
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : -1}
        >
            <div className="flex items-center gap-2 text-xl font-semibold text-dark">
                {icon}
                {title}
            </div>
            <div className="text-sm text-muted">Capacidad: {capacity}</div>
            <div className="text-sm text-muted">{description}</div>
        </div>
    );
};

export default ReservationCard;
