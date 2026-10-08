import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import type { CajaTicketLine } from "@/features/caja/domain/ticket";
import { CAJA_VOUCHERS, type CajaVoucherType } from "@/features/caja/domain/voucher";
import CajaTicket from "@/features/caja/components/CajaTicket";

type CajaPaymentMethod = "cash" | CajaVoucherType;

interface CajaCheckoutPanelProps {
    lines: CajaTicketLine[];
    itemCount: number;
    totalCents: number;
    paymentMethod: CajaPaymentMethod | null;
    cashInput: string;
    cashReceivedCents: number | null;
    cashPresets: number[];
    cashError: string | null;
    changeCents: number | null;
    voucherInstruction: string | null;
    voucherError: string | null;
    isCompleting: boolean;
    returnFocus: () => HTMLElement | null;
    onClose: () => void;
    onSelectMethod: (method: CajaPaymentMethod) => void;
    onCashInputChange: (value: string) => void;
    onSelectCashPreset: (amountCents: number) => void;
    onIncrement: (lineId: string) => void;
    onDecrement: (lineId: string) => void;
    onClear: () => void;
    onConfirm: () => void;
}

const currencyFormatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
});
const voucherTotalFormatter = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatCents(priceCents: number): string {
    return currencyFormatter.format(priceCents / 100);
}

export default function CajaCheckoutPanel({
    lines,
    itemCount,
    totalCents,
    paymentMethod,
    cashInput,
    cashReceivedCents,
    cashPresets,
    cashError,
    changeCents,
    voucherInstruction,
    voucherError,
    isCompleting,
    returnFocus,
    onClose,
    onSelectMethod,
    onCashInputChange,
    onSelectCashPreset,
    onIncrement,
    onDecrement,
    onClear,
    onConfirm,
}: CajaCheckoutPanelProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const cashDetailsRef = useRef<HTMLElement>(null);
    const cashChangeRef = useRef<HTMLDivElement>(null);
    const voucherDetailsRef = useRef<HTMLElement>(null);
    const previousChangeVisible = useRef(changeCents !== null);

    const scrollTargetIntoView = useCallback((target: HTMLElement | null) => {
        const container = contentRef.current;
        if (!container || !target) return;
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const relativeTop = container.scrollTop + targetRect.top - containerRect.top;
        const relativeBottom = relativeTop + targetRect.height;
        let top = container.scrollTop;
        if (targetRect.height > container.clientHeight) {
            top = relativeTop - 16;
        } else if (relativeBottom > container.scrollTop + container.clientHeight) {
            top += relativeBottom - (container.scrollTop + container.clientHeight) + 16;
        } else if (relativeTop < container.scrollTop) {
            top = relativeTop - 16;
        }
        top = Math.max(0, top);
        if (typeof container.scrollTo === "function") {
            container.scrollTo({ top, behavior: "smooth" });
        } else {
            container.scrollTop = top;
        }
    }, []);

    useEffect(() => {
        dialogRef.current?.focus();

        return () => returnFocus()?.focus();
    }, [returnFocus]);

    useEffect(() => {
        const target = paymentMethod === "cash"
            ? cashDetailsRef.current
            : paymentMethod === "24" || paymentMethod === "12"
                ? voucherDetailsRef.current
                : null;
        if (!target) return undefined;

        const frame = window.requestAnimationFrame(() => scrollTargetIntoView(target));
        return () => window.cancelAnimationFrame(frame);
    }, [paymentMethod, scrollTargetIntoView]);

    useEffect(() => {
        const becameVisible = !previousChangeVisible.current && changeCents !== null;
        previousChangeVisible.current = changeCents !== null;
        if (!becameVisible || paymentMethod !== "cash") return undefined;

        const frame = window.requestAnimationFrame(() => scrollTargetIntoView(cashChangeRef.current));
        return () => window.cancelAnimationFrame(frame);
    }, [cashInput, changeCents, paymentMethod, scrollTargetIntoView]);

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
        }
        if (event.key !== "Tab") return;

        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            first.focus();
        }
    }

    const canConfirm = lines.length > 0
        && !isCompleting
        && (paymentMethod === "cash"
            ? cashReceivedCents !== null && cashReceivedCents >= totalCents
            : paymentMethod !== null && voucherError === null && voucherInstruction !== null);

    return (
        <div
            className="caja-checkout-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                className="caja-checkout-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="caja-checkout-title"
                tabIndex={-1}
                onKeyDown={handleKeyDown}
            >
                <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-borderSoft bg-surface px-4 py-3">
                    <h2 id="caja-checkout-title" className="text-xl font-bold">Cobrar</h2>
                    <button type="button" className="caja-touch-button" aria-label="Cerrar cobro" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div ref={contentRef} className="caja-checkout-content space-y-4 px-4 py-4">
                    <p className="text-center text-4xl font-bold tabular-nums" aria-label="Total revisado">
                        {formatCents(totalCents)}
                    </p>

                    <CajaTicket
                        lines={lines}
                        itemCount={itemCount}
                        onIncrement={onIncrement}
                        onDecrement={onDecrement}
                        onClear={onClear}
                    />

                    <fieldset>
                        <legend className="mb-2 font-semibold">Forma de pago</legend>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                className={`caja-method-button ${paymentMethod === "cash" ? "is-selected" : ""}`}
                                aria-pressed={paymentMethod === "cash"}
                                onClick={() => onSelectMethod("cash")}
                            >
                                Efectivo
                            </button>
                            {([CAJA_VOUCHERS["24"], CAJA_VOUCHERS["12"]]).map((voucher) => (
                                <button
                                    key={voucher.id}
                                    type="button"
                                    className={`caja-method-button ${paymentMethod === voucher.id ? "is-selected" : ""}`}
                                    aria-pressed={paymentMethod === voucher.id}
                                    onClick={() => onSelectMethod(voucher.id)}
                                >
                                    {voucher.label}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    {paymentMethod === "cash" && (
                        <section ref={cashDetailsRef} className="space-y-3 scroll-mt-4" aria-label="Pago en efectivo">
                            <button
                                type="button"
                                className={`rc-btn-secondary min-h-11 px-4 ${cashReceivedCents === totalCents ? "is-active" : ""}`}
                                aria-pressed={cashReceivedCents === totalCents}
                                onClick={() => {
                                    onSelectCashPreset(totalCents);
                                    previousChangeVisible.current = true;
                                    window.requestAnimationFrame(() => scrollTargetIntoView(cashChangeRef.current));
                                }}
                            >
                                Exacto
                            </button>
                            <div className="flex flex-wrap gap-2" role="group" aria-label="Importes recibidos sugeridos">
                                {cashPresets.map((amountCents) => (
                                    <button
                                        key={amountCents}
                                        type="button"
                                        className={`rc-btn-secondary min-h-11 px-4 ${cashReceivedCents === amountCents ? "is-active" : ""}`}
                                        aria-pressed={cashReceivedCents === amountCents}
                                        onClick={() => {
                                            onSelectCashPreset(amountCents);
                                            previousChangeVisible.current = true;
                                            window.requestAnimationFrame(() => scrollTargetIntoView(cashChangeRef.current));
                                        }}
                                    >
                                        {formatCents(amountCents)}
                                    </button>
                                ))}
                            </div>
                            <label className="block space-y-1 font-medium" htmlFor="caja-cash-amount">
                                Importe recibido
                                <input
                                    id="caja-cash-amount"
                                    className="w-full rounded-xl border border-borderSoft bg-surface px-4 py-3 text-lg text-dark"
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="Ej. 20,00"
                                    value={cashInput}
                                    aria-describedby="caja-cash-feedback"
                                    onChange={(event) => onCashInputChange(event.target.value)}
                                />
                            </label>
                            <div ref={cashChangeRef} id="caja-cash-feedback" aria-live="polite" className="min-h-6 scroll-mt-4">
                                {cashError ? (
                                    <p role="alert" className="text-error">{cashError}</p>
                                ) : changeCents !== null ? (
                                    <p className="text-center text-2xl font-bold">
                                        Cambio: <span aria-label="Cambio">{formatCents(changeCents)}</span>
                                    </p>
                                ) : null}
                            </div>
                        </section>
                    )}

                    {(paymentMethod === "24" || paymentMethod === "12") && (
                        <section ref={voucherDetailsRef} className="rounded-xl bg-primarySoft p-3 scroll-mt-4" aria-live="polite">
                            <h3 className="font-semibold">{CAJA_VOUCHERS[paymentMethod].label}</h3>
                            {voucherError ? (
                                <p role="alert" className="text-error">{voucherError}</p>
                            ) : voucherInstruction ? (
                                <p className="mt-1">
                                    Total: <strong>{voucherTotalFormatter.format(totalCents / 100)} EUR</strong>
                                    {" - "}
                                    {voucherInstruction}
                                </p>
                            ) : null}
                        </section>
                    )}
                </div>

                <footer className="caja-checkout-footer">
                    <p className="mb-2 text-center text-xs text-muted">
                        Solo se completa este ticket.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" className="rc-btn-secondary min-h-12" onClick={onClose}>
                            Volver
                        </button>
                        <button
                            type="button"
                            className="rc-btn-primary min-h-12 text-base"
                            disabled={!canConfirm}
                            onClick={onConfirm}
                        >
                            Confirmar ticket
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
