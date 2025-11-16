import type { FC } from "react";
import logo from "@/assets/RC.png";

const Header: FC = () => {
    return (
        <header className="bg-surface/80 border-b border-borderSoft backdrop-blur">
            <div className="rc-shell flex items-center py-3">
                <img
                    src={logo}
                    alt="Logo"
                    className="w-11 h-11 object-contain mr-3"
                />
                <div>
                    <h1 className="text-lg md:text-xl font-semibold leading-none text-dark">
                        Rural Connect
                    </h1>
                    <p className="text-xs md:text-sm text-muted">Conectando entornos rurales</p>
                </div>
            </div>
        </header>
    );
};

export default Header;
