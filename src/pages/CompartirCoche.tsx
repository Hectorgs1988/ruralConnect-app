
import { useState } from 'react';
import type { Travel } from '@/types/Travel';
import ShareCarCard from '@/components/ui/ShareCarCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavMenu from '@/components/NavMenu';
import OfferTravelModal from '@/components/ui/OfferTravelModal';
import Button from '@/components/ui/button';
import JoinTripModal from '@/components/ui/JoinTripModal';

const CompartirCoche = () => {
    const [showModal, setShowModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
    const [travels, setTravels] = useState([
        {
            name: "Pedro García",
            car: "Volkswagen Golf azul",
            from: "Burgos",
            to: "Susinos del Páramo",
            date: "Sábado 12 de Julio 2025",
            time: "10:00h",
            phone: "637915472",
            occupancy: "1/4 plazas"
        }
    ]);

    const handleAddTravel = (newTravel: Travel) => {
        setTravels((prev) => [...prev, newTravel]);
        setShowModal(false);
    };

    const openJoin = (travel: Travel) => {
        setSelectedTravel(travel);
        setShowJoinModal(true);
    };


    return (
        <div className="min-h-screen bg-background text-black flex flex-col">
            <Header />
            <NavMenu />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="flex justify-end mb-4">
                    <Button onClick={() => setShowModal(true)} type="submit" className="px-4 py-2 font-semibold rounded">
                        + Ofrecer viaje
                    </Button>
                </div>
                <h2 className="text-3xl font-bold text-center mb-2">Compartir coche</h2>
                <p className="text-center text-gray-700 mb-8">
                    Contacta con otros socios para compartir viaje entre Susinos y la ciudad o la ciudad y Susinos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                    {travels.map((travel, index) => (
                        <ShareCarCard key={index} {...travel} />
                    ))}
                </div>
            </main>
            <Footer />
            {showModal && (
                <OfferTravelModal onClose={() => setShowModal(false)} onSubmit={handleAddTravel} />
            )}
        </div>
    );
};

export default CompartirCoche;
