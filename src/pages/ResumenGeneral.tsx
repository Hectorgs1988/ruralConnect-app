import { useEffect, useState, type FC } from "react";
import Header from "@/components/Header";
import NavMenu from "@/components/NavMenu";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";


type UltimoEvento = {
    id: string;
    titulo: string;
    fecha: string;
    estado: "BORRADOR" | "PUBLICADO" | "CANCELADO";
};

type UltimoSocio = {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "SOCIO";
};

type ResumenStats = {
    sociosTotales: number;
    sociosActivos: number;
    eventosPublicados: number;
    viajesCompartidos: number;
    reservasTotales: number;
    espaciosDisponibles: number;
    ultimosEventos: UltimoEvento[];
    ultimosSocios: UltimoSocio[];
};


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

                const res = await fetch("http://localhost:4000/api/dashboard/resumen", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(text || `Error ${res.status} al cargar el resumen`);
                }

                const data: ResumenStats = await res.json();
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
        <div className="min-h-screen flex flex-col bg-background text-black">
            <Header />
            <NavMenu />

            <main className="flex-1 px-4 md:px-10 mt-6 mb-10">
                <h1 className="text-center text-2xl md:text-3xl font-bold mb-2">
                    Resumen general de la asociacion
                </h1>
                <p className="text-center text-sm md:text-base text-muted-foreground mb-8">
                    Vision global de actividades, socios y estadisticas
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center mb-10 max-w-6xl mx-auto">
                    {/* Tarjeta de totales */}
                    <div className="bg-[#E5E5E5] rounded-xl px-8 py-6 min-w-[260px]">
                        <p className="font-semibold mb-2">Socios totales: <span className="font-normal">{stats?.sociosTotales ?? "-"}</span></p>
                        <p className="font-semibold mb-2">Eventos publicados: <span className="font-normal">{stats?.eventosPublicados ?? "-"}</span></p>
                        <p className="font-semibold mb-2">Viajes compartidos: <span className="font-normal">{stats?.viajesCompartidos ?? "-"}</span></p>
                        <p className="font-semibold mb-2">Socios activos: <span className="font-normal">{stats?.sociosActivos ?? "-"}</span></p>
                        <p className="font-semibold mb-2">Reservas totales: <span className="font-normal">{stats?.reservasTotales ?? "-"}</span></p>
                        <p className="font-semibold">Espacios disponibles: <span className="font-normal">{stats?.espaciosDisponibles ?? "-"}</span></p>
                    </div>

                    {/* Ultimos eventos */}
                    <div className="bg-[#F5F5F5] rounded-xl px-6 py-5 flex-1 min-w-[260px]">
                        <h2 className="font-semibold mb-3">Ultimos eventos</h2>
                        <div className="border-t border-black text-sm mt-2 pt-2">
                            <div className="grid grid-cols-3 font-semibold mb-2">
                                <span>Evento</span>
                                <span>Fecha</span>
                                <span>Estado</span>
                            </div>
                            <div className="space-y-1">
                                {stats?.ultimosEventos?.length ? (
                                    stats.ultimosEventos.map((ev) => (
                                        <div key={ev.id} className="grid grid-cols-3 text-sm">
                                            <span className="truncate pr-2">{ev.titulo}</span>
                                            <span>{new Date(ev.fecha).toLocaleDateString("es-ES")}</span>
                                            <span>{ev.estado}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm mt-2">No hay eventos registrados.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ultimos socios */}
                    <div className="bg-[#F5F5F5] rounded-xl px-6 py-5 flex-1 min-w-[260px]">
                        <h2 className="font-semibold mb-3">Ultimos socios</h2>
                        <div className="border-t border-black text-sm mt-2 pt-2">
                            <div className="grid grid-cols-3 font-semibold mb-2">
                                <span>Nombre</span>
                                <span>Email</span>
                                <span>Rol</span>
                            </div>
                            <div className="space-y-1">
                                {stats?.ultimosSocios?.length ? (
                                    stats.ultimosSocios.map((s) => (
                                        <div key={s.id} className="grid grid-cols-3 text-sm">
                                            <span className="truncate pr-2">{s.name}</span>
                                            <span className="truncate pr-2">{s.email}</span>
                                            <span>{s.role === "ADMIN" ? "Admin" : "Socio"}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm mt-2">No hay socios registrados.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-center text-red-600 text-sm mb-4">{error}</p>
                )}
                {loading && !error && (
                    <p className="text-center text-gray-500 text-sm mb-4">Cargando resumen...</p>
                )}

                {/* Botones inferiores */}
                <div className="flex flex-col md:flex-row gap-3 justify-center mt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        className="bg-[#E5E5E5] border-none px-6"
                        onClick={() => navigate("/GestionSocio")}
                    >
                        Gestionar socios
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="bg-[#E5E5E5] border-none px-6"
                        onClick={() => navigate("/GestionEventos")}
                    >
                        Gestionar eventos
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="bg-[#E5E5E5] border-none px-6"
                        onClick={() => navigate("/ReservarEspacio")}
                    >
                        Ver reservas
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="bg-[#E5E5E5] border-none px-6"
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

