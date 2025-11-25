import type { FC } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import NuevoSocioModal from "@/components/ui/NuevoSocioModal";
import EditarSocioModal from "@/components/ui/EditarSocioModal";
import EliminarSocioModal from "@/components/ui/EliminarSocioModal";
import { useAuth } from "@/context/AuthContext";
import ImportarSociosModal from "@/components/ui/ImportarSociosModal";

import { listUsers } from "@/api/users";


type Socio = {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    rol: "Admin" | "Socio";
    fechaIngreso: string;
};


const GestionSocio: FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [showNuevoSocioModal, setShowNuevoSocioModal] = useState(false);
    const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
    const [deletingSocio, setDeletingSocio] = useState<Socio | null>(null);
    const [socios, setSocios] = useState<Socio[]>([]);
    const [totalSocios, setTotalSocios] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showImportarSociosModal, setShowImportarSociosModal] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [reloadFlag, setReloadFlag] = useState(0);

    useEffect(() => {
        if (!token) {
            setSocios([]);
            setError("Debes iniciar sesion como admin.");
            return;
        }

        const fetchSocios = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await listUsers({ active: true, page: 1, size: 100 }, token);

                const mapped: Socio[] = data.items.map((u) => ({
                    id: u.id,
                    nombre: u.name,
                    email: u.email,
                    telefono: u.phone ?? "",
                    rol: u.role === "ADMIN" ? "Admin" : "Socio",
                    fechaIngreso: new Date(u.createdAt).toLocaleDateString("es-ES"),
                }));

                setSocios(mapped);
                setTotalSocios(data.total);
            } catch (err: any) {
                setError(err?.message ?? "Error al cargar los socios");
                setSocios([]);
            } finally {
                setLoading(false);
            }
        };

        void fetchSocios();
    }, [token, reloadFlag]);

    const handleExportCsv = async () => {
        if (!token) {
            setError("Debes iniciar sesión como admin.");
            return;
        }

        try {
            setExporting(true);
            setError(null);

            const res = await fetch("/api/users/export", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                setError(`Error ${res.status} al exportar los socios`);
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "socios.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err?.message ?? "Error al exportar los socios");
        } finally {
            setExporting(false);
        }
    };

    const sociosFiltrados = socios.filter((socio) => {
        const term = search.toLowerCase();
        if (!term) return true;
        return (
            socio.nombre.toLowerCase().includes(term) ||
            socio.email.toLowerCase().includes(term) ||
            socio.telefono.includes(term)
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
                    Gestión de socios
                </h1>
                <p className="rc-hero-subtitle">
                    Añadir o modificar socios de la asociación
                </p>

                <div className="rc-card-section w-full">
                    <div className="flex flex-col gap-4 mb-4 md:mb-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <h2 className="text-base md:text-lg font-semibold text-dark flex items-center gap-2">
                                Gestión de socios
                            </h2>
                            {typeof totalSocios === "number" && (
                                <p className="text-sm text-muted">
                                    Total socios activos: <span className="font-semibold">{totalSocios}</span>
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                            <div className="flex-1 flex items-center bg-surfaceMuted border border-borderSoft rounded-full px-4 py-2">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por nombre, apellidos o email..."
                                    className="w-full bg-transparent outline-none text-sm text-dark placeholder:text-muted"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    className="flex items-center justify-center gap-2"
                                    onClick={handleExportCsv}
                                    disabled={exporting}
                                >
                                    <span>{exporting ? "Exportando..." : "Exportar CSV"}</span>
                                </Button>
                                <Button
                                    type="button"
                                    className="flex items-center justify-center gap-2"
                                    onClick={() => setShowImportarSociosModal(true)}
                                >
                                    <span>Importar CSV</span>
                                </Button>
                                <Button
                                    type="button"
                                    className="flex items-center justify-center gap-2"
                                    onClick={() => setShowNuevoSocioModal(true)}
                                >
                                    <span className="text-lg">+</span>
                                    <span>Nuevo socio</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-error mb-3">{error}</p>
                    )}
                    {loading && !error && (
                        <p className="text-sm text-muted mb-3">Cargando socios...</p>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-borderSoft text-[11px] uppercase tracking-wide text-muted">
                                    <th className="py-2 px-3">Nombre</th>
                                    <th className="py-2 px-3">Email</th>
                                    <th className="py-2 px-3">Telefono</th>
                                    <th className="py-2 px-3">Rol</th>
                                    <th className="py-2 px-3">Fecha de ingreso</th>
                                    <th className="py-2 px-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sociosFiltrados.map((socio) => (
                                    <tr
                                        key={socio.id}
                                        className="border-b border-borderSoft/60 last:border-0"
                                    >
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.nombre}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.email}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.telefono}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.rol}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.fechaIngreso}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="text-xs text-dark hover:text-primaryStrong mr-2"
                                                onClick={() => setEditingSocio(socio)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs text-error hover:underline"
                                                onClick={() => setDeletingSocio(socio)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {sociosFiltrados.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-4 text-center text-muted text-sm"
                                        >
                                            No se han encontrado socios con ese criterio de busqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <Footer />

            {showNuevoSocioModal && (
                <NuevoSocioModal
                    onClose={() => setShowNuevoSocioModal(false)}
                    onCreated={() => setReloadFlag((v) => v + 1)}
                />
            )}

            {editingSocio && (
                <EditarSocioModal
                    socio={editingSocio}
                    onClose={() => setEditingSocio(null)}
                    onUpdated={() => setReloadFlag((v) => v + 1)}
                />
            )}

            {showImportarSociosModal && (
                <ImportarSociosModal
                    onClose={() => setShowImportarSociosModal(false)}
                    onImported={() => setReloadFlag((v) => v + 1)}
                />
            )}

            {deletingSocio && (
                <EliminarSocioModal
                    socio={deletingSocio}
                    onClose={() => setDeletingSocio(null)}
                    onDeleted={() => setReloadFlag((v) => v + 1)}
                />
            )}

        </div>
    );
};

export default GestionSocio;