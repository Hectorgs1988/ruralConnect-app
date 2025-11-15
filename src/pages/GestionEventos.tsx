import type { FC } from "react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import NavMenu from "@/components/NavMenu";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import NuevoEventoModal from "@/components/ui/NuevoEventoModal";
import EditarEventoModal from "@/components/ui/EditarEventoModal";
import EliminarEventoModal from "@/components/ui/EliminarEventoModal";
import { useAuth } from "@/context/AuthContext";


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

                const res = await fetch("http://localhost:4000/api/eventos", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(text || `Error ${res.status} al cargar los eventos`);
                }

                type ApiEvento = {
                    id: string;
                    titulo: string;
                    fecha: string;
                    lugar?: string | null;
                    aforo?: number | null;
                    estado: "BORRADOR" | "PUBLICADO" | "CANCELADO";
                    descripcion?: string | null;
                };

                const data: ApiEvento[] = await res.json();

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
        <div className="min-h-screen flex flex-col bg-background text-black">
            <Header />
            <NavMenu />

            <main className="flex-1 px-4 md:px-10 mt-6 mb-10">
                <h1 className="text-center text-2xl md:text-3xl font-bold mb-2">
                    Gestion de eventos
                </h1>
                <p className="text-center text-sm md:text-base text-muted-foreground mb-8">
                    Anadir o modificar eventos de la asociacion
                </p>

                <div className="bg-white rounded-xl p-4 md:p-6 shadow w-full max-w-6xl mx-auto">
                    <div className="flex flex-col gap-4 mb-4 md:mb-6">
                        <h2 className="text-lg font-semibold">Gestion de eventos</h2>
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                            <div className="flex-1 flex items-center bg-[#FAFAF0] border border-gray-300 rounded-md px-3 py-2">
                                <span className="mr-2 text-gray-500">🔍</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por titulo, lugar o estado..."
                                    className="w-full bg-transparent outline-none text-sm"
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
                        <p className="text-sm text-red-600 mb-3">{error}</p>
                    )}
                    {loading && !error && (
                        <p className="text-sm text-gray-500 mb-3">Cargando eventos...</p>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
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
                                        className="border-b border-gray-100 last:border-0"
                                    >
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.titulo}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{new Date(evento.fecha).toLocaleDateString("es-ES")}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.lugar}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.estado}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.aforo != null ? evento.aforo : "-"}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="text-xs text-blue-600 hover:underline mr-2"
                                                onClick={() => setEditingEvento(evento)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs text-red-600 hover:underline"
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
                                            className="py-4 text-center text-gray-500 text-sm"
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

