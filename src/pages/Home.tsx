import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/button';

const Home = () => {
    const navigate = useNavigate();

    const handleAccess = () => {
        navigate('/Login');
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4">
            <img src="src/assets/susinosLogo.png" alt="Logo" className="mb-6 w-24 h-24" />
            <h1 className="text-2xl font-semibold text-center mb-4">
                Bienvenido a la peña <br /> Los Mosquitos
            </h1>

            {/* Contenedor del botón */}
            <div className="p-6 rounded-lg w-full max-w-sm">
                <Button type="button" className="w-full" onClick={handleAccess}>
                    Acceder
                </Button>
            </div>

            <p className="mt-10 text-sm text-gray-500">Peña Los Mosquitos - Susinos del Páramo</p>
            <p className="text-sm text-gray-500">© 2025 desde Susinos del Páramo con amor</p>
        </div>
    );
};

export default Home;
