import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/button';

const bgHero = new URL('../assets/Campos.jpg', import.meta.url).href;       // fondo
const logoRC = new URL('../assets/RuralConnect.png', import.meta.url).href;  // logo

export default function Home() {
    const navigate = useNavigate();

    const handleAccess = () => {
        navigate('/Login');
    };

    return (
        <div className="relative min-h-dvh overflow-hidden">
            {/* Fondo principal */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgHero})` }}
                aria-hidden="true"
            />

            {/* Capa difuminada + aclarado */}
            <div className="absolute inset-0 bg-white/65 backdrop-blur-[2px]" aria-hidden="true" />

            {/* Contenido */}
            <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4">
                {/* Logo más grande */}
                <img
                    src={logoRC}
                    alt="Rural Connect Burgos"
                    className="w-[720px] max-w-[92vw] mb-8 select-none"
                    draggable={false}
                />

                {/* Botón ligeramente más cerca */}
                <div className="w-full max-w-sm px-4 mb-20">
                    <Button
                        onClick={handleAccess}
                        className="w-full rounded-xl py-5 text-xl font-semibold"
                    >
                        ACCEDER
                    </Button>
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 text-center text-xs text-gray-600">
                    <p>Rural Connect – Conectando entornos rurales</p>
                    <p className="mt-1">© 2025 Susinos del Páramo</p>
                </div>
            </div>
        </div>
    );
}
