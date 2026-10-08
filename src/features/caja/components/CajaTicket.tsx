import type { CajaTicketLine } from "@/features/caja/domain/ticket";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
});

function formatCents(priceCents: number): string {
    return currencyFormatter.format(priceCents / 100);
}

interface CajaTicketProps {
    lines: CajaTicketLine[];
    itemCount: number;
    onIncrement: (lineId: string) => void;
    onDecrement: (lineId: string) => void;
    onClear: () => void;
}

export default function CajaTicket({
    lines,
    itemCount,
    onIncrement,
    onDecrement,
    onClear,
}: CajaTicketProps) {
    return (
        <section aria-labelledby="caja-ticket-title">
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 id="caja-ticket-title" className="font-semibold">Revisar comanda</h3>
                <p aria-label="Número de artículos en revisión" className="text-sm text-muted">
                    {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
                </p>
            </div>
            {lines.length === 0 ? (
                <p className="text-muted">Aún no hay productos en la comanda.</p>
            ) : (
                <ul className="divide-y divide-borderSoft rounded-xl border border-borderSoft">
                    {lines.map((line) => (
                        <li key={line.lineId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 p-3">
                            <div className="min-w-0">
                                <p className="break-words font-medium">{line.name}</p>
                                <p className="text-sm text-muted">
                                    {formatCents(line.priceCents)} × {line.quantity}
                                    {" = "}
                                    {formatCents(line.priceCents * line.quantity)}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2" aria-label={`Ajustar cantidad de ${line.name}`}>
                                <button
                                    type="button"
                                    className="caja-touch-button"
                                    aria-label={`Restar una unidad de ${line.name} a ${formatCents(line.priceCents)}`}
                                    onClick={() => onDecrement(line.lineId)}
                                >
                                    −
                                </button>
                                <span className="min-w-8 text-center font-semibold" aria-label={`Cantidad de ${line.name}`}>
                                    {line.quantity}
                                </span>
                                <button
                                    type="button"
                                    className="caja-touch-button"
                                    aria-label={`Sumar una unidad de ${line.name} a ${formatCents(line.priceCents)}`}
                                    onClick={() => onIncrement(line.lineId)}
                                >
                                    +
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <div className="mt-3 flex justify-end border-t border-borderSoft pt-3">
                <button type="button" className="rc-btn-secondary min-h-11 px-4" onClick={onClear} disabled={lines.length === 0}>
                    Vaciar
                </button>
            </div>
        </section>
    );
}
