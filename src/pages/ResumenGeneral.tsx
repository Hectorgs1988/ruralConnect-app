import { useEffect, useState, type FC } from "react";
import Header from "@/components/Header";
import NavMenu from "@/components/NavMenu";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getResumenDashboard, type ResumenStats } from "@/api/dashboard";


const ResumenGeneral: FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<ResumenStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setStats(null);
            setError("Debes iniciar sesion como admin.");
            return;
        }

        const fetchResumen = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getResumenDashboard(token);
                setStats(data);
            } catch (err: any) {
                setError(err?.message ?? "Error al cargar el resumen general");
                setStats(null);
            } finally {
                setLoading(false);
            }
        };

        void fetchResumen();
    }, [token]);

    return (
        <div className="rc-page">
            <Header />
            <NavMenu />

            <main className="flex-1 rc-shell py-10 space-y-8">
                <h1 className="rc-hero-title">Resumen general de la asociación</h1>
                <p className="rc-hero-subtitle">
                    Visión global de actividades, socios y estadísticas
                </p>

                <section className="rc-shell grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)] gap-6 items-stretch">
                    {/* Tarjeta de totales */}
                    <div className="rc-card-section flex flex-col justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted mb-2">Visión rápida</p>
                            <h2 className="text-lg font-semibold mb-4">Indicadores generales</h2>
                        </div>
                        <div className="space-y-1.5 text-sm">
                            <p>
                                <span className="font-medium">Socios totales:</span>{" "}
                                <span className="text-muted">{stats?.sociosTotales ?? "-"}</span>
                            </p>
                            <p>
                                <span className="font-medium">Eventos publicados:</span>{" "}
                                <span className="text-muted">{stats?.eventosPublicados ?? "-"}</span>
                            </p>
                            <p>
                                <span className="font-medium">Viajes compartidos:</span>{" "}
                                <span className="text-muted">{stats?.viajesCompartidos ?? "-"}</span>
                            </p>
                            <p>
                                <span className="font-medium">Socios activos:</span>{" "}
                                <span className="text-muted">{stats?.sociosActivos ?? "-"}</span>
                            </p>
                            <p>
                                <span className="font-medium">Reservas totales:</span>{" "}
                                <span className="text-muted">{stats?.reservasTotales ?? "-"}</span>
                            </p>
                            <p>
                                <span className="font-medium">Espacios disponibles:</span>{" "}
                                <span className="text-muted">{stats?.espaciosDisponibles ?? "-"}</span>
                            </p>
                        </div>
                    </div>

                    {/* Ultimos eventos */}
                    <section className="rc-card-section flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-sm">Últimos eventos</h2>
                            <span className="text-[11px] text-muted">Máx. 5 más recientes</span>
                        </div>
                        <div className="border-t border-borderSoft text-xs mt-2 pt-2 flex-1">
                            <div className="grid grid-cols-3 font-semibold mb-2 text-[11px] text-muted">
                                <span>Evento</span>
                                <span>Fecha</span>
                                <span>Estado</span>
                            </div>
                            <div className="space-y-1.5">
                                {stats?.ultimosEventos?.length ? (
                                    stats.ultimosEventos.map((ev) => (
                                        <div key={ev.id} className="grid grid-cols-3 text-xs">
                                            <span className="truncate pr-2">{ev.titulo}</span>
                                            <span>{new Date(ev.fecha).toLocaleDateString("es-ES")}</span>
                                            <span>{ev.estado}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted text-xs mt-2">
                                        No hay eventos registrados.
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Ultimos socios */}
                    <section className="rc-card-section flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-sm">Últimos socios</h2>
                            <span className="text-[11px] text-muted">Altas más recientes</span>
                        </div>
                        <div className="border-t border-borderSoft text-xs mt-2 pt-2 flex-1">
                            <div className="grid grid-cols-3 font-semibold mb-2 text-[11px] text-muted">
                                <span>Nombre</span>
                                <span>Email</span>
                                <span>Rol</span>
                            </div>
                            <div className="space-y-1.5">
                                {stats?.ultimosSocios?.length ? (
                                    stats.ultimosSocios.map((s) => (
                                        <div key={s.id} className="grid grid-cols-3 text-xs">
                                            <span className="truncate pr-2">{s.name}</span>
                                            <span className="truncate pr-2">{s.email}</span>
                                            <span>{s.role === "ADMIN" ? "Admin" : "Socio"}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted text-xs mt-2">
                                        No hay socios registrados.
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                </section>

                {error && (
                    <p className="text-center text-error text-sm mb-4">{error}</p>
                )}
                {loading && !error && (
                    <p className="text-center text-muted text-sm mb-4">Cargando resumen...</p>
                )}

                {/* Botones inferiores */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 justify-center mt-6">
                    <Button
                        type="button"
                        variant="secondary"
                        className="rc-btn-primary"
                        onClick={() => navigate("/GestionSocio")}
                    >
                        Gestionar socios
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="rc-btn-primary"
                        onClick={() => navigate("/GestionEventos")}
                    >
                        Gestionar eventos
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="rc-btn-primary"
                        onClick={() => navigate("/ReservarEspacio")}
                    >
                        Ver reservas
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="rc-btn-primary"
                        onClick={() => navigate("/CompartirCoche")}
                    >
                        Ver viajes
                    </Button>
                </div>
            </main>

            <Footer />
        </div>
    );
};


export default ResumenGeneral;

