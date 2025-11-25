import { useEffect, useState, type FC } from "react";
import Header from "@/components/Header";
import ActionCard from "@/components/ui/ActionCard";
import EventCard from "@/components/ui/EventCard";
import Footer from "@/components/Footer";
import EventModal from "@/components/ui/EventModal";
import { listEventos, getMyEventos, type ApiEvento } from "@/api/eventos";
import { useAuth } from "@/context/AuthContext";
import { HousePlus, CarFront, Home, CalendarClock } from "lucide-react";


const Inicio: FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ApiEvento | null>(null);
    const [eventos, setEventos] = useState<ApiEvento[]>([]);
    const [misEventos, setMisEventos] = useState<ApiEvento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token, user } = useAuth();

    const loadEventos = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await listEventos({ estado: "PUBLICADO" }, token ?? undefined);
            setEventos(data);
        } catch (e: any) {
            setError(e.message ?? "Error al cargar eventos");
        } finally {
            setLoading(false);
        }
    };

    const loadMisEventos = async () => {
        if (!token) {
            setMisEventos([]);
            return;
        }

        try {
            const data = await getMyEventos(token);
            setMisEventos(data);
        } catch (e: any) {
            console.error("Error al cargar mis eventos:", e);
        }
    };

    useEffect(() => {
        void loadEventos();
        void loadMisEventos();
    }, [token]);


    const handleOpenModal = (evento: ApiEvento) => {
        setSelectedEvent(evento);
        setShowModal(true);
    };

    const handleUpdateEventos = () => {
        void loadEventos();
        void loadMisEventos();
    };

    return (
        <div className="rc-page">
            <Header />

            <main className="flex-1 rc-shell py-10 space-y-10">

                <h1 className="rc-hero-title">
                    Bienvenido/a a Rural Connect
                </h1>
                <p className="rc-hero-subtitle">
                    Reserva espacios, consulta todas las actividades de la peña,
                    comparte coche y planifica tu viaje con otros socios
                </p>

                <div className="grid gap-6 md:grid-cols-3 mb-10">
                    <ActionCard
                        icon={<HousePlus size={36} className="text-black/90" />}
                        title="Reservar Espacio"
                        description="Comedor, pistas deportivas..."
                        buttonText="Ver Espacios Disponibles"
                        href="/ReservarEspacio"
                    />
                    <ActionCard
                        icon={<CarFront size={36} className="text-black/90" />}
                        title="Compartir coche"
                        description="Viajes pueblo - ciudad y viceversa"
                        buttonText="Ver Viajes Disponibles"
                        href="/CompartirCoche"
                    />
                    <ActionCard
                        icon={<Home size={36} className="text-black/90" />}
                        title="Rural Connect"
                        description="Descubre Rural Connect"
                        buttonText="Descubre Rural Connect"
                        href="/AsociacionMosquitos"
                    />
                </div>

                {/* Mis Eventos - Solo si está logueado */}
                {user && misEventos.length > 0 && (
                    <div className="rc-card-section mb-10">
                        <h2 className="flex items-center text-lg font-semibold mb-4">
                            <CalendarClock size={36} strokeWidth={2} className="mr-2" />
                            Mis eventos
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {misEventos.map((evento) => {
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
                                        apuntados={evento.apuntados}
                                        aforo={evento.aforo}
                                        isJoined={true}
                                        // Forzamos isJoined en el objeto pasado al modal, por si viene sin esa flag
                                        onClick={() => handleOpenModal({ ...evento, isJoined: true })}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="rc-card-section">
                    <h2 className="flex items-center text-lg font-semibold mb-4">
                        <CalendarClock size={36} strokeWidth={2} className="mr-2" />
                        Próximos eventos
                    </h2>

                    {loading && <p>Cargando eventos...</p>}
                    {error && <p className="text-error">{error}</p>}

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
                                        apuntados={evento.apuntados}
                                        aforo={evento.aforo}
                                        isJoined={evento.isJoined}
                                        onClick={() => handleOpenModal(evento)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {showModal && selectedEvent && (
                <EventModal
                    event={{
                        id: selectedEvent.id,
                        title: selectedEvent.titulo,
                        date: new Date(selectedEvent.fecha).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        location: selectedEvent.lugar ?? "",
                        apuntados: selectedEvent.apuntados,
                        aforo: selectedEvent.aforo,
                        isJoined: selectedEvent.isJoined,
                        misAsistentes: selectedEvent.misAsistentes,
                    }}
                    onUpdate={handleUpdateEventos}
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
