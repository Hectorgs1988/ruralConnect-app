import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import ShareCarCard from "@/components/ui/ShareCarCard";
import OfferTravelModal from "@/components/ui/OfferTravelModal";
import ConfirmJoinTravelModal from "@/components/ui/ConfirmJoinTravelModal";
import ConfirmCancelTravelModal from "@/components/ui/ConfirmCancelTravelModal";
import RequestTravelModal from "@/components/ui/RequestTravelModal";

import type { Travel, Viaje } from "@/types/Travel";
import type { SolicitudViaje, SolicitudViajeCreateInput } from "@/types/SolicitudViaje";
import { listViajes, createViaje, joinViaje, leaveViaje, cancelViaje } from "@/api/viajes";
import { listSolicitudesViaje, createSolicitudViaje, ofrecerDesdeSolicitud, cancelarSolicitudViaje } from "@/api/solicitudesViaje";
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
    const { user, token } = useAuth();
    const currentUserId = user?.id ?? "";

    // viajes
    const [showModal, setShowModal] = useState(false);
    const [travels, setTravels] = useState<Travel[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [travelToJoin, setTravelJoin] = useState<Travel | null>(null);
    const [travelToCancel, setTravelToCancel] = useState<Travel | null>(null);

    // solicitudes
    const [solicitudes, setSolicitudes] = useState<SolicitudViaje[]>([]);
    const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
    const [errSolicitudes, setErrSolicitudes] = useState<string | null>(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] =
        useState<SolicitudViaje | null>(null);

    // filtros
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [desde, setDesde] = useState("");
    const hayFiltros = useMemo(() => !!(from || to || desde), [from, to, desde]);
    const [showFilters, setShowFilters] = useState(false);

    async function cargar(overrides?: {
        from?: string;
        to?: string;
        desde?: string | null;
    }) {
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

            // Filtrar viajes cancelados
            const viajesActivos = data.filter((v) => v.estado !== "CANCELADO");

            setTravels(viajesActivos.map((v) => mapViajeToTravelCard(v, currentUserId)));
        } catch (e: any) {
            setErr(e.message ?? "Error cargando viajes");
        } finally {
            setLoading(false);
        }
    }

    async function cargarSolicitudes() {
        if (!token) {
            setSolicitudes([]);
            setLoadingSolicitudes(false);
            return;
        }

        try {
            setLoadingSolicitudes(true);
            setErrSolicitudes(null);
            const data = await listSolicitudesViaje(token);
            const ahora = new Date();

            // Filtrar:
            // 1. Mostrar solo ABIERTAS para otros usuarios, pero todas para el solicitante
            // 2. Excluir solicitudes con viaje cancelado
            // 3. Excluir solicitudes con fecha pasada
            const filtered = data.filter((s) => {
                // Filtro 1: Estado
                const estadoOk = s.estado === "ABIERTA" || s.solicitanteId === currentUserId;
                if (!estadoOk) return false;

                // Filtro 2: Viaje no cancelado
                if (s.Viaje && s.Viaje.estado === "CANCELADO") return false;

                // Filtro 3: Fecha no pasada
                const fechaSolicitud = new Date(s.fecha);
                if (fechaSolicitud < ahora) return false;

                return true;
            });

            setSolicitudes(filtered);
        } catch (e: any) {
            setErrSolicitudes(e.message ?? "Error cargando solicitudes");
        } finally {
            setLoadingSolicitudes(false);
        }
    }

    useEffect(() => {
        cargar();
        cargarSolicitudes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, token]);

    async function handleAddTravel(payload: {
        from: string;
        to: string;
        date: string;
        time: string;
        plazas: number;
        description?: string;
        tipo: "IDA" | "IDA_VUELTA";
        fromVuelta?: string;
        toVuelta?: string;
        dateVuelta?: string;
        timeVuelta?: string;
    }) {
        if (!token) {
            alert("Debes iniciar sesión para ofrecer un viaje.");
            return;
        }

        try {
            if (payload.tipo === "IDA_VUELTA") {
                const isoIda = toIsoLocal(payload.date, payload.time);

                // Viaje de ida
                await createViaje(
                    {
                        from: payload.from,
                        to: payload.to,
                        fecha: isoIda,
                        plazas: payload.plazas,
                        notas: payload.description,
                    },
                    token
                );

                if (
                    !payload.fromVuelta ||
                    !payload.toVuelta ||
                    !payload.dateVuelta ||
                    !payload.timeVuelta
                ) {
                    throw new Error("Faltan datos del viaje de vuelta");
                }

                const isoVuelta = toIsoLocal(payload.dateVuelta, payload.timeVuelta);

                // Viaje de vuelta
                await createViaje(
                    {
                        from: payload.fromVuelta,
                        to: payload.toVuelta,
                        fecha: isoVuelta,
                        plazas: payload.plazas,
                        notas: payload.description,
                    },
                    token
                );
            } else {
                await createViaje(
                    {
                        from: payload.from,
                        to: payload.to,
                        fecha: toIsoLocal(payload.date, payload.time),
                        plazas: payload.plazas,
                        notas: payload.description,
                    },
                    token
                );
            }

            setShowModal(false);
            await cargar();
        } catch (e: any) {
            alert(e.message ?? "No se pudo crear el viaje");
        }
    }

    async function handleCreateSolicitud(data: SolicitudViajeCreateInput) {
        if (!token) {
            alert("Debes iniciar sesión para solicitar un viaje.");
            return;
        }

        try {
            await createSolicitudViaje(data, token);
            setShowRequestModal(false);
            await cargarSolicitudes();
        } catch (e: any) {
            alert(e.message ?? "No se pudo crear la solicitud");
        }
    }

    async function handleCancelarSolicitud(id: string) {
        if (!token) return;

        try {
            await cancelarSolicitudViaje(id, token);
            await cargarSolicitudes();
        } catch (e: any) {
            alert(e.message ?? "No se pudo cancelar la solicitud");
        }
    }

    async function handleOfrecerDesdeSolicitud(payload: {
        from: string;
        to: string;
        date: string;
        time: string;
        plazas: number;
        description?: string;
        tipo: "IDA" | "IDA_VUELTA";
        fromVuelta?: string;
        toVuelta?: string;
        dateVuelta?: string;
        timeVuelta?: string;
    }) {
        if (!token || !selectedSolicitud) return;

        try {
            // Para aceptar solicitud, solo permitimos ida
            if (payload.tipo === "IDA_VUELTA") {
                alert("Para aceptar una solicitud, ofrece solo un viaje de ida.");
                return;
            }

            await ofrecerDesdeSolicitud(
                selectedSolicitud.id,
                {
                    from: payload.from,
                    to: payload.to,
                    fecha: toIsoLocal(payload.date, payload.time),
                    plazas: payload.plazas,
                    notas: payload.description,
                },
                token
            );

            setSelectedSolicitud(null);
            await cargar();
            await cargarSolicitudes();
        } catch (e: any) {
            alert(e.message ?? "No se pudo ofrecer el viaje desde la solicitud");
        }
    }

    async function ConfirmJoin() {
        if (!travelToJoin) return;

        if (!currentUserId || !token) {
            alert("Inicia sesión para unirte");
            return;
        }

        try {
            await joinViaje(travelToJoin.id, currentUserId, token);
            setTravelJoin(null);
            await cargar();
        } catch (e: any) {
            alert(e.message ?? "No se pudo unir");
        }
    }

    async function onLeave(travel: Travel) {
        if (!currentUserId || !token) {
            alert("Inicia sesión para salir del viaje");
            return;
        }

        try {
            await leaveViaje(travel.id, currentUserId, token);
            await cargar();
        } catch (e: any) {
            alert(e.message ?? "No se pudo salir");
        }
    }

    function onCancelTrip(travel: Travel) {
        if (!token) {
            alert("Inicia sesión para cancelar el viaje");
            return;
        }
        setTravelToCancel(travel);
    }

    async function confirmCancelTrip() {
        if (!travelToCancel || !token) return;

        try {
            const result = await cancelViaje(travelToCancel.id, token);
            setTravelToCancel(null);
            alert(`Viaje cancelado. Se ha notificado a ${result.pasajerosNotificados} pasajero(s).`);
            await cargar();
        } catch (e: any) {
            alert(e.message ?? "No se pudo cancelar el viaje");
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
        <div className="rc-page">
            <Header />

            <main className="flex-1 rc-shell py-8 md:py-10 space-y-8 md:space-y-10">
                {/* Bloque principal: título + filtros */}
                <section className="rc-card-section">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                        <div>
                            <h1 className="rc-hero-title text-left md:text-left mb-1">
                                Compartir coche
                            </h1>
                            <p className="rc-hero-subtitle text-left md:text-left max-w-2xl mb-0">
                                Encuentra o ofrece viajes para compartir desplazamientos con otros socios.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="rc-btn-primary whitespace-nowrap"
                        >
                            + Ofrecer viaje
                        </Button>
                    </div>

                    {/* Barra de filtros compacta */}
                    <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-muted">Filtros</span>
                                {from && (
                                    <span className="rc-pill text-[11px] bg-surfaceMuted text-dark">
                                        Origen: {from}
                                    </span>
                                )}
                                {to && (
                                    <span className="rc-pill text-[11px] bg-surfaceMuted text-dark">
                                        Destino: {to}
                                    </span>
                                )}
                                {desde && (
                                    <span className="rc-pill text-[11px] bg-surfaceMuted text-dark">
                                        Desde: {desde}
                                    </span>
                                )}
                                {!hayFiltros && (
                                    <span className="text-xs text-muted">
                                        Ningún filtro aplicado
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {hayFiltros && (
                                    <button
                                        type="button"
                                        onClick={limpiar}
                                        className="text-xs text-muted hover:text-dark"
                                    >
                                        Limpiar
                                    </button>
                                )}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="text-xs md:text-sm whitespace-nowrap"
                                    onClick={() => setShowFilters((v) => !v)}
                                >
                                    {showFilters ? "Ocultar filtros" : "Editar filtros"}
                                </Button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <input
                                    className="border border-borderSoft rounded-full px-4 py-2 text-sm bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-primary/60"
                                    placeholder="Origen"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                />
                                <input
                                    className="border border-borderSoft rounded-full px-4 py-2 text-sm bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-primary/60"
                                    placeholder="Destino"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                />
                                <input
                                    className="border border-borderSoft rounded-full px-4 py-2 text-sm bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-primary/60"
                                    type="date"
                                    value={desde}
                                    onChange={(e) => setDesde(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={buscar} className="flex-1 rc-btn-primary">
                                        Buscar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Solicitudes de viaje - Scroll horizontal en desktop */}
                <section className="rc-card-section">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-dark">
                                Solicitudes de viaje
                            </h3>
                            <p className="text-xs text-muted mt-0.5">
                                Usuarios que buscan un viaje. Puedes ofrecer llevarlo.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setShowRequestModal(true)}
                            className="rc-btn-primary text-sm whitespace-nowrap"
                        >
                            + Solicitar viaje
                        </Button>
                    </div>

                    {loadingSolicitudes && <p className="text-muted text-sm">Cargando solicitudes…</p>}
                    {errSolicitudes && (
                        <p className="text-error font-medium text-sm">{errSolicitudes}</p>
                    )}

                    {!loadingSolicitudes && !solicitudes.length && (
                        <div className="bg-surfaceMuted/50 rounded-2xl p-8 text-center">
                            <p className="text-muted">No hay solicitudes todavía.</p>
                        </div>
                    )}

                    {!loadingSolicitudes && solicitudes.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {solicitudes.map((s) => {
                                const isMine = s.solicitanteId === currentUserId;
                                const isAceptada = s.estado === "ACEPTADA";
                                const fechaStr = new Date(s.fecha).toLocaleDateString();
                                const solicitanteName = s.Solicitante?.name ?? "Socio";
                                const aceptadaPorName = s.AceptadaPor?.name ?? "Conductor";

                                return (
                                    <div
                                        key={s.id}
                                        className={`rc-card p-4 flex flex-col justify-between ${isAceptada
                                                ? "border-2 border-green-400 bg-green-50"
                                                : isMine
                                                    ? "border-2 border-primary"
                                                    : ""
                                            }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-semibold text-dark">
                                                    {s.origen} → {s.destino}
                                                </p>
                                                {isMine && !isAceptada && (
                                                    <span className="rc-pill text-xs bg-primary text-dark font-semibold whitespace-nowrap">
                                                        Tu solicitud
                                                    </span>
                                                )}
                                                {isAceptada && (
                                                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                                                        ✓ Aceptada
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted">
                                                {fechaStr} · {s.horaDesde}–{s.horaHasta}
                                            </p>
                                            {!isMine && !isAceptada && (
                                                <p className="text-xs text-muted">
                                                    Solicitado por: {solicitanteName}
                                                </p>
                                            )}
                                            {s.notas && (
                                                <p className="text-sm text-dark mt-2">{s.notas}</p>
                                            )}
                                            {isAceptada && isMine && (
                                                <div className="mt-2 p-2 bg-white rounded border border-green-200">
                                                    <p className="text-xs text-green-700 font-medium">
                                                        ✓ {aceptadaPorName} aceptó tu solicitud
                                                    </p>
                                                    <p className="text-xs text-muted mt-1">
                                                        Ya estás añadido al viaje
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 flex justify-end gap-2">
                                            {isMine && !isAceptada ? (
                                                <Button
                                                    variant="secondary"
                                                    className="text-sm"
                                                    onClick={() => handleCancelarSolicitud(s.id)}
                                                >
                                                    Cancelar
                                                </Button>
                                            ) : !isMine && !isAceptada ? (
                                                <Button
                                                    className="text-sm"
                                                    onClick={() => setSelectedSolicitud(s)}
                                                >
                                                    Ofrecer viaje
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Viajes ofrecidos - Grid normal */}
                <section className="rc-card-section">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-dark">
                            Viajes ofrecidos
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                            Viajes disponibles para unirte como pasajero
                        </p>
                    </div>

                    {loading && <p className="text-muted text-sm">Cargando…</p>}
                    {err && <p className="text-error font-medium text-sm">{err}</p>}

                    {!loading && !travels.length && (
                        <div className="bg-surfaceMuted/50 rounded-2xl p-8 text-center">
                            <p className="text-muted">No hay viajes disponibles por ahora.</p>
                        </div>
                    )}

                    {!loading && travels.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {travels.map((t) => (
                                <ShareCarCard
                                    key={t.id}
                                    {...t}
                                    onJoin={() => setTravelJoin(t)}
                                    onLeave={() => onLeave(t)}
                                    onCancel={t.isDriver ? () => onCancelTrip(t) : undefined}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <Footer />

            {/* Modal ofrecer viaje normal */}
            {showModal && (
                <OfferTravelModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleAddTravel}
                />
            )}

            {/* Modal confirmar unirse */}
            {travelToJoin && (
                <ConfirmJoinTravelModal
                    travel={travelToJoin}
                    onClose={() => setTravelJoin(null)}
                    onConfirm={ConfirmJoin}
                />
            )}

            {/* Modal solicitar viaje */}
            {showRequestModal && (
                <RequestTravelModal
                    onClose={() => setShowRequestModal(false)}
                    onSubmit={handleCreateSolicitud}
                />
            )}

            {/* Modal ofrecer viaje desde solicitud (prefilled) */}
            {selectedSolicitud && (
                <OfferTravelModal
                    onClose={() => setSelectedSolicitud(null)}
                    onSubmit={handleOfrecerDesdeSolicitud}
                    initialTravel={{
                        from: selectedSolicitud.origen,
                        to: selectedSolicitud.destino,
                        date: selectedSolicitud.fecha, // ISO
                        seats: 1,
                        notes: selectedSolicitud.notas ?? "",
                    }}
                />
            )}

            {/* Modal confirmar cancelación de viaje */}
            {travelToCancel && (
                <ConfirmCancelTravelModal
                    travel={travelToCancel}
                    onClose={() => setTravelToCancel(null)}
                    onConfirm={confirmCancelTrip}
                />
            )}
        </div>
    );
}
