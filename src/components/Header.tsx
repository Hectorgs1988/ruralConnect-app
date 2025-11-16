import type { FC } from "react";
import logo from "@/assets/susinosLogo.png";

const Header: FC = () => {
    return (
        <header className="bg-white flex items-center px-4 py-2 border-b border-yellow-400">
            <img
                src={logo}
                alt="Logo"
                className="w-12 h-12 object-contain mr-4"
            />
            <div>
                <h1 className="text-xl font-bold leading-none text-black">
                    Rural Connect
                </h1>
                <p className="text-sm text-gray-600">Conetando entornos rurales</p>
            </div>
        </header>
    );
};

export default Header;
