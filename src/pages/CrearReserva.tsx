import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import DayTimeline from "@/components/ui/DayTimeline";
import type { Espacio } from "@/types/Espacio";
import { useAuth } from "@/context/AuthContext";
import { createReserva, listReservas, updateReserva } from "@/api/reservas";
import type { ApiReserva as Reserva } from "@/api/reservas";

type LocationState = { espacio: Espacio };

export const STEP_MIN = 30;
export const MIN_DURATION = 60;

type DayInterval = { s: number; e: number };
type DayIntervalsByDate = Record<string, DayInterval[]>;

export const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

export const fromMinutes = (mins: number) => {
    const clamp = Math.max(0, Math.min(24 * 60 - STEP_MIN, mins));
    const h = Math.floor(clamp / 60);
    const m = clamp % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const addMinutes = (hhmm: string, mins: number) => {
    const val = toMinutes(hhmm) + mins;
    if (val >= 24 * 60) return null;
    return fromMinutes(val);
};

export const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export function buildTimeOptions(step = STEP_MIN) {
    const out: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += step) {
            out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
    }
    return out;
}

export function toIsoLocal(dateStr: string, timeStr: string) {
    return new Date(`${dateStr}T${timeStr}`).toISOString();
}

function getMonthRangeIso(monthDate: Date): { desde: string; hasta: string } {
	const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
	const lastDay = new Date(
		monthDate.getFullYear(),
		monthDate.getMonth() + 1,
		0
	);

	const desde = new Date(
		firstDay.getFullYear(),
		firstDay.getMonth(),
		firstDay.getDate(),
		0,
		0,
		0
	).toISOString();

	const hasta = new Date(
		lastDay.getFullYear(),
		lastDay.getMonth(),
		lastDay.getDate(),
		23,
		59,
		59
	).toISOString();

	return { desde, hasta };
}

function buildDayIntervalsByDate(reservas: Reserva[]): DayIntervalsByDate {
	const byDate: DayIntervalsByDate = {};
	for (const r of reservas) {
		if (r.estado === "CANCELADA") continue;
		const s = new Date(r.inicio);
		const e = new Date(r.fin);
		const key = formatDateKey(s);
		const interval: DayInterval = {
			s: s.getHours() * 60 + s.getMinutes(),
			e: e.getHours() * 60 + e.getMinutes(),
		};
		if (!byDate[key]) byDate[key] = [];
		byDate[key].push(interval);
	}
	return byDate;
}

function mergeIntervals(intervals: DayInterval[]): DayInterval[] {
	const sorted = intervals
		.filter((x) => x.e > x.s)
		.sort((a, b) => a.s - b.s);
	const merged: DayInterval[] = [];
	for (const it of sorted) {
		const last = merged[merged.length - 1];
		if (!last || it.s > last.e) merged.push({ ...it });
		else last.e = Math.max(last.e, it.e);
	}
	return merged;
}

function isFullDay(merged: DayInterval[]): boolean {
	let lastEnd = 0;
	let hasGap = false;
	for (const iv of merged) {
		if (iv.s - lastEnd >= MIN_DURATION) {
			hasGap = true;
			break;
		}
		lastEnd = Math.max(lastEnd, iv.e);
	}
	if (!hasGap && 24 * 60 - lastEnd < MIN_DURATION) {
		return true;
	}
	return false;
}

function computeFullDays(byDate: DayIntervalsByDate): Record<string, true> {
	const full: Record<string, true> = {};
	for (const [key, list] of Object.entries(byDate)) {
		const merged = mergeIntervals(list);
		if (isFullDay(merged)) {
			full[key] = true;
		}
	}
	return full;
}

export default function CrearReserva() {
    const navigate = useNavigate();
    const { state } = useLocation() as { state?: LocationState };
    const { token, user } = useAuth();

    useEffect(() => {
        if (!state?.espacio) navigate("/ReservarEspacio", { replace: true });
    }, [state, navigate]);
    if (!state?.espacio) return null;

    const espacio: Espacio = state.espacio;
    const [fecha, setFecha] = useState("");
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [fullDays, setFullDays] = useState<Record<string, true>>({});
    const [loadingCalendar, setLoadingCalendar] = useState(false);
    const [inicio, setInicio] = useState("");
    const [fin, setFin] = useState("");
    const [motivo, setMotivo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [reservasDia, setReservasDia] = useState<Reserva[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [misReservas, setMisReservas] = useState<Reserva[]>([]);
    const [loadingMisReservas, setLoadingMisReservas] = useState(false);
    const [cancelandoId, setCancelandoId] = useState<string | null>(null);
    const [reservaParaCancelar, setReservaParaCancelar] = useState<Reserva | null>(
        null
    );
    const timeOptions = useMemo(() => buildTimeOptions(), []);

    async function reloadReservasDia(fechaStr: string, espacioId: string) {
        const desde = toIsoLocal(fechaStr, "00:00");
        const hasta = toIsoLocal(fechaStr, "23:59");

        const data = await listReservas(
            { espacioId, desde, hasta },
            token ?? undefined
        );

        // Ignorar reservas canceladas para calcular la disponibilidad
        setReservasDia(data.filter((r) => r.estado !== "CANCELADA"));
    }

    async function reloadMisReservas(espacioId: string) {
        if (!token || !user) {
            setMisReservas([]);
            return;
        }

        try {
            setLoadingMisReservas(true);
            const ahoraIso = new Date().toISOString();
            const data = await listReservas({ espacioId, desde: ahoraIso }, token);
            const soloMias = data.filter(
                (r) => r.usuarioId === user.id && r.estado !== "CANCELADA"
            );
            setMisReservas(soloMias);
        } catch (e: any) {
            setError(e.message ?? "Error cargando tus reservas");
        } finally {
            setLoadingMisReservas(false);
        }
    }

    async function reloadCalendarMonth(monthDate: Date, espacioId: string) {
        try {
            setLoadingCalendar(true);
			const { desde, hasta } = getMonthRangeIso(monthDate);
			const data = await listReservas(
				{ espacioId, desde, hasta },
				token ?? undefined
			);

			const byDate = buildDayIntervalsByDate(data);
			const full = computeFullDays(byDate);

			setFullDays(full);
        } catch (e: any) {
            setError(e.message ?? "Error cargando disponibilidad del mes");
        } finally {
            setLoadingCalendar(false);
        }
    }

    useEffect(() => {
        if (!fecha) return;
        setLoadingSlots(true);
        reloadReservasDia(fecha, espacio.id)
            .catch((e) => setError(e.message ?? "Error cargando disponibilidad"))
            .finally(() => setLoadingSlots(false));
    }, [fecha, espacio.id]);

    useEffect(() => {
        void reloadMisReservas(espacio.id);
    }, [espacio.id, token, user?.id]);

    useEffect(() => {
        void reloadCalendarMonth(calendarMonth, espacio.id);
    }, [calendarMonth, espacio.id, token]);

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
            await reloadMisReservas(espacio.id);
        } catch (err: any) {
            setError(err?.message ?? "Error creando la reserva");
        } finally {
            setLoading(false);
        }
    }

    function solicitarCancelarReserva(reserva: Reserva) {
        if (!token) {
            setError("Debes iniciar sesión para cancelar una reserva.");
            return;
        }
        setReservaParaCancelar(reserva);
    }

    async function confirmarCancelarReserva() {
        if (!reservaParaCancelar || !token) return;

        try {
            setCancelandoId(reservaParaCancelar.id);
            setError(null);
            await updateReserva(reservaParaCancelar.id, { estado: "CANCELADA" }, token);
            await reloadMisReservas(espacio.id);
            if (fecha) {
                await reloadReservasDia(fecha, espacio.id);
            }
            setReservaParaCancelar(null);
        } catch (e: any) {
            setError(e.message ?? "Error al cancelar la reserva");
        } finally {
            setCancelandoId(null);
        }
    }

    const noHayHueco = !!fecha && !loadingSlots && !inicioOptions.length;
    const submitDisabled = loading || noHayHueco;

    // Datos derivados para el calendario mensual
    const calendarYear = calendarMonth.getFullYear();
    const calendarMonthIndex = calendarMonth.getMonth();
    const calendarLabel = calendarMonth.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
    });
    const firstDayOfMonth = new Date(calendarYear, calendarMonthIndex, 1);
    const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const calendarCells: Array<Date | null> = [];
    for (let i = 0; i < startWeekday; i++) {
        calendarCells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarCells.push(new Date(calendarYear, calendarMonthIndex, day));
    }

    const fechaLabel = fecha
        ? new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : "Selecciona un día en el calendario";

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
                                Capacidad:{espacio.aforo} personas
                            </p>
                        )}
                        <p className="text-sm text-muted">
                            Tipo: <b>{espacio.tipo}</b>
                        </p>

                        <div className="mt-5">
                            <h4 className="font-medium mb-2">Disponibilidad</h4>

                            {/* Calendario mensual */}
                            <div className="border border-borderSoft rounded-2xl p-3 bg-surfaceMuted/50">
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        type="button"
                                        className="text-sm px-2 py-1 rounded-full hover:bg-surfaceMuted"
                                        onClick={() =>
                                            setCalendarMonth(
                                                new Date(
                                                    calendarYear,
                                                    calendarMonthIndex - 1,
                                                    1
                                                )
                                            )
                                        }
                                    >
                                        «
                                    </button>
                                    <span className="text-sm font-medium capitalize">
                                        {calendarLabel}
                                    </span>
                                    <button
                                        type="button"
                                        className="text-sm px-2 py-1 rounded-full hover:bg-surfaceMuted"
                                        onClick={() =>
                                            setCalendarMonth(
                                                new Date(
                                                    calendarYear,
                                                    calendarMonthIndex + 1,
                                                    1
                                                )
                                            )
                                        }
                                    >
                                        »
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted mb-1">
                                    {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                                        <div key={d}>{d}</div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {calendarCells.map((date, idx) => {
                                        if (!date) {
                                            return (
                                                <div
                                                    key={`empty-${idx}`}
                                                    className="h-8 md:h-9"
                                                />
                                            );
                                        }
                                        const key = formatDateKey(date);
                                        const isSelected = fecha === key;
                                        const isFull = !!fullDays[key];
                                        const isDisabled = isFull;

                                        let className =
                                            "flex items-center justify-center rounded-full w-8 h-8 md:w-9 md:h-9 text-xs md:text-sm border-2 transition-colors ";
                                        if (isFull) {
                                            className +=
                                                "border-red-500 text-red-600 bg-white cursor-not-allowed opacity-80";
                                        } else if (isSelected) {
                                            className +=
                                                "border-transparent bg-emerald-600 text-white cursor-default";
                                        } else {
                                            className +=
                                                "border-transparent bg-primary text-dark hover:bg-primaryStrong cursor-pointer";
                                        }

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => {
                                                    if (isDisabled) return;
                                                    const dateStr = formatDateKey(date);
                                                    setFecha(dateStr);
                                                    setInicio("");
                                                    setFin("");
                                                }}
                                                className={className}
                                            >
                                                {date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-muted">
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-primary" />
                                        <span>Disponible</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-emerald-600" />
                                        <span>Día seleccionado</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full border-2 border-red-500" />
                                        <span>Completo</span>
                                    </div>
                                </div>

                                {loadingCalendar && (
                                    <p className="text-xs text-muted mt-2">
                                        Cargando calendario…
                                    </p>
                                )}
                            </div>

                            {fecha ? (
                                <div className="mt-5">
                                    <h5 className="text-sm font-medium mb-1">
                                        Horario para el {fecha.split("-").reverse().join("/")}
                                    </h5>
                                    <DayTimeline
                                        occupied={intervals}
                                        selected={
                                            inicio && fin
                                                ? {
                                                    s: toMinutes(inicio),
                                                    e: toMinutes(fin),
                                                }
                                                : undefined
                                        }
                                        step={30}
                                    />
                                    {!loadingSlots && reservasDia.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs text-muted mb-2">
                                                Reservas existentes en este día:
                                            </p>
                                            <ul className="space-y-1">
                                                {reservasDia.map((r) => {
                                                    const start = new Date(r.inicio).toLocaleTimeString(
                                                        "es-ES",
                                                        { hour: "2-digit", minute: "2-digit" }
                                                    );
                                                    const end = new Date(r.fin).toLocaleTimeString(
                                                        "es-ES",
                                                        { hour: "2-digit", minute: "2-digit" }
                                                    );
                                                    const isMine = !!user && r.usuarioId === user.id;
                                                    const ownerLabel = isMine
                                                        ? `${r.usuario?.name ?? "Usuario"} (tú)`
                                                        : (r.usuario?.name ?? "Usuario");

                                                    return (
                                                        <li
                                                            key={r.id}
                                                            className="text-xs text-dark bg-surfaceMuted border border-borderSoft rounded-lg px-2 py-1"
                                                        >
                                                            <span className="font-medium">{start} - {end}</span>
                                                            {" · Reservado por "}
                                                            <span className="font-semibold">{ownerLabel}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                    {loadingSlots && (
                                        <p className="text-sm text-muted mt-2">
                                            Actualizando disponibilidad…
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted mt-3">
                                    Selecciona un día en el calendario para ver el horario
                                    disponible.
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
                            <div className="w-full rounded-full border border-borderSoft bg-surfaceMuted px-4 py-2 text-sm mb-1 flex items-center justify-center">
                                <span className={fecha ? "text-dark" : "text-muted"}>
                                    {fechaLabel}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted">
                                Selecciona el día en el calendario de la izquierda.
                            </p>
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

                {user && (
                    <section className="rc-card-section">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-dark">
                                Tu reserva activa para {" "}
                                <span className="font-semibold">{espacio.nombre}</span>
                            </h3>
                        </div>

                        {loadingMisReservas && (
                            <p className="text-sm text-muted">
                                Cargando tus reservas…
                            </p>
                        )}

                        {!loadingMisReservas && misReservas.length === 0 && (
                            <p className="text-sm text-muted">
                                No tienes reservas activas para este espacio.
                            </p>
                        )}

                        {!loadingMisReservas && misReservas.length > 0 && (
                            <ul className="space-y-3">
                                {misReservas.map((r) => {
                                    const inicioDate = new Date(r.inicio);
                                    const finDate = new Date(r.fin);
                                    const fechaStr = inicioDate.toLocaleDateString("es-ES", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "long",
                                    });
                                    const horaInicio = inicioDate.toLocaleTimeString(
                                        "es-ES",
                                        { hour: "2-digit", minute: "2-digit" }
                                    );
                                    const horaFin = finDate.toLocaleTimeString("es-ES", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    });

                                    return (
                                        <li
                                            key={r.id}
                                            className="rc-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 border-2 border-primary"
                                        >
                                            <div className="text-sm">
                                                <div className="font-medium text-dark">
                                                    {fechaStr}
                                                </div>
                                                <div className="text-xs text-muted">
                                                    {horaInicio} – {horaFin}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {r.estado && r.estado !== "CANCELADA" && (
                                                    <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 text-xs px-3 py-1 border border-green-200">
                                                        {r.estado === "CONFIRMADA"
                                                            ? "Confirmada"
                                                            : "Pendiente"}
                                                    </span>
                                                )}
                                                <Button
                                                    type="button"
                                                    onClick={() => solicitarCancelarReserva(r)}
                                                    className="rc-btn-secondary bg-red-50 text-red-700 hover:bg-red-100"
                                                    disabled={cancelandoId === r.id}
                                                >
                                                    {cancelandoId === r.id
                                                        ? "Cancelando…"
                                                        : "Cancelar"}
                                                </Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                )}

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

                {reservaParaCancelar && (
                    <div
                        className="rc-modal-overlay"
                        onClick={() => cancelandoId === null && setReservaParaCancelar(null)}
                    >
                        <div
                            className="rc-modal-panel max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    cancelandoId === null && setReservaParaCancelar(null)
                                }
                                className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>

                            <div className="mb-6">
                                <h2 className="rc-modal-title">Cancelar reserva</h2>
                                <p className="rc-modal-subtitle">
                                    ¿Seguro que quieres cancelar tu reserva de
                                    {" "}
                                    <span className="font-semibold">
                                        {espacio.nombre}
                                    </span>
                                    ?
                                </p>
                            </div>

                            <div className="rc-modal-footer">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        cancelandoId === null && setReservaParaCancelar(null)
                                    }
                                    className="w-full md:w-auto rc-btn-secondary"
                                    disabled={cancelandoId !== null}
                                >
                                    Mantener reserva
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => void confirmarCancelarReserva()}
                                    className="w-full md:w-auto rc-btn-primary bg-red-600 hover:bg-red-700"
                                    disabled={cancelandoId !== null}
                                >
                                    {cancelandoId !== null
                                        ? "Cancelando…"
                                        : "Sí, cancelar reserva"}
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
