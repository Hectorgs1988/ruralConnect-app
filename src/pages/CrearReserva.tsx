import { Utensils, Dumbbell, Users, Dribbble, BadgePercent, Landmark } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavMenu from '@/components/NavMenu';

const CrearReserva = () => {
    return (
        <div className="min-h-screen bg-background text-black flex flex-col">
            <Header />
            <NavMenu />
            <main className="flex-grow container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-center mb-2">Reserva de espacios</h2>
                <p className="text-center text-gray-700 mb-8">
                    Reserva los espacios comunes de la asociación para tus eventos y actividades
                </p>
            </main>
            <Footer />
        </div>
    );
};

export default CrearReserva;
