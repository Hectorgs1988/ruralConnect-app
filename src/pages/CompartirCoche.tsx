import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavMenu from "@/components/NavMenu";
import Button from "@/components/ui/button";
import ShareCarCard from "@/components/ui/ShareCarCard";
import OfferTravelModal from "@/components/ui/OfferTravelModal";
import ConfirmJoinTravelModal from "@/components/ui/ConfirmJoinTravelModal";

import type { Travel, Viaje } from "@/types/Travel";
import { listViajes, createViaje, joinViaje, leaveViaje } from "@/api/viajes";
import { useAuth } from "@/context/AuthContext";

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

// inicio de hoy en ISO (00:00)
function getTodayStartIso() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

// Mapea viaje de backend a tu card Travel
function mapViajeToTravelCard(v: Viaje, currentUserId: string): Travel {
    const { date, time } = isoToDateTimeParts(v.fecha);

    const ocupadas = v.Pasajeros?.length ?? 0;
    const joined = currentUserId
        ? !!v.Pasajeros?.some((p) => p.userId === currentUserId)
        : false;
    const isDriver = currentUserId ? v.conductorId === currentUserId : false;

    const driverName = v.Conductor?.name ?? "Socio";
    const driverPhone = v.Conductor?.phone ?? "—";

    return {
        id: v.id,
        name: isDriver ? "Eres el conductor" : driverName,
        car: " ",
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
    const { user } = useAuth();
    const currentUserId = user?.id ?? "";

    const [showModal, setShowModal] = useState(false);
    const [travels, setTravels] = useState<Travel[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [travelToJoin, setTravelJoin] = useState<Travel | null>(null);

    // filtros
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [desde, setDesde] = useState("");
    const hayFiltros = useMemo(() => !!(from || to || desde), [from, to, desde]);

    async function cargar(overrides?: { from?: string; to?: string; desde?: string | null }) {
        try {
            setLoading(true);
            setErr(null);

            const f = overrides?.from ?? from;
            const t = overrides?.to ?? to;
            const dParam = overrides && "desde" in overrides ? overrides.desde : desde;

            // si el usuario NO ha puesto fecha, usamos hoy como mínimo
            let desdeIso: string | undefined;
            if (dParam && dParam.trim()) {
                // fecha elegida por el usuario (input type="date" en formato YYYY-MM-DD)
                desdeIso = new Date(`${dParam}T00:00`).toISOString();
            } else {
                // por defecto, hoy 00:00
                desdeIso = getTodayStartIso();
            }

            const data = await listViajes({
                from: f || undefined,
                to: t || undefined,
                desde: desdeIso,
            });

            setTravels(data.map((v) => mapViajeToTravelCard(v, currentUserId)));
        } catch (e: any) {
            setErr(e.message ?? "Error cargando viajes");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargar();
    }, [currentUserId]);

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

    async function ConfirmJoin() {
        if (!travelToJoin) return;

        if (!currentUserId) {
            alert("Inicia sesión para unirte");
            return;
        }

        try {
            await joinViaje(travelToJoin.id, currentUserId);
            setTravelJoin(null);
            await cargar();
        } catch (e: any) {
            alert(e.message ?? "No se pudo unir");
        }
    }

    async function onLeave(travel: Travel) {
        try {
            await leaveViaje(travel.id, currentUserId);
            await cargar();
        } catch (e: any) {
            alert(e.message ?? "No se pudo salir");
        }
    }

    const buscar = () =>
        cargar({
            from,
            to,
            desde,
        });

    const limpiar = async () => {
        setFrom("");
        setTo("");
        setDesde("");
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
                        <ShareCarCard
                            key={t.id}
                            {...t}
                            onJoin={() => setTravelJoin(t)}
                            onLeave={() => onLeave(t)}
                        />
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
            {travelToJoin && (
                <ConfirmJoinTravelModal
                    travel={travelToJoin}
                    onClose={() => setTravelJoin(null)}
                    onConfirm={ConfirmJoin}
                />
            )}
        </div>
    );
}
