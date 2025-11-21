import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import DayTimeline from "@/components/ui/DayTimeline";
import type { Espacio } from "@/types/Espacio";
import { useAuth } from "@/context/AuthContext";
import { createReserva, listReservas } from "@/api/reservas";
import type { ApiReserva as Reserva } from "@/api/reservas";

type LocationState = { espacio: Espacio };

const STEP_MIN = 30;
const MIN_DURATION = 60;

const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

const fromMinutes = (mins: number) => {
    const clamp = Math.max(0, Math.min(24 * 60 - STEP_MIN, mins));
    const h = Math.floor(clamp / 60);
    const m = clamp % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const addMinutes = (hhmm: string, mins: number) => {
    const val = toMinutes(hhmm) + mins;
    if (val > 24 * 60) return null;
    return fromMinutes(val);
};

function buildTimeOptions(step = STEP_MIN) {
    const out: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += step) {
            out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
    }
    return out;
}

function toIsoLocal(dateStr: string, timeStr: string) {
    return new Date(`${dateStr}T${timeStr}`).toISOString();
}

export default function CrearReserva() {
    const navigate = useNavigate();
    const { state } = useLocation() as { state?: LocationState };
    const { token } = useAuth();

    useEffect(() => {
        if (!state?.espacio) navigate("/ReservarEspacio", { replace: true });
    }, [state, navigate]);
    if (!state?.espacio) return null;

    const espacio: Espacio = state.espacio;

    const [fecha, setFecha] = useState("");

    const [inicio, setInicio] = useState("");
    const [fin, setFin] = useState("");
    const [motivo, setMotivo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [reservasDia, setReservasDia] = useState<Reserva[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const timeOptions = useMemo(() => buildTimeOptions(), []);

    async function reloadReservasDia(fechaStr: string, espacioId: string) {
        const desde = toIsoLocal(fechaStr, "00:00");
        const hasta = toIsoLocal(fechaStr, "23:59");

        const data = await listReservas(
            { espacioId, desde, hasta },
            token ?? undefined
        );

        setReservasDia(data);
    }

    useEffect(() => {
        if (!fecha) return;
        setLoadingSlots(true);
        reloadReservasDia(fecha, espacio.id)
            .catch((e) => setError(e.message ?? "Error cargando disponibilidad"))
            .finally(() => setLoadingSlots(false));
    }, [fecha, espacio.id]);

    const intervals = useMemo(() => {
        const list = reservasDia
            .map((r) => ({ s: new Date(r.inicio), e: new Date(r.fin) }))
            .map(({ s, e }) => ({
                s: s.getHours() * 60 + s.getMinutes(),
                e: e.getHours() * 60 + e.getMinutes(),
            }))
            .filter((x) => x.e > x.s)
            .sort((a, b) => a.s - b.s);

        const merged: Array<{ s: number; e: number }> = [];
        for (const it of list) {
            const last = merged[merged.length - 1];
            if (!last || it.s > last.e) merged.push({ ...it });
            else last.e = Math.max(last.e, it.e);
        }
        return merged;
    }, [reservasDia]);

    const inicioOptions = useMemo(() => {
        const opts: string[] = [];
        for (const t of timeOptions) {
            const start = toMinutes(t);
            const nextBlock = intervals.find((iv) => iv.s > start);
            const until = nextBlock ? nextBlock.s : 24 * 60;
            const insideBlock = intervals.some((iv) => start >= iv.s && start < iv.e);
            if (!insideBlock && until - start >= MIN_DURATION) {
                opts.push(t);
            }
        }
        return opts;
    }, [timeOptions, intervals]);

    const finOptions = useMemo(() => {
        const minEnd = addMinutes(inicio, MIN_DURATION);
        if (!minEnd) return [];
        const start = toMinutes(inicio);
        const nextBlock = intervals.find((iv) => iv.s > start);
        const limit = nextBlock ? nextBlock.s : 24 * 60;
        return timeOptions.filter((t) => {
            const tm = toMinutes(t);
            return tm >= toMinutes(minEnd) && tm <= limit;
        });
    }, [inicio, timeOptions, intervals]);

    useEffect(() => {
        if (!inicio) return;
        if (!inicioOptions.includes(inicio)) {
            if (inicioOptions.length) setInicio(inicioOptions[0]);
            else setInicio("");
        }
    }, [inicio, inicioOptions]);

    useEffect(() => {
        if (!inicio) {
            setFin("");
            return;
        }
        const minEnd = addMinutes(inicio, MIN_DURATION);
        if (!minEnd) return setFin("");
        if (!finOptions.includes(fin)) {
            setFin(finOptions[0] ?? "");
        }
    }, [inicio, finOptions, fin]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setOk(null);

        if (!fecha || !inicio || !fin) {
            setError("Faltan datos por rellenar (fecha y horario).");
            return;
        }

        if (!token) {
            setError("Debes iniciar sesión para realizar una reserva.");
            return;
        }

        setShowConfirmModal(true);
    }

    async function confirmarReserva() {
        if (!fecha || !inicio || !fin || !token) return;

        const inicioIso = toIsoLocal(fecha, inicio);
        const finIso = toIsoLocal(fecha, fin);

        setLoading(true);
        setError(null);
        setOk(null);

        try {
            await createReserva(
                {
                    espacioId: espacio.id,
                    inicio: inicioIso,
                    fin: finIso,
                },
                token
            );

            setOk("¡Reserva creada!");
            setShowConfirmModal(false);
            await reloadReservasDia(fecha, espacio.id);
        } catch (err: any) {
            setError(err?.message ?? "Error creando la reserva");
        } finally {
            setLoading(false);
        }
    }

    const noHayHueco = !!fecha && !loadingSlots && !inicioOptions.length;
    const submitDisabled = loading || noHayHueco;

    return (
        <div className="rc-page">
            <Header />
            <main className="flex-1 rc-shell py-10 space-y-8">
                <Button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-4 text-sm px-3 py-1 rounded-full border border-borderSoft bg-surface hover:bg-surfaceMuted transition-colors"
                >
                    ← Volver a espacios
                </Button>

                <h2 className="rc-hero-title">Reserva de espacios</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="rc-card-section">
                        <h3 className="text-xl font-semibold mb-2">{espacio.nombre}</h3>
                        {espacio.aforo != null && (
                            <p className="text-sm text-muted mb-2">
                                👥 {espacio.aforo} personas
                            </p>
                        )}
                        <p className="text-sm text-muted">
                            Tipo: <b>{espacio.tipo}</b>
                        </p>

                        <div className="mt-5">
                            <h4 className="font-medium mb-2">Disponibilidad</h4>
                            <DayTimeline
                                occupied={intervals}
                                selected={
                                    inicio && fin
                                        ? { s: toMinutes(inicio), e: toMinutes(fin) }
                                        : undefined
                                }
                                step={30}
                            />
                            {loadingSlots && (
                                <p className="text-sm text-muted mt-2">
                                    Actualizando disponibilidad…
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Formulario */}
                    <form onSubmit={onSubmit} className="rc-card-section space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Realizar reserva</h3>
                            <p className="text-xs text-muted">
                                Elige fecha y horario. Las reservas son de al menos 60 minutos.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Fecha</label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full rounded-full border border-borderSoft bg-surfaceMuted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 mb-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Horario</label>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={inicio}
                                    onChange={(e) => setInicio(e.target.value)}
                                    className="rounded-full border border-borderSoft bg-surfaceMuted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                                    disabled={loadingSlots || !fecha || !inicioOptions.length}
                                >
                                    <option value="">Selecciona inicio</option>
                                    {inicioOptions.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={fin}
                                    onChange={(e) => setFin(e.target.value)}
                                    className="rounded-full border border-borderSoft bg-surfaceMuted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                                    disabled={loadingSlots || !fecha || !inicio}
                                >
                                    <option value="">Selecciona fin</option>
                                    {finOptions.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Motivo (opcional)</label>
                            <textarea
                                rows={3}
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Describe motivo/personas aproximadas"
                                className="w-full rounded-2xl border border-borderSoft bg-surfaceMuted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                            />
                        </div>

                        {noHayHueco && fecha && !loadingSlots && (
                            <p className="text-sm text-error mb-1">
                                No hay huecos de al menos 60 min en esa fecha.
                            </p>
                        )}
                        {error && <p className="text-error text-sm mb-1">{error}</p>}
                        {ok && <p className="text-sm text-success mb-1">{ok}</p>}

                        <Button
                            type="submit"
                            disabled={submitDisabled}
                            className="w-full rc-btn-primary mt-2"
                        >
                            {loading ? "Guardando…" : "Confirmar reserva"}
                        </Button>
                    </form>
                </div>

            {showConfirmModal && (
                <div
                    className="rc-modal-overlay"
                    onClick={() => !loading && setShowConfirmModal(false)}
                >
                    <div
                        className="rc-modal-panel max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => !loading && setShowConfirmModal(false)}
                            className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>

                        <div className="mb-6">
                            <h2 className="rc-modal-title">Confirmar reserva</h2>
                            <p className="rc-modal-subtitle">
                                ¿Confirmas la reserva de{" "}
                                <span className="font-semibold">{espacio.nombre}</span> el{" "}
                                <span className="font-semibold">{fecha}</span> de{" "}
                                <span className="font-semibold">{inicio}</span> a{" "}
                                <span className="font-semibold">{fin}</span>?
                            </p>
                        </div>

                        <div className="rc-modal-footer">
                            <Button
                                type="button"
                                onClick={() => !loading && setShowConfirmModal(false)}
                                className="w-full md:w-auto rc-btn-secondary"
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={confirmarReserva}
                                className="w-full md:w-auto rc-btn-primary"
                                disabled={loading}
                            >
                                {loading ? "Guardando…" : "Confirmar reserva"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            </main>
            <Footer />
        </div>
    );
}
