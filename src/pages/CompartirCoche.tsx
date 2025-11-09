import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavMenu from "@/components/NavMenu";
import Button from "@/components/ui/button";
import ShareCarCard from "@/components/ui/ShareCarCard";
import OfferTravelModal from "@/components/ui/OfferTravelModal";

import type { Travel, Viaje } from "@/types/Travel";
import { listViajes, createViaje, joinViaje, leaveViaje } from "@/api/viajes";

// Lee el usuario actual desde localStorage (auth guardado en el login)
function getCurrentUserId(): string {
    const raw = localStorage.getItem("auth");
    if (!raw) return "";
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed?.user?.id === "string" ? parsed.user.id : "";
    } catch {
        return "";
    }
}

const USER_ID = getCurrentUserId();

function isoToDateTimeParts(iso: string) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
}

function toIsoLocal(dateStr: string, timeStr: string) {
    return new Date(`${dateStr}T${timeStr}`).toISOString();
}

// Mapea viaje de backend a tu card Travel
function mapViajeToTravelCard(v: Viaje): Travel {
    const { date, time } = isoToDateTimeParts(v.fecha);

    const ocupadas = v.Pasajeros?.length ?? 0;
    const joined = !!v.Pasajeros?.some((p) => p.userId === USER_ID);
    const isDriver = v.conductorId === USER_ID;

    const driverName = v.Conductor?.name ?? "Socio";
    const driverPhone = v.Conductor?.phone ?? "—";

    return {
        id: v.id,
        name: isDriver ? "Tú" : driverName,
        car: "Coche del conductor",
        // OJO: ahora los campos vienen como origen / destino desde el backend
        from: v.origen,
        to: v.destino,
        date,
        time,
        phone: driverPhone,
        occupancy: `${ocupadas}/${v.plazas} plazas`,
        description: v.notas ?? undefined,
        joined,
        isDriver,
    };
}

export default function CompartirCoche() {
    const [showModal, setShowModal] = useState(false);
    const [travels, setTravels] = useState<Travel[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // filtros
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [desde, setDesde] = useState(() => new Date().toISOString().slice(0, 10));

    const hayFiltros = useMemo(() => !!(from || to || desde), [from, to, desde]);

    // helper para construir el "desde" ISO
    const buildDesdeISO = (val?: string) =>
        val && val.trim() ? new Date(`${val}T00:00`).toISOString() : undefined;

    /**
     * Cargar viajes.
     * Permite overrides para evitar depender del estado cuando lo estamos reseteando.
     */
    async function cargar(overrides?: { from?: string; to?: string; desde?: string | null }) {
        try {
            setLoading(true);
            setErr(null);

            const f = overrides?.from ?? from;
            const t = overrides?.to ?? to;

            // si overrides.desde es null => fuerza sin filtro; si es string => úsalo; si es undefined => usa estado
            const dParam = overrides && "desde" in overrides ? overrides.desde : desde;

            const data = await listViajes({
                from: f || undefined,
                to: t || undefined,
                desde: buildDesdeISO(dParam || undefined),
            });

            setTravels(data.map(mapViajeToTravelCard));
        } catch (e: any) {
            setErr(e.message ?? "Error cargando viajes");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargar(); // estado inicial
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // crear viaje desde el modal
    async function handleAddTravel(payload: {
        from: string;
        to: string;
        date: string;
        time: string;
        plazas: number;
        description?: string;
    }) {
        try {
            await createViaje({
                // el backend ya saca conductorId del JWT,
                // así que solo mandamos estos campos:
                from: payload.from,
                to: payload.to,
                fecha: toIsoLocal(payload.date, payload.time),
                plazas: payload.plazas,
                notas: payload.description,
            });
            setShowModal(false);
            await cargar();
        } catch (e: any) {
            alert(e.message ?? "No se pudo crear el viaje");
        }
    }

    async function onJoin(travel: Travel) {
        try {
            await joinViaje(travel.id);
            await cargar();
        } catch (e: any) {
            alert(e.message ?? "No se pudo unir");
        }
    }

    async function onLeave(travel: Travel) {
        try {
            await leaveViaje(travel.id);
            await cargar();
        } catch (e: any) {
            alert(e.message ?? "No se pudo salir");
        }
    }

    // acciones de UI
    const buscar = () =>
        cargar({
            from,
            to,
            desde, // usa el string del input; cargar lo convertirá a ISO
        });

    const limpiar = async () => {
        // 1) vacía inputs
        setFrom("");
        setTo("");
        setDesde("");

        // 2) recarga lista SIN depender del estado (un solo clic)
        await cargar({ from: "", to: "", desde: null });
    };

    return (
        <div className="min-h-screen bg-background text-black flex flex-col">
            <Header />
            <NavMenu />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold">Compartir coche</h2>
                    <Button type="button" onClick={() => setShowModal(true)}>
                        + Ofrecer viaje
                    </Button>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow p-4 border border-gray-200 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                            className="border rounded px-3 py-2"
                            placeholder="Origen"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                        <input
                            className="border rounded px-3 py-2"
                            placeholder="Destino"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                        <input
                            className="border rounded px-3 py-2"
                            type="date"
                            value={desde}
                            onChange={(e) => setDesde(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={buscar} className="flex-1">
                                Buscar
                            </Button>
                            {hayFiltros && (
                                <Button variant="secondary" onClick={limpiar}>
                                    Limpiar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {loading && <p className="text-gray-600">Cargando…</p>}
                {err && <p className="text-red-600">{err}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                    {travels.map((t) => (
                        <div key={t.id} className="flex flex-col">
                            <ShareCarCard {...t} />
                            <div className="mt-2 flex gap-2">
                                {!t.isDriver && !t.joined && (
                                    <Button className="flex-1" onClick={() => onJoin(t)}>
                                        Unirse
                                    </Button>
                                )}
                                {!t.isDriver && t.joined && (
                                    <Button
                                        className="flex-1"
                                        variant="secondary"
                                        onClick={() => onLeave(t)}
                                    >
                                        Salir
                                    </Button>
                                )}
                                {t.isDriver && (
                                    <span className="text-xs text-gray-500 self-center">
                                        Eres el conductor
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {!loading && !travels.length && (
                        <p className="text-gray-600">No hay viajes.</p>
                    )}
                </div>
            </main>

            <Footer />

            {showModal && (
                <OfferTravelModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleAddTravel}
                />
            )}
        </div>
    );
}
