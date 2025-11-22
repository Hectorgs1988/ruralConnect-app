import type { FC } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { listEspacios } from "@/api/espacios";
import type { Espacio } from "@/types/Espacio";
import NuevoEspacioModal from "@/components/ui/NuevoEspacioModal";
import EditarEspacioModal from "@/components/ui/EditarEspacioModal";
import EliminarEspacioModal from "@/components/ui/EliminarEspacioModal";

const GestionEspacios: FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [showNuevoEspacioModal, setShowNuevoEspacioModal] = useState(false);
    const [espacios, setEspacios] = useState<Espacio[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadFlag, setReloadFlag] = useState(0);
    const [editingEspacio, setEditingEspacio] = useState<Espacio | null>(null);
    const [deletingEspacio, setDeletingEspacio] = useState<Espacio | null>(null);

    useEffect(() => {
        if (!token) {
            setEspacios([]);
            setError("Debes iniciar sesión como admin.");
            return;
        }

        const fetchEspacios = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await listEspacios();
                setEspacios(data);
            } catch (err: any) {
                setError(err?.message ?? "Error al cargar los espacios");
                setEspacios([]);
            } finally {
                setLoading(false);
            }
        };

        void fetchEspacios();
    }, [token, reloadFlag]);

    const espaciosFiltrados = espacios.filter((espacio) => {
        const term = search.toLowerCase();
        if (!term) return true;
        return (
            espacio.nombre.toLowerCase().includes(term) ||
            espacio.tipo.toLowerCase().includes(term) ||
            (espacio.descripcion ?? "").toLowerCase().includes(term) ||
            String(espacio.aforo ?? "").includes(term)
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
                    Gestión de espacios
                </h1>
                <p className="rc-hero-subtitle">
                    Añadir o modificar espacios publicos de la asociación
                </p>

                <div className="rc-card-section w-full">
                    <div className="flex flex-col gap-4 mb-4 md:mb-6">
                        <h2 className="text-base md:text-lg font-semibold text-dark flex items-center gap-2">
                            📅 Gestión de espacios
                        </h2>
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                            <div className="flex-1 flex items-center bg-surfaceMuted border border-borderSoft rounded-full px-4 py-2">
                                <span className="mr-2 text-muted">🔍</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por nombre, tipo, descripción o aforo..."
                                    className="w-full bg-transparent outline-none text-sm text-dark placeholder:text-muted"
                                />
                            </div>
                            <Button
                                type="button"
                                className="self-end md:self-auto flex items-center justify-center gap-2"
                                onClick={() => setShowNuevoEspacioModal(true)}
                            >
                                <span className="text-lg">+</span>
                                <span>Nuevo espacio</span>
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-error mb-3">{error}</p>
                    )}
                    {loading && !error && (
                        <p className="text-sm text-muted mb-3">Cargando espacios...</p>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-borderSoft text-[11px] uppercase tracking-wide text-muted">
                                    <th className="py-2 px-3">Nombre</th>
                                    <th className="py-2 px-3">Tipo</th>
                                    <th className="py-2 px-3">Aforo</th>
                                    <th className="py-2 px-3">Descripción</th>
                                    <th className="py-2 px-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {espaciosFiltrados.map((espacio) => (
                                    <tr
                                        key={espacio.id}
                                        className="border-b border-borderSoft/60 last:border-0"
                                    >
                                        <td className="py-2 px-3 whitespace-nowrap">{espacio.nombre}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{espacio.tipo}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            {espacio.aforo != null ? espacio.aforo : "-"}
                                        </td>
                                        <td className="py-2 px-3 max-w-xs truncate">
                                            {espacio.descripcion ?? ""}
                                        </td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="text-xs text-dark hover:text-primaryStrong mr-2"
                                                onClick={() => setEditingEspacio(espacio)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs text-error hover:underline"
                                                onClick={() => setDeletingEspacio(espacio)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {espaciosFiltrados.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-4 text-center text-muted text-sm"
                                        >
                                            No se han encontrado espacios con ese criterio de busqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <Footer />
            {showNuevoEspacioModal && (
                <NuevoEspacioModal
                    onClose={() => setShowNuevoEspacioModal(false)}
                    onCreated={() => setReloadFlag((v) => v + 1)}
                />
            )}
            {editingEspacio && (
                <EditarEspacioModal
                    espacio={editingEspacio}
                    onClose={() => setEditingEspacio(null)}
                    onUpdated={() => setReloadFlag((v) => v + 1)}
                />
            )}
            {deletingEspacio && (
                <EliminarEspacioModal
                    espacio={deletingEspacio}
                    onClose={() => setDeletingEspacio(null)}
                    onDeleted={() => setReloadFlag((v) => v + 1)}
                />
            )}

        </div>
    );
};


export default GestionEspacios;

