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
    totalCents: number;
    completionMessage: string | null;
    onIncrement: (lineId: string) => void;
    onDecrement: (lineId: string) => void;
    onRemove: (lineId: string) => void;
    onClear: () => void;
    onComplete: () => void;
}

export default function CajaTicket({
    lines,
    itemCount,
    totalCents,
    completionMessage,
    onIncrement,
    onDecrement,
    onRemove,
    onClear,
    onComplete,
}: CajaTicketProps) {
    const hasItems = lines.length > 0;

    return (
        <section className="rc-card space-y-4 p-5" aria-labelledby="caja-ticket-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="caja-ticket-title" className="text-xl font-semibold">Comanda actual</h2>
                <p aria-label="Número de artículos">
                    {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
                </p>
            </div>

            {hasItems ? (
                <ul className="divide-y divide-borderSoft">
                    {lines.map((line) => (
                        <li key={line.lineId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                            <div className="min-w-0">
                                <p className="font-medium">{line.name}</p>
                                <p className="text-sm text-muted">
                                    {line.quantity} × {formatCents(line.priceCents)}
                                    {" = "}
                                    {formatCents(line.priceCents * line.quantity)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2" aria-label={`Ajustar cantidad de ${line.name}`}>
                                <button
                                    type="button"
                                    className="rc-btn-secondary min-w-10 px-3"
                                    aria-label={`Restar una unidad de ${line.name} a ${formatCents(line.priceCents)}`}
                                    onClick={() => onDecrement(line.lineId)}
                                >
                                    −
                                </button>
                                <span aria-label={`Cantidad de ${line.name}`}>{line.quantity}</span>
                                <button
                                    type="button"
                                    className="rc-btn-secondary min-w-10 px-3"
                                    aria-label={`Sumar una unidad de ${line.name} a ${formatCents(line.priceCents)}`}
                                    onClick={() => onIncrement(line.lineId)}
                                >
                                    +
                                </button>
                                <button
                                    type="button"
                                    className="text-sm text-error underline"
                                    aria-label={`Quitar ${line.name} a ${formatCents(line.priceCents)} de la comanda`}
                                    onClick={() => onRemove(line.lineId)}
                                >
                                    Quitar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted">Aún no hay productos en la comanda.</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borderSoft pt-4">
                <p className="font-semibold">
                    Total: <span aria-label="Total de la comanda">{formatCents(totalCents)}</span>
                </p>
                <div className="flex gap-2">
                    <button type="button" className="rc-btn-secondary" onClick={onClear} disabled={!hasItems}>
                        Vaciar
                    </button>
                    <button type="button" className="rc-btn-primary" onClick={onComplete} disabled={!hasItems}>
                        Completar ticket
                    </button>
                </div>
            </div>
            {completionMessage && <p role="status">{completionMessage}</p>}
        </section>
    );
}
