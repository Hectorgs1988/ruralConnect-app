import { useState, type FC } from "react";
import Button from '@/components/ui/button';
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
    onJoin?: () => void;
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
    onJoin,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-sm">
            <h3 className="font-bold text-lg flex items-center gap-2">
                🚗 {name}
            </h3>
            <p className="text-sm text-gray-700">{car}</p>
            <div className="text-sm text-gray-700 mt-2 flex items-center gap-2">
                <MapPin size={16} /> {from} → {to}
            </div>
            <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                <Calendar size={16} /> {date} -- {time}
            </div>
            <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                <Phone size={16} /> {phone}
            </div>
            <div className="flex justify-between items-center mt-3">
                <span className="text-sm flex items-center gap-1">
                    <UsersRound size={16} /> {occupancy}
                </span>
                <Button type="submit" className="text-sm px-4 py-1 rounded font-medium" onClick={onJoin}>Unirse</Button>
            </div>
        </div>
    );
};

export default ShareCarCard;
