import type { FC } from "react";

type Interval = { s: number; e: number }; // minutos del día [s, e)
type Props = {
    occupied: Interval[];
    selected?: Interval;
    step?: number; // 30 por defecto
};

const within = (m: number, iv: Interval) => m >= iv.s && m < iv.e;
const HH = (m: number) => String(Math.floor(m / 60)).padStart(2, "0");
const slotTitle = (m: number) => {
    const h = Math.floor(m / 60), min = m % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

const DayTimeline: FC<Props> = ({ occupied, selected, step = 30 }) => {
    const total = (24 * 60) / step;
    const slots = Array.from({ length: total }, (_, i) => i * step);

    return (
        <div className="w-full">
            {/* marcas cada 2h */}
            <div className="relative mb-2">
                <div className="h-6" />
                <div className="absolute inset-0">
                    {Array.from({ length: 12 }).map((_, i) => {
                        const m = i * 120;
                        const left = `${(m / (24 * 60)) * 100}%`;
                        return (
                            <div key={i} className="absolute top-0" style={{ left }}>
                                <div className="w-px h-3 bg-gray-300" />
                                <div className="text-[10px] text-gray-500 -translate-x-1/2 mt-1">{HH(m)}:00</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* barra principal */}
            <div className="w-full rounded overflow-hidden border border-gray-200">
                <div className="flex">
                    {slots.map((m) => {
                        const sel = selected && within(m, selected);
                        const busy = occupied.some(iv => within(m, iv));
                        // 👇 prioridad: seleccionado > ocupado > libre
                        const bg = sel ? "bg-yellow-300" : busy ? "bg-red-300" : "bg-green-100";
                        return (
                            <div
                                key={m}
                                title={slotTitle(m)}
                                className={`h-6 flex-1 ${bg} border-r border-white last:border-0`}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-red-300 inline-block rounded-sm" /> Ocupado</span>
                <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-yellow-300 inline-block rounded-sm" /> Selección</span>
                <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-green-100 inline-block rounded-sm" /> Libre</span>
            </div>
        </div>
    );
};

export default DayTimeline;
