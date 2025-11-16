import { useEffect, useState, type FC } from "react";
import Header from "@/components/Header";
import NavMenu from "@/components/NavMenu";
import ActionCard from "@/components/ui/ActionCard";
import EventCard from "@/components/ui/EventCard";
import Footer from "@/components/Footer";
import EventModal from "@/components/ui/EventModal";
import { listEventos, type ApiEvento } from "@/api/eventos";


const Inicio: FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<{
        id: string;
        title: string;
        date: string;
        location: string;
    } | null>(null);
    const [eventos, setEventos] = useState<ApiEvento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadEventos = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await listEventos({ estado: "PUBLICADO" });
                setEventos(data);
            } catch (e: any) {
                setError(e.message ?? "Error al cargar eventos");
            } finally {
                setLoading(false);
            }
        };
        void loadEventos();
    }, []);


    const handleOpenModal = (event: { id: string; title: string; date: string; location: string }) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-black">
            <Header />
            <NavMenu />

            <main className="flex-1 px-4 md:px-10 mt-6">
                
                <h1 className="text-center text-2xl md:text-3xl font-bold mb-2">
                    Bienvenido a Rural Connect
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

                    {loading && <p>Cargando eventos...</p>}
                    {error && <p className="text-red-600">{error}</p>}

                    {!loading && !error && eventos.length === 0 && (
                        <p>No hay eventos publicados por ahora.</p>
                    )}

                    {!loading && !error && eventos.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {eventos.map((evento) => {
                                const fechaObj = new Date(evento.fecha);
                                const date = fechaObj.toLocaleDateString("es-ES", {
                                    weekday: "long",
                                    day: "2-digit",
                                    month: "long",
                                });
                                const time = fechaObj.toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                });

                                return (
                                    <EventCard
                                        key={evento.id}
                                        title={evento.titulo}
                                        date={date}
                                        time={time}
                                        location={evento.lugar ?? ""}
                                        onClick={() =>
                                            handleOpenModal({
                                                id: evento.id,
                                                title: evento.titulo,
                                                date: `${date} - ${time}`,
                                                location: evento.lugar ?? "",
                                            })
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
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

export default Inicio;
