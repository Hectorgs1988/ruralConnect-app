import { type FC, useState, useRef, useEffect } from "react";
import logo from "@/assets/RC.png";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { to: "/inicio", label: "Inicio" },
    { to: "/Eventos", label: "Eventos" },
    { to: "/ReservarEspacio", label: "Reservas" },
    { to: "/CompartirCoche", label: "Compartir coche" },
    { to: "/Despensa", label: "Despensa" },
];

const mobileNavItems = [
    { to: "/inicio", label: "Inicio" },
    { to: "/Eventos", label: "Eventos" },
    { to: "/ReservarEspacio", label: "Espacios" },
    { to: "/CompartirCoche", label: "Viajes" },
    { to: "/Despensa", label: "Despensa" },
    { to: "/AsociacionMosquitos", label: "Descubre Rural Connect" },
];

const Header: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const profileRef = useRef<HTMLDivElement>(null);

    const firstName = user?.name?.split(" ")[0] ?? "";
    const initials = user?.name
        ? user.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
        : "";

    const toggleMenu = () => setIsOpen((prev) => !prev);
    const closeMenu = () => setIsOpen(false);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="w-full bg-surface border-b border-borderSoft relative">
            <div className="rc-shell h-[72px] flex items-center justify-between">

                {/* Logo */}
                <Link to="/inicio" className="flex items-center shrink-0">
                    <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                </Link>

                {/* DESKTOP nav – centrado */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`relative px-3 pb-1 pt-1 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 rounded-sm ${
                                    isActive ? "text-dark" : "text-muted hover:text-dark"
                                }`}
                            >
                                {item.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-primary rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* DESKTOP derecha – avatar + dropdown */}
                <div className="hidden md:flex items-center">
                    {user && (
                        <div ref={profileRef} className="relative">
                            <button
                                onClick={() => setIsProfileOpen((p) => !p)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-primarySoft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                            >
                                <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-dark select-none">
                                    {initials}
                                </span>
                                <span className="text-sm font-semibold text-dark">{firstName}</span>
                                <ChevronDown
                                    size={14}
                                    className={`text-muted transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-borderSoft rounded-2xl shadow-soft z-30 overflow-hidden">
                                    {/* Info usuario */}
                                    <div className="px-4 py-3 border-b border-borderSoft">
                                        <p className="text-sm font-bold text-dark">{user.name}</p>
                                        <p className="text-xs text-muted">
                                            {user.role === "ADMIN" ? "Administrador" : "Socio"}
                                        </p>
                                    </div>

                                    {/* Acciones */}
                                    <div className="py-1">
                                        {user.role === "ADMIN" && (
                                            <Link
                                                to="/PanelAdmin"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="block px-4 py-2 text-sm font-medium text-dark hover:bg-primarySoft"
                                            >
                                                Panel de administración
                                            </Link>
                                        )}
                                        <Link
                                            to="/AsociacionMosquitos"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="block px-4 py-2 text-sm font-medium text-dark hover:bg-primarySoft"
                                        >
                                            Descubre Rural Connect
                                        </Link>
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-borderSoft py-1">
                                        <button
                                            onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                                            className="w-full text-left px-4 py-2 text-sm font-medium text-error hover:bg-surfaceMuted"
                                        >
                                            Cerrar sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MOBILE: hamburguesa */}
                <button onClick={toggleMenu} className="md:hidden text-dark p-1">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* MOBILE drawer */}
            {isOpen && (
                <div className="md:hidden absolute top-[72px] left-0 w-full bg-surface border-b border-borderSoft shadow-soft z-20">
                    <div className="rc-shell py-4 flex flex-col gap-1">
                        {user && (
                            <p className="px-4 py-2 text-sm font-bold text-muted">
                                Hola, {firstName}
                            </p>
                        )}

                        {mobileNavItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={closeMenu}
                                className="py-2 px-4 rounded-full text-base font-semibold text-dark hover:bg-primarySoft"
                            >
                                {item.label}
                            </Link>
                        ))}

                        {user?.role === "ADMIN" && (
                            <>
                                <div className="my-1 border-t border-borderSoft" />
                                <Link
                                    to="/PanelAdmin"
                                    onClick={closeMenu}
                                    className="py-2 px-4 rounded-full text-base font-semibold text-dark hover:bg-primarySoft"
                                >
                                    Administración
                                </Link>
                            </>
                        )}

                        <div className="my-1 border-t border-borderSoft" />

                        {user && (
                            <button
                                onClick={() => { handleLogout(); closeMenu(); }}
                                className="py-2 px-4 rounded-full text-base font-semibold text-error hover:bg-surfaceMuted text-left"
                            >
                                Cerrar sesión
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
