import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavMenu from "@/components/NavMenu";
import Button from "@/components/ui/button";
import DayTimeline from "@/components/ui/DayTimeline";
import type { Espacio } from "@/types/Espacio";

type LocationState = { espacio: Espacio };

const STEP_MIN = 30;
const MIN_DURATION = 60;

// --- helpers HH:MM ---
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
    for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += step) out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    return out;
}
function toIsoLocal(dateStr: string, timeStr: string) {
    return new Date(`${dateStr}T${timeStr}`).toISOString();
}

type Reserva = {
    id: string;
    usuarioId: string;
    espacioId: string;
    inicio: string; // ISO
    fin: string;    // ISO
};

export default function CrearReserva() {
    const navigate = useNavigate();
    const { state } = useLocation() as { state?: LocationState };

    // Redirige si llegan sin espacio en el state
    useEffect(() => {
        if (!state?.espacio) navigate("/ReservarEspacio", { replace: true });
    }, [state, navigate]);
    if (!state?.espacio) return null;

    const espacio: Espacio = state.espacio;

    // Fecha por defecto: hoy (YYYY-MM-DD)
    const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

    const [inicio, setInicio] = useState("20:30");
    const [fin, setFin] = useState("21:30");
    const [motivo, setMotivo] = useState(""); // mantenemos "motivo" en UI (no se guarda aún)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    const [reservasDia, setReservasDia] = useState<Reserva[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const timeOptions = useMemo(() => buildTimeOptions(), []);

    // --- carga / refresco de reservas del día ---
    async function reloadReservasDia(fechaStr: string, espacioId: string) {
        const desde = toIsoLocal(fechaStr, "00:00");
        const hasta = toIsoLocal(fechaStr, "23:59");
        const q = new URLSearchParams({ espacioId, desde, hasta }).toString();
        const r = await fetch(`/api/reservas?${q}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data: Reserva[] = await r.json();
        setReservasDia(data);
    }

    useEffect(() => {
        if (!fecha) return;
        setLoadingSlots(true);
        reloadReservasDia(fecha, espacio.id)
            .catch((e) => setError(e.message ?? "Error cargando disponibilidad"))
            .finally(() => setLoadingSlots(false));
    }, [fecha, espacio.id]);

    // transformar reservas en intervalos (minutos del día) y fusionar solapes
    const intervals = useMemo(() => {
        const list = reservasDia
            .map(r => ({ s: new Date(r.inicio), e: new Date(r.fin) }))
            .map(({ s, e }) => ({ s: s.getHours() * 60 + s.getMinutes(), e: e.getHours() * 60 + e.getMinutes() }))
            .filter(x => x.e > x.s)
            .sort((a, b) => a.s - b.s);

        const merged: Array<{ s: number; e: number }> = [];
        for (const it of list) {
            const last = merged[merged.length - 1];
            if (!last || it.s > last.e) merged.push({ ...it });
            else last.e = Math.max(last.e, it.e);
        }
        return merged;
    }, [reservasDia]);

    // inicios válidos: quepa >= 60' hasta la siguiente reserva o fin de día
    const inicioOptions = useMemo(() => {
        const opts: string[] = [];
        for (const t of timeOptions) {
            const start = toMinutes(t);
            const nextBlock = intervals.find(iv => iv.s > start);
            const until = nextBlock ? nextBlock.s : 24 * 60;
            const insideBlock = intervals.some(iv => start >= iv.s && start < iv.e);
            if (!insideBlock && until - start >= MIN_DURATION) {
                opts.push(t);
            }
        }
        return opts;
    }, [timeOptions, intervals]);

    // fines válidos: ≥ inicio + 60' y antes del siguiente bloque
    const finOptions = useMemo(() => {
        const minEnd = addMinutes(inicio, MIN_DURATION);
        if (!minEnd) return [];
        const start = toMinutes(inicio);
        const nextBlock = intervals.find(iv => iv.s > start);
        const limit = nextBlock ? nextBlock.s : 24 * 60;
        return timeOptions.filter(t => {
            const tm = toMinutes(t);
            return tm >= toMinutes(minEnd) && tm <= limit;
        });
    }, [inicio, timeOptions, intervals]);

    // Ajustes automáticos si las opciones válidas cambian
    useEffect(() => {
        if (!inicioOptions.includes(inicio)) {
            if (inicioOptions.length) setInicio(inicioOptions[0]);
        }
    }, [inicioOptions]); // eslint-disable-line

    useEffect(() => {
        const minEnd = addMinutes(inicio, MIN_DURATION);
        if (!minEnd) return setFin("");
        if (!finOptions.includes(fin)) {
            setFin(finOptions[0] ?? "");
        }
    }, [inicio, finOptions]); // eslint-disable-line

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setOk(null);

        if (!fecha) return setError("Selecciona una fecha");
        if (!inicio || !fin) return setError("Selecciona hora de inicio y fin");

        const inicioIso = toIsoLocal(fecha, inicio);
        const finIso = toIsoLocal(fecha, fin);

        setLoading(true);
        try {
            //const token = localStorage.getItem('token');
            let token: string | null = null;
            const raw = localStorage.getItem('auth');
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    token = typeof parsed?.token === 'string' ? parsed.token : null;
                } catch { /* ignore */ }
            }
            const res = await fetch("/api/reservas", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    espacioId: espacio.id,
                    //fecha,
                    inicio: inicioIso,
                    fin: finIso,
                    // motivo: Abra que añadirlo en algun momento
                }),
            });

            if (res.status === 409) {
                const j = await res.json();
                throw new Error(j?.error ?? "Horario no disponible");
            }
            if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

            setOk("¡Reserva creada!");
            // refrescar disponibilidad al instante
            await reloadReservasDia(fecha, espacio.id);
        } catch (err: any) {
            setError(err?.message ?? "Error creando la reserva");
        } finally {
            setLoading(false);
        }
    }

    const noHayHueco = !inicioOptions.length || !finOptions.length;

    return (
        <div className="min-h-screen bg-background text-black flex flex-col">
            <Header />
            <NavMenu />

            <main className="flex-grow container mx-auto px-4 py-8">
                <Button type="button" onClick={() => navigate(-1)} className="mb-4 text-sm px-3 py-1 rounded">
                    ← Volver a espacios
                </Button>

                <h2 className="text-3xl font-bold text-center mb-6">Reserva de espacios</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Info espacio + timeline */}
                    <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
                        <h3 className="text-xl font-semibold mb-2">{espacio.nombre}</h3>
                        {espacio.aforo != null && (
                            <p className="text-sm text-gray-600 mb-2">👥 {espacio.aforo} personas</p>
                        )}
                        <p className="text-sm text-gray-700">Tipo: <b>{espacio.tipo}</b></p>

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
                            {loadingSlots && <p className="text-sm text-gray-600 mt-2">Actualizando disponibilidad…</p>}
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-5 border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4">Realizar reserva</h3>

                        <label className="block text-sm mb-1">Fecha</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full mb-3 rounded border border-gray-300 bg-[#FAFAF0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                        />

                        <label className="block text-sm mb-1">Horario</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <select
                                value={inicio}
                                onChange={(e) => setInicio(e.target.value)}
                                className="rounded border border-gray-300 bg-[#FAFAF0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                disabled={loadingSlots || !fecha}
                            >
                                {inicioOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>

                            <select
                                value={fin}
                                onChange={(e) => setFin(e.target.value)}
                                className="rounded border border-gray-300 bg-[#FAFAF0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                disabled={loadingSlots || !fecha || !inicioOptions.length}
                            >
                                {finOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Motivo (UI) */}
                        <label className="block text-sm mb-1">Motivo (opcional)</label>
                        <textarea
                            rows={3}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Describe motivo/personas aproximadas"
                            className="w-full mb-4 rounded border border-gray-300 bg-[#FAFAF0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />

                        {noHayHueco && fecha && !loadingSlots && (
                            <p className="text-sm text-red-600 mb-2">No hay huecos de al menos 60 min en esa fecha.</p>
                        )}
                        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
                        {ok && <p className="text-green-700 text-sm mb-2">{ok}</p>}

                        <Button type="submit" disabled={loading || noHayHueco} className="w-full">
                            {loading ? "Guardando…" : "Confirmar reserva"}
                        </Button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
