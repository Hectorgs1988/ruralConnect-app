import { useState, type FC } from "react";
import Header from "@/components/Header";
import NavMenu from "@/components/NavMenu";
import ActionCard from "@/components/ui/ActionCard";
import EventCard from "@/components/ui/EventCard";
import Footer from "@/components/Footer";
import EventModal from "@/components/ui/EventModal";

const PanelAdmin: FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<{
        title: string;
        date: string;
        location: string;
    } | null>(null);

    const handleOpenModal = (event: { title: string, date: string, location: string }) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-black">
            <Header />
            <NavMenu />

            <main className="flex-1 px-4 md:px-10 mt-6">
                <h1 className="text-center text-2xl md:text-3xl font-bold mb-2">
                    Bienvenido a la asociación "Los Mosquitos"
                </h1>
                <p className="text-center text-sm md:text-base text-muted-foreground mb-8">
                    Reserva espacios, consulta todas las actividades de la peña,
                    comparte coche y planifica tu viaje con otros socios
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center mb-10">
                    <ActionCard
                        icon=""
                        title="Reservar Espacio"
                        description="Comedor, pistas deportivas..."
                        buttonText="Ver Espacios Disponibles"
                        href="/ReservarEspacio"
                    />
                    <ActionCard
                        icon=""
                        title="Compartir coche"
                        description="Viajes pueblo - ciudad y viceversa"
                        buttonText="Ver Viajes Disponibles"
                        href="/CompartirCoche"
                    />
                    <ActionCard
                        icon=""
                        title="La asociación"
                        description="Descubre la asociación Los mosquitos"
                        buttonText="Los mosquitos"
                        href="/AsociacionMosquitos"
                    />
                </div>

                <div className="bg-white rounded-xl p-4 shadow w-full max-w-6xl mx-auto">
                    <h2 className="flex items-center text-lg font-semibold mb-4">
                        <span className="mr-2">⏰</span> Próximos eventos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <EventCard
                            title="Comida de San Vicente"
                            date="Sábado 15 de Enero - 15:00h"
                            location="Escuela"
                            onClick={() =>
                                handleOpenModal({
                                    title: "Comida de San Vicente",
                                    date: "Sábado 15 de Enero - 15:00h",
                                    location: "Escuela",
                                })
                            }
                        />
                        <EventCard
                            title="Paella inicio verano"
                            date="Sábado 12 de Julio - 15:00h"
                            location="Polideportivo"
                            onClick={() =>
                                handleOpenModal({
                                    title: "Paellada",
                                    date: "Sábado 12 de Julio - 15:00h",
                                    location: "Polideportivo",
                                })
                            }
                        />
                        <EventCard
                            title="Mariscada"
                            date="Sábado 19 de Julio - 15:00h"
                            location="Bolera"
                            onClick={() =>
                                handleOpenModal({
                                    title: "Mariscada",
                                    date: "Sábado 19 de Julio - 15:00h",
                                    location: "Bolera",
                                })
                            }
                        />
                    </div>
                </div>
            </main>
            {showModal && selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedEvent(null);
                    }}
                />
            )}

            <Footer />
        </div>
    );
};

export default PanelAdmin;
