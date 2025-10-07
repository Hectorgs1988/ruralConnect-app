// src/pages/CrearReserva.tsx
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavMenu from "@/components/NavMenu";
import Button from '@/components/ui/button';

type Space = { title: string; capacity: string; description: string };

const CrearReserva = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const space = (location.state?.space as Space) ?? {
        title: "Espacio",
        capacity: "",
        description: "",
    };

    return (
        <div className="min-h-screen bg-background text-black flex flex-col">
            <Header />
            <NavMenu />
            <main className="flex-grow container mx-auto px-4 py-8">
                <Button type="submit" onClick={() => navigate(-1)} className="mb-4 text-sm px-3 py-1 rounded">← Volver a espacios</Button>
                <h2 className="text-3xl font-bold text-center mb-6">Reserva de espacios</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tarjeta izquierda: info del espacio */}
                    <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
                        <h3 className="text-xl font-semibold mb-2">{space.title}</h3>
                        {space.capacity && (
                            <p className="text-sm text-gray-600 mb-2">👥 {space.capacity}</p>
                        )}
                        <p className="text-sm text-gray-700">{space.description}</p>

                        {/* Aquí puedes listar características si las añades al state */}
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Características</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                <li>Cocina industrial equipada (ejemplo)</li>
                                <li>Menaje completo (ejemplo)</li>
                                <li>Mesas y sillas (ejemplo)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Tarjeta derecha: formulario reserva */}
                    <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4">Realizar reserva</h3>

                        <label className="block text-sm mb-1">Fecha de la reserva</label>
                        <input
                            type="date"
                            className="w-full mb-3 rounded border border-gray-300 bg-[#FAFAF0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />

                        <label className="block text-sm mb-1">Horario</label>
                        <div className="space-y-2 mb-3">
                            <input
                                placeholder="12:00 - 18:00"
                                className="w-full rounded border border-gray-300 bg-[#FAFAF0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <input
                                placeholder="18:00 - 23:00"
                                className="w-full rounded border border-gray-300 bg-[#FAFAF0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <input
                                placeholder="Otro horario..."
                                className="w-full rounded border border-gray-300 bg-[#FAFAF0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                        </div>

                        <label className="block text-sm mb-1">Motivo de la reserva</label>
                        <textarea
                            rows={3}
                            placeholder="Describe motivo/personas aproximadas"
                            className="w-full mb-4 rounded border border-gray-300 bg-[#FAFAF0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <Button type="submit" className="w-full">Confirmar reserva</Button>
                        
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CrearReserva;
