import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { to: "/inicio", label: "Inicio" },
    { to: "/ReservarEspacio", label: "Reservar Espacio" },
    { to: "/CompartirCoche", label: "Compartir Coche" },
    { to: "/AsociacionMosquitos", label: "Descubre Rural Connect" },
];

const NavMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const handleLogout = () => {
        logout();      
        navigate("/");  
    };

    return (
        <nav className="w-full bg-surface/80 border-b border-borderSoft backdrop-blur">
            <div className="rc-shell py-2 relative">
                {/* DESKTOP: saludo + menú + botón logout */}
            <div className="hidden md:flex items-center justify-between">
                {/* Saludo izquierda */}
                <div className="text-sm text-muted">
                    {user && (
                        <>
                            Hola, <span className="font-semibold">{user.name}</span>
                        </>
                    )}
                </div>

                {/* Menú centro */}
                <div className="flex items-center space-x-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className="px-4 py-2 rounded-full text-sm text-muted hover:text-dark hover:bg-primarySoft"
                        >
                            {item.label}
                        </Link>
                    ))}

                    {user?.role === "ADMIN" && (
                        <Link
                            to="/PanelAdmin"
                            className="px-4 py-2 rounded-full text-sm font-semibold text-dark bg-primary/80 hover:bg-primaryStrong"
                        >
                            Admin
                        </Link>
                    )}
                </div>

                {/* Botón logout derecha */}
                <div>
                    {user && (
                        <button
                            onClick={handleLogout}
                            className="text-xs md:text-sm px-3 py-1 rounded-full border border-borderSoft text-muted hover:bg-surfaceMuted"
                        >
                            Cerrar sesión
                        </button>
                    )}
                </div>
            </div>

            {/* MOBILE: saludo + icono menú */}
            <div className="flex justify-between items-center md:hidden">
                <div className="text-xs text-muted">
                    {user && (
                        <>
                            Hola, <span className="font-semibold">{user.name}</span>
                        </>
                    )}
                </div>

                <button onClick={toggleMenu} className="text-dark">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Menú móvil desplegable */}
            {isOpen && (
                <div className="md:hidden absolute top-11 left-0 w-full bg-surface shadow-soft border border-borderSoft rounded-2xl z-10">
                    <div className="flex flex-col space-y-2 p-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={closeMenu}
                                className="py-2 px-4 rounded-full text-sm text-muted hover:text-dark hover:bg-primarySoft"
                            >
                                {item.label}
                            </Link>
                        ))}

                        {user?.role === "ADMIN" && (
                            <Link
                                to="/PanelAdmin"
                                onClick={closeMenu}
                                className="py-2 px-4 rounded-full text-sm font-semibold text-dark bg-primary/80 hover:bg-primaryStrong"
                            >
                                Admin
                            </Link>
                        )}

                        {user && (
                            <button
                                onClick={() => {
                                    handleLogout();
                                    closeMenu();
                                }}
                                className="mt-2 py-2 px-4 rounded-full text-sm text-error hover:bg-surfaceMuted text-left"
                            >
                                Cerrar sesión
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
        </nav>
    );
};

export default NavMenu;
