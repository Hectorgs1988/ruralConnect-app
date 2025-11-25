import type { FC } from "react";
import { Calendar, Clock3, MapPin, Users } from "lucide-react";


interface EventCardProps {
    title?: string;
    date?: string;
    time?: string;
    location?: string;
    apuntados?: number;
    aforo?: number | null;
    isJoined?: boolean;
    onClick?: () => void;
}

const EventCard: FC<EventCardProps> = ({
    title = "Nombre del evento",
    date = "Sábado 12 de Julio",
    time = "15:00h",
    location = "Polideportivo",
    apuntados,
    aforo,
    isJoined = false,
    onClick

}) => {
    return (
        <div
            onClick={onClick}
            className={`rc-card p-4 mb-3 cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-soft ${
                isJoined ? "border-2 border-primary" : ""
            }`}
        >
            <div className="flex items-start justify-between mb-1">
                <h4 className="text-base font-semibold text-dark">{title}</h4>
                {isJoined && (
                    <span className="rc-pill text-xs bg-primary text-white">
                        Inscrito
                    </span>
                )}
            </div>

            <div className="text-sm text-muted flex items-center gap-2">
                <Calendar size={14} /> {date}
                <span className="mx-1">-</span>
                <Clock3 size={14} /> {time}
            </div>

            <div className="text-sm text-muted flex items-center gap-2 mt-1">
                <MapPin size={14} /> {location}
            </div>

            {apuntados !== undefined && (
                <div className="text-sm text-muted flex items-center gap-2 mt-2 pt-2 border-t border-borderSoft">
                    <Users size={14} />
                    <span>
                        {apuntados} {apuntados === 1 ? "persona" : "personas"}
                        {aforo && ` / ${aforo}`}
                    </span>
                </div>
            )}
        </div>
    );

};

export default EventCard;
