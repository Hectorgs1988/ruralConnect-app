import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Utensils, Dumbbell, BadgePercent, Landmark } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReservationCard from "@/components/ui/ReservationCard";
import type { Espacio } from "@/types/Espacio";
import { listEspacios } from "@/api/espacios";

const iconByTipo: Record<string, JSX.Element> = {
    comedor: <Utensils size={28} />,
    cocina: <Utensils size={28} />,
    horno: <Utensils size={28} />,
    gimnasio: <Dumbbell size={28} />,
    padel: <Dumbbell size={28} />,
    tenis: <BadgePercent size={28} />,
    polideportivo: <Landmark size={28} />,
};

const ReservasEspacio = () => {
    const navigate = useNavigate();
    const [espacios, setEspacios] = useState<Espacio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar desde API
    useEffect(() => {
        let alive = true;
        setLoading(true);

        const fetchEspacios = async () => {
            try {
                const data = await listEspacios();
                if (!alive) return;
                setEspacios(data);
                setError(null);
            } catch (err: any) {
                if (!alive) return;
                setError(err?.message ?? "Error al cargar los espacios");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        };

        void fetchEspacios();

        return () => {
            alive = false;
        };
    }, []);

    const goToCrear = (espacio: Espacio) => {
        // pasamos id + datos para el formulario de crear reserva
        navigate("/CrearReserva", { state: { espacio } });
    };

    const content = useMemo(() => {
        if (loading) return <p className="text-center text-muted">Cargando espacios…</p>;
        if (error) return <p className="text-center text-error font-medium">Error: {error}</p>;
        if (!espacios.length) return <p className="text-center text-muted">No hay espacios aún.</p>;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                {espacios.map((e) => {
                    const icon =
                        iconByTipo[e.tipo?.toLowerCase()] ??
                        <Landmark size={28} />; // icono por defecto
                    const capacity = e.aforo != null ? `${e.aforo} personas` : "—";
                    const descripcion = `Descripción: ${e.descripcion} · Tipo: ${e.tipo}`;

                    return (
                        <ReservationCard
                            key={e.id}
                            title={e.nombre}
                            icon={icon}
                            capacity={capacity}
                            description={descripcion}
                            onClick={() => goToCrear(e)}
                        />
                    );
                })}
            </div>
        );
    }, [espacios, loading, error]);

    return (
        <div className="rc-page">
            <Header />
            <main className="flex-1 rc-shell py-10 space-y-8">
                <h2 className="rc-hero-title">Reserva de espacios</h2>
                <p className="rc-hero-subtitle">
                    Reserva los espacios comunes de la asociación para tus eventos y actividades
                </p>

                <section className="rc-card-section">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-dark flex items-center gap-2">
                            <span className="text-xl">📍</span>
                            Espacios disponibles
                        </h3>
                        <p className="text-xs text-muted">
                            Selecciona un espacio para ver horarios y crear una reserva.
                        </p>
                    </div>
                    {content}
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default ReservasEspacio;
