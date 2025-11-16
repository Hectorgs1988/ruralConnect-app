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
        <div className="rc-card bg-primary/95 p-5 w-full max-w-sm">
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="text-lg font-semibold mb-1 text-dark">{title}</h3>
            <p className="text-sm text-dark/80 mb-4">{description}</p>

            {href ? (
                <Link
                    to={href}
                    className="block bg-surface hover:bg-surfaceMuted text-xs md:text-sm font-semibold w-full text-center py-2 rounded-full shadow-sm transition-colors text-dark"
                >
                    {buttonText}
                </Link>
            ) : (
                <button
                    onClick={onClick}
                    className="bg-surface hover:bg-surfaceMuted text-xs md:text-sm font-semibold w-full py-2 rounded-full shadow-sm transition-colors text-dark"
                >
                    {buttonText}
                </button>
            )}
        </div>
    );
};

export default ActionCard;
