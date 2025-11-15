import type { FC } from "react";
import { useState } from "react";
import Header from "@/components/Header";
import NavMenu from "@/components/NavMenu";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";


type Evento = {
    id: string;
    titulo: string;
    fecha: string;
    lugar: string;
    estado: string;
    aforo: number;
};

const eventosMock: Evento[] = [
    {
        id: "1",
        titulo: "Paellada",
        fecha: "25-08-2025",
        lugar: "Polideportivo",
        estado: "Publicado",
        aforo: 300,
    },
    {
        id: "2",
        titulo: "Romeria",
        fecha: "20-07-2025",
        lugar: "Villegas",
        estado: "Publicado",
        aforo: 300,
    },
    {
        id: "3",
        titulo: "Mariscada",
        fecha: "10-08-2025",
        lugar: "Escuela",
        estado: "Cancelado",
        aforo: 50,
    },
    {
        id: "4",
        titulo: "Excursion",
        fecha: "15-05-2025",
        lugar: "Excursion",
        estado: "Borrador",
        aforo: 80,
    },
];


const GestionEventos: FC = () => {
    const [search, setSearch] = useState("");

    const eventosFiltrados = eventosMock.filter((evento) => {
        const term = search.toLowerCase();
        if (!term) return true;
        return (
            evento.titulo.toLowerCase().includes(term) ||
            evento.lugar.toLowerCase().includes(term) ||
            evento.estado.toLowerCase().includes(term) ||
            String(evento.aforo).includes(term)
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
                                onClick={() => {
                                    // TODO: abrir modal de nuevo evento
                                }}
                            >
                                <span className="text-lg">+</span>
                                <span>Nuevo evento</span>
                            </Button>
                        </div>
                    </div>

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
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.fecha}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.lugar}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.estado}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{evento.aforo}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="text-xs text-blue-600 hover:underline mr-2"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs text-red-600 hover:underline"
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
        </div>
    );
};


export default GestionEventos;

