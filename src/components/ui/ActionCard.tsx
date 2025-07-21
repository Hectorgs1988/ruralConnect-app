import type { FC, ReactNode } from "react";
import { Link } from "react-router-dom";

interface ActionCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    buttonText: string;
    href?: string;
    onClick?: () => void;
}

const ActionCard: FC<ActionCardProps> = ({
    icon,
    title,
    description,
    buttonText,
    href,
    onClick,
}) => {
    return (
        <div className="bg-yellow-300 p-5 rounded-xl w-full max-w-sm shadow-md">
            <div className="text-3xl mb-2">{icon}</div>
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-gray-700 mb-4">{description}</p>

            {href ? (
                <Link
                    to={href}
                    className="block bg-white hover:bg-gray-100 text-sm font-medium w-full text-center py-2 rounded"
                >
                    {buttonText}
                </Link>
            ) : (
                <button
                    onClick={onClick}
                    className="bg-white hover:bg-gray-100 text-sm font-medium w-full py-2 rounded"
                >
                    {buttonText}
                </button>
            )}
        </div>
    );
};

export default ActionCard;
