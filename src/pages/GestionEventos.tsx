import type { FC } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import NuevoEventoModal from "@/components/ui/NuevoEventoModal";
import EditarEventoModal from "@/components/ui/EditarEventoModal";
import EliminarEventoModal from "@/components/ui/EliminarEventoModal";
import { useAuth } from "@/context/AuthContext";
import { listEventos } from "@/api/eventos";


type Evento = {
    id: string;
    titulo: string;
    fecha: string; // ISO string
    lugar: string;
    estado: "BORRADOR" | "PUBLICADO" | "CANCELADO";
    aforo: number | null;
    descripcion: string;
};



const GestionEventos: FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [showNuevoEventoModal, setShowNuevoEventoModal] = useState(false);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadFlag, setReloadFlag] = useState(0);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [deletingEvento, setDeletingEvento] = useState<Evento | null>(null);

    useEffect(() => {
        if (!token) {
            setEventos([]);
            setError("Debes iniciar sesion como admin.");
            return;
        }

        const fetchEventos = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await listEventos({}, token);

                const mapped: Evento[] = data.map((e) => ({
                    id: e.id,
                    titulo: e.titulo,
                    fecha: e.fecha,
                    lugar: e.lugar ?? "",
                    estado: e.estado,
                    aforo: e.aforo ?? null,
                    descripcion: e.descripcion ?? "",
                }));

                setEventos(mapped);
            } catch (err: any) {
                setError(err?.message ?? "Error al cargar los eventos");
                setEventos([]);
            } finally {
                setLoading(false);
            }
        };

        void fetchEventos();
    }, [token, reloadFlag]);

    const eventosFiltrados = eventos.filter((evento) => {
        const term = search.toLowerCase();
        if (!term) return true;
        return (
            evento.titulo.toLowerCase().includes(term) ||
            evento.lugar.toLowerCase().includes(term) ||
            evento.estado.toLowerCase().includes(term) ||
            String(evento.aforo ?? "").includes(term)
        );
    });

    return (
        <div className="rc-page">
            <Header />

            <main className="flex-1 rc-shell py-10 space-y-8 mb-10">
                <Button
                    type="button"
                    onClick={() => navigate("/PanelAdmin")}
                    className="mb-4 text-sm px-3 py-1 rounded-full border border-borderSoft bg-surface hover:bg-surfaceMuted transition-colors"
                >
                    ← Volver al panel de administración
                </Button>
                <h1 className="rc-hero-title">
                    Gestión de eventos
                </h1>
                <p className="rc-hero-subtitle">
                    Añadir o modificar eventos de la asociación
                </p>

                <div className="rc-card-section w-full">
                    <div className="flex flex-col gap-4 mb-4 md:mb-6">
                        <h2 className="text-base md:text-lg font-semibold text-dark flex items-center gap-2">
                            📅 Gestión de eventos
                        </h2>
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                            <div className="flex-1 flex items-center bg-surfaceMuted border border-borderSoft rounded-full px-4 py-2">
                                <span className="mr-2 text-muted">🔍</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por titulo, lugar o estado..."
                                    className="w-full bg-transparent outline-none text-sm text-dark placeholder:text-muted"
                                />
                            </div>
                            <Button
                                type="button"
                                className="self-end md:self-auto flex items-center justify-center gap-2"
                                onClick={() => setShowNuevoEventoModal(true)}
                            >
                                <span className="text-lg">+</span>
                                <span>Nuevo evento</span>
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-error mb-3">{error}</p>
                    )}
                    {loading && !error && (
                        <p className="text-sm text-muted mb-3">Cargando eventos...</p>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-borderSoft text-[11px] uppercase tracking-wide text-muted">
                                    <th className="py-2 px-3">Titulo</th>
                                    <th className="py-2 px-3">Fecha</th>
                                    <th className="py-2 px-3">Lugar</th>
                                    <th className="py-2 px-3">Estado</th>
                                    <th className="py-2 px-3">Aforo</th>
                                    <th className="py-2 px-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eventosFiltrados.map((evento) => (
                                    <tr
                                        key={evento.id}
                                        className="border-b border-borderSoft/60 last:border-0"
                                    >
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.titulo}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{new Date(evento.fecha).toLocaleDateString("es-ES")}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.lugar}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.estado}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.aforo != null ? evento.aforo : "-"}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="text-xs text-dark hover:text-primaryStrong mr-2"
                                                onClick={() => setEditingEvento(evento)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs text-error hover:underline"
                                                onClick={() => setDeletingEvento(evento)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {eventosFiltrados.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-4 text-center text-muted text-sm"
                                        >
                                            No se han encontrado eventos con ese criterio de busqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <Footer />
            {showNuevoEventoModal && (
                <NuevoEventoModal
                    onClose={() => setShowNuevoEventoModal(false)}
                    onCreated={() => setReloadFlag((v) => v + 1)}
                />
            )}
            {editingEvento && (
                <EditarEventoModal
                    evento={editingEvento}
                    onClose={() => setEditingEvento(null)}
                    onUpdated={() => setReloadFlag((v) => v + 1)}
                />
            )}
            {deletingEvento && (
                <EliminarEventoModal
                    evento={deletingEvento}
                    onClose={() => setDeletingEvento(null)}
                    onDeleted={() => setReloadFlag((v) => v + 1)}
                />
            )}

        </div>
    );
};


export default GestionEventos;

