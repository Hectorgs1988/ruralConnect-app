// src/components/ui/NavMenu.tsx
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const NavMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const navItems = [
        { to: "/inicio", label: "Inicio" },
        { to: "/ReservarEspacio", label: "Reservar Espacio" },
        { to: "/CompartirCoche", label: "Compartir Coche" },
        { to: "/AsociacionMosquitos", label: "Asociacion Los Mosquitos" },
    ];

    return (
        <nav className="w-full px-4 py-3 bg-white border-b border-yellow-400">
            {/* DESKTOP */}
            <div className="hidden md:flex items-center max-w-6xl mx-auto">
                {/* Saludo a la izquierda */}
                <span className="text-sm text-gray-700 mr-6">
                    {user ? `Hola, ${user.name}` : "Hola 👋"}
                </span>

                {/* Menú centrado en resto del espacio */}
                <div className="flex-1 flex justify-center space-x-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className="px-5 py-2.5 rounded-md text-base font-medium hover:bg-yellow-100 whitespace-nowrap"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* MOBILE */}
            <div className="flex md:hidden justify-between items-center">
                {/* Saludo móvil */}
                <span className="text-sm text-gray-700">
                    {user ? `Hola, ${user.name}` : "Hola 👋"}
                </span>

                {/* Icono menú */}
                <button onClick={toggleMenu} className="text-black">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden absolute top-14 left-0 w-full bg-white shadow-md z-10">
                    <div className="flex flex-col space-y-2 p-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={closeMenu}
                                className="py-2.5 px-4 rounded hover:bg-yellow-100 text-base whitespace-nowrap"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default NavMenu;
