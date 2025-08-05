import { Utensils, Dumbbell, Users, Dribbble, BadgePercent, Landmark } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavMenu from '@/components/NavMenu';
import ReservationCard from '@/components/ui/ReservationCard';

const ReservasEspacio = () => {
    return (
        <div className="min-h-screen bg-background text-black flex flex-col">
            <Header />
            <NavMenu />

            <main className="flex-grow container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-center mb-2">Reserva de espacios</h2>
                <p className="text-center text-gray-700 mb-8">
                    Reserva los espacios comunes de la asociación para tus eventos y actividades
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                    <ReservationCard
                        title="Cocosa"
                        icon={<Utensils size={28} />}
                        capacity="100 personas"
                        description="Espacio con capacidad máxima de unos 100 comensales, cuenta con cocina industrial totalmente equipada."
                    />
                    <ReservationCard
                        title="Horno del 'Potro'"
                        icon={<Utensils size={28} />}
                        capacity="5-6 personas"
                        description="Horno de leña y pequeño espacio para 5-6 personas."
                    />
                    <ReservationCard
                        title="Gimnasio"
                        icon={<Dumbbell size={28} />}
                        capacity="10 personas"
                        description="Gimnasio completo con máquinas, mancuernas y pesas."
                    />
                    <ReservationCard
                        title="Pista de pádel"
                        icon={<Dribbble size={28} />}
                        capacity="4 personas"
                        description="Pista de pádel cubierta."
                    />
                    <ReservationCard
                        title="Pista de tenis"
                        icon={<BadgePercent size={28} />}
                        capacity="4 personas"
                        description="Pista de tenis al aire libre."
                    />
                    <ReservationCard
                        title="Polideportivo"
                        icon={<Landmark size={28} />}
                        capacity="30 personas"
                        description="Polideportivo que cuenta con campo de fútbol, baloncesto y frontón."
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ReservasEspacio;
