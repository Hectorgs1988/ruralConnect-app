import type { FC } from "react";

interface EventCardProps {
    title?: string;
    date?: string;
    time?: string;
    location?: string;
    onClick?: () => void;
}

const EventCard: FC<EventCardProps> = ({
    title = "Nombre del evento",
    date = "Sábado 12 de Julio",
    time = "15:00h",
    location = "Polideportivo",
    onClick
    
}) => {
    return (
        <div onClick={onClick} className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-3">
            <h4 className="text-base font-semibold text-gray-800 mb-1">{title}</h4>
            <div className="text-sm text-gray-600 flex items-center gap-1">
                📅 {date} - 🕒 {time}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                📍 {location}
            </div>
        </div>
    );
};

export default EventCard;
