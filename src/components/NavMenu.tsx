// src/components/ui/NavMenu.tsx
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const NavMenu = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const navItems = [
        { to: '/inicio', label: 'Inicio' },
        { to: '/ReservarEspacio', label: 'ReservarEspacio' },
        { to: '/CompartirCoche', label: 'CompartirCoche' },
        { to: '/AsociacionMosquitos', label: 'AsociacionMosquitos' },
    ];

    return (
        <nav className="w-full px-4 py-2 md:flex md:justify-center md:space-x-4 bg-white border-b border-yellow-400">
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="px-4 py-2 rounded-md hover:bg-yellow-100"
                    >
                        {item.label}
                    </Link>
                ))}
            </div>

            {/* Mobile Menu Icon */}
            <div className="flex justify-between items-center md:hidden">
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
                                className="py-2 px-4 rounded hover:bg-yellow-100"
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
