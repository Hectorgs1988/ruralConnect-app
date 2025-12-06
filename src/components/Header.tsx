import { type FC, useState } from "react";
import logo from "@/assets/RC.png";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { to: "/inicio", label: "Inicio" },
    { to: "/Eventos", label: "Eventos" },
    { to: "/ReservarEspacio", label: "Reservar Espacio" },
    { to: "/CompartirCoche", label: "Compartir Coche" },
    { to: "/AsociacionMosquitos", label: "Descubre Rural Connect" },
];

const Header: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const firstName = user?.name?.split(" ")[0] ?? "";

    const toggleMenu = () => setIsOpen((prev) => !prev);
    const closeMenu = () => setIsOpen(false);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <header className="w-full">
            <div className="rc-shell py-3 relative">
                {/* DESKTOP: logo + saludo + menú + logout */}
                <div className="hidden md:flex items-center justify-between">
                    {/* Logo + saludo */}
                    <div className="flex items-center gap-4">
                        <Link to="/inicio" className="flex items-center gap-2 shrink-0">
                            <img
                                src={logo}
                                alt="Logo"
                                className="w-11 h-11 object-contain"
                            />
                        </Link>

                        <div className="ml-3 text-xs text-muted whitespace-nowrap">
                            {user && firstName && (
                                <>
                                    <span className="text-base font-bold">Hola,</span>{" "}
                                    <span className="text-base font-bold">{firstName}</span>
                                </>
                            )}
                        </div>

                    </div>

                    {/* Menú centro */}
                    <div className="flex items-center space-x-3 lg:space-x-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className="px-4 py-2 rounded-full text-base font-bold text-muted hover:text-dark hover:bg-primarySoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryStrong/70 focus-visible:bg-primarySoft whitespace-nowrap"
                            >
                                {item.label}
                            </Link>
                        ))}

                        {user?.role === "ADMIN" && (
                            <Link
                                to="/PanelAdmin"
                                className="px-4 py-2 rounded-full text-base font-bold text-dark bg-primary/80 hover:bg-primaryStrong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryStrong/80"
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
                                className="text-xs md:text-base font-bold px-3 py-1 rounded-full border border-borderSoft text-muted hover:bg-surfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryStrong/70 whitespace-nowrap"
                            >
                                Cerrar sesión
                            </button>
                        )}
                    </div>
                </div>

                {/* MOBILE: logo + saludo + icono menú */}
                <div className="flex items-center justify-between md:hidden">
                    <Link to="/inicio" className="flex items-center gap-2">
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-10 h-10 object-contain"
                        />
                    </Link>

                    <div className="flex-1 ml-3 text-xs text-muted">
                        {user && firstName && (
                            <>
                                <span className="text-base font-bold">Hola,</span>{" "}
                                <span className="text-base font-bold">{firstName}</span>
                            </>
                        )}
                    </div>


                    <button onClick={toggleMenu} className="text-dark">
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Menú móvil desplegable */}
                {isOpen && (
                    <div className="md:hidden absolute top-14 left-0 w-full bg-surface shadow-soft border border-borderSoft rounded-2xl z-10">
                        <div className="flex flex-col space-y-2 p-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={closeMenu}
                                    className="py-2 px-4 rounded-full text-base font-bold text-muted hover:text-dark hover:bg-primarySoft"
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
                                    className="mt-2 py-2 px-4 rounded-full text-base font-bold text-error hover:bg-surfaceMuted text-left"
                                >
                                    Cerrar sesión
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
