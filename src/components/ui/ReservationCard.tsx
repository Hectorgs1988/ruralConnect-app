import type { FC, ReactElement } from "react";

interface ReservationCardProps {
    title: string;
    icon: ReactElement;
    capacity: string;
    description: string;
}

const ReservationCard: FC<ReservationCardProps> = ({
    title,
    icon,
    capacity,
    description,
}) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow flex flex-col gap-2 h-full">
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
