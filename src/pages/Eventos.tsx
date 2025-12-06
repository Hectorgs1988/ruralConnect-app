import { useEffect, useState, type FC } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventCard from "@/components/ui/EventCard";
import EventModal from "@/components/ui/EventModal";
import { listEventos, getMyEventos, type ApiEvento } from "@/api/eventos";
import { useAuth } from "@/context/AuthContext";
import { CalendarClock } from "lucide-react";

const Eventos: FC = () => {
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
    } catch (e) {
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

      <main className="flex-1 rc-shell py-10 space-y-8">
        <h2 className="rc-hero-title">Eventos</h2>
        <p className="rc-hero-subtitle">
          Consulta todas las actividades de la peña y apúntate a las que te interesen.
        </p>

        {user && misEventos.length > 0 && (
          <section className="rc-card-section">
            <h3 className="flex items-center text-lg font-semibold mb-4">
              <CalendarClock size={36} strokeWidth={2} className="mr-2" />
              Mis eventos
            </h3>

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
                    onClick={() => handleOpenModal({ ...evento, isJoined: true })}
                  />
                );
              })}
            </div>
          </section>
        )}

        <section className="rc-card-section">
          <h3 className="flex items-center text-lg font-semibold mb-4">
            <CalendarClock size={36} strokeWidth={2} className="mr-2" />
            Próximos eventos
          </h3>

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
        </section>
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

export default Eventos;

