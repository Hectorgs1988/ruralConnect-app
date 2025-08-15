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
        <div onClick={onClick} 
        className="bg-white p-4 rounded-lg shadow flex flex-col gap-2 h-full"
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : -1}
        >
            <div className="flex items-center gap-2 text-xl font-semibold">
                {icon}
                {title}
            </div>
            <div className="text-sm text-gray-700">👥 {capacity}</div>
            <div className="text-sm text-gray-600">{description}</div>
        </div>
    );
};

export default ReservationCard;
