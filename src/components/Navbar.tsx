import type { FC } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
    { name: "Inicio", path: "/inicio" },
    { name: "ReservarEspacio", path: "/ReservarEspacio" },
    { name: "CompartirCoche", path: "/CompartirCoche" },
    { name: "Asociación \"Los Mosquitos\"", path: "/AsociacionMosquitos" },
];

const Navbar: FC = () => {
    const location = useLocation();

    return (
        <aside className="w-52 bg-white border-r border-gray-200 h-screen p-4 flex flex-col justify-between">
            <div>
                <div className="mb-8">
                    <img src="src/assets/susinosLogo.png" alt="Logo" className="mb-6 w-24 h-24" />
                    <h1 className="text-sm font-semibold text-center mt-2">Los Mosquitos</h1>
                    <p className="text-xs text-center text-gray-500">Susinos del Páramo</p>
                </div>

                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`text-sm p-2 rounded hover:bg-yellow-200 transition ${location.pathname === item.path ? "bg-yellow-300 font-medium" : ""
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="text-center text-xs text-gray-400 mt-4">
                {/* Aquí puedes añadir versión, logout, etc. */}
            </div>
        </aside>
    );
};

export default Navbar;
