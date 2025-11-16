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
        <div
            onClick={onClick}
            className="rc-card p-4 mb-3 cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-soft"
        >
            <h4 className="text-base font-semibold text-dark mb-1">{title}</h4>
            <div className="text-sm text-muted flex items-center gap-1">
                📅 {date} - 🕒 {time}
            </div>
            <div className="text-sm text-muted flex items-center gap-1 mt-1">
                📍 {location}
            </div>
        </div>
    );
};

export default EventCard;
