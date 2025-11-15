import type { FC } from "react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import NavMenu from "@/components/NavMenu";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import NuevoSocioModal from "@/components/ui/NuevoSocioModal";
import EditarSocioModal from "@/components/ui/EditarSocioModal";
import EliminarSocioModal from "@/components/ui/EliminarSocioModal";
import { useAuth } from "@/context/AuthContext";


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

    const [search, setSearch] = useState("");
    const [showNuevoSocioModal, setShowNuevoSocioModal] = useState(false);
    const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
    const [deletingSocio, setDeletingSocio] = useState<Socio | null>(null);
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loading, setLoading] = useState(false);
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

                const res = await fetch(
                    "http://localhost:4000/api/users?active=true&page=1&size=100",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(text || `Error ${res.status} al cargar los socios`);
                }

                type ApiUser = {
                    id: string;
                    email: string;
                    name: string;
                    phone: string | null;
                    role: "ADMIN" | "SOCIO";
                    isActive: boolean;
                    createdAt: string;
                };

                const data: { items: ApiUser[] } = await res.json();

                const mapped: Socio[] = data.items.map((u) => ({
                    id: u.id,
                    nombre: u.name,
                    email: u.email,
                    telefono: u.phone ?? "",
                    rol: u.role === "ADMIN" ? "Admin" : "Socio",
                    fechaIngreso: new Date(u.createdAt).toLocaleDateString("es-ES"),
                }));

                setSocios(mapped);
            } catch (err: any) {
                setError(err?.message ?? "Error al cargar los socios");
                setSocios([]);
            } finally {
                setLoading(false);
            }
        };

        void fetchSocios();
    }, [token, reloadFlag]);

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
        <div className="min-h-screen flex flex-col bg-background text-black">
            <Header />
            <NavMenu />

            <main className="flex-1 px-4 md:px-10 mt-6 mb-10">
                <h1 className="text-center text-2xl md:text-3xl font-bold mb-2">
                    Gestion de socios
                </h1>
                <p className="text-center text-sm md:text-base text-muted-foreground mb-8">
                    Anadir o modificar socios de la asociacion
                </p>

                <div className="bg-white rounded-xl p-4 md:p-6 shadow w-full max-w-6xl mx-auto">
                    <div className="flex flex-col gap-4 mb-4 md:mb-6">
                        <h2 className="text-lg font-semibold">Gestion de socios</h2>
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                            <div className="flex-1 flex items-center bg-[#FAFAF0] border border-gray-300 rounded-md px-3 py-2">
                                <span className="mr-2 text-gray-500">🔍</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por nombre, apellidos o email..."
                                    className="w-full bg-transparent outline-none text-sm"
                                />
                            </div>
                            <Button
                                type="button"
                                className="self-end md:self-auto flex items-center justify-center gap-2"
                                onClick={() => setShowNuevoSocioModal(true)}
                            >
                                <span className="text-lg">+</span>
                                <span>Nuevo socio</span>
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 mb-3">{error}</p>
                    )}
                    {loading && !error && (
                        <p className="text-sm text-gray-500 mb-3">Cargando socios...</p>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
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
                                        className="border-b border-gray-100 last:border-0"
                                    >
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.nombre}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.email}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.telefono}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.rol}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{socio.fechaIngreso}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="text-xs text-blue-600 hover:underline mr-2"
                                                onClick={() => setEditingSocio(socio)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs text-red-600 hover:underline"
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
                                            className="py-4 text-center text-gray-500 text-sm"
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