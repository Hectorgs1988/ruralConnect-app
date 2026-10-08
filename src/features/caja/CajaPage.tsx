import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { listCajaProducts } from "@/api/caja";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";
import CajaCheckoutPanel from "@/features/caja/components/CajaCheckoutPanel";
import {
    cajaTicketReducer,
    getCajaTicketItemCount,
    getCajaTicketTotalCents,
} from "@/features/caja/domain/ticket";
import {
    calculateCajaVoucher,
    type CajaVoucherType,
} from "@/features/caja/domain/voucher";
import {
    formatCajaCashInput,
    getCajaCashPresets,
    parseCajaCashAmount,
} from "@/features/caja/domain/cash";

const priceFormatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
});

export default function CajaPage() {
    const [products, setProducts] = useState<CajaProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ticketLines, dispatchTicket] = useReducer(cajaTicketReducer, []);
    const [refreshCatalog, setRefreshCatalog] = useState(0);
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | CajaVoucherType | null>(null);
    const [voucherType, setVoucherType] = useState<CajaVoucherType>("24");
    const [cashInput, setCashInput] = useState("");
    const [isCompleting, setIsCompleting] = useState(false);
    const completionInProgress = useRef(false);
    const checkoutTrigger = useRef<HTMLButtonElement>(null);
    const returnFocusToCheckout = useCallback(() => checkoutTrigger.current, []);

    useEffect(() => {
        let isMounted = true;

        async function loadProducts() {
            setProducts([]);
            setLoading(true);
            setError(null);
            try {
                const catalog = await listCajaProducts();
                if (isMounted) setProducts(catalog);
            } catch (loadError) {
                if (isMounted) {
                    setError(loadError instanceof Error
                        ? loadError.message
                        : "No se pudo cargar el catálogo de Caja.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        void loadProducts();
        return () => {
            isMounted = false;
        };
    }, [refreshCatalog]);

    useEffect(() => {
        if (!completionMessage) return undefined;
        const timeout = window.setTimeout(() => setCompletionMessage(null), 2500);
        return () => window.clearTimeout(timeout);
    }, [completionMessage]);

    const productsByCategory = {
        BEBIDA: products.filter((product) => product.category === "BEBIDA"),
        COMIDA: products.filter((product) => product.category === "COMIDA"),
    };
    const selectedQuantities = new Map<string, number>();
    for (const line of ticketLines) {
        selectedQuantities.set(
            line.productId,
            (selectedQuantities.get(line.productId) ?? 0) + line.quantity,
        );
    }
    const ticketItemCount = getCajaTicketItemCount(ticketLines);
    const ticketTotalCents = getCajaTicketTotalCents(ticketLines);
    let voucherInstruction: string | null = null;
    let voucherError: string | null = null;
    if ((paymentMethod === "24" || paymentMethod === "12") && ticketTotalCents > 0) {
        try {
            voucherInstruction = calculateCajaVoucher(ticketTotalCents, voucherType)?.instruction ?? null;
        } catch (calculationError) {
            voucherError = calculationError instanceof RangeError
                ? "No se puede calcular la guía del vale porque el total excede el límite seguro."
                : "No se pudo calcular la guía del vale.";
        }
    }

    const cashReceivedCents = cashInput === "" ? null : parseCajaCashAmount(cashInput);
    const cashError = paymentMethod !== "cash" || cashInput === ""
        ? null
        : cashReceivedCents === null
            ? "Introduce un importe válido con un máximo de dos decimales."
            : cashReceivedCents < ticketTotalCents
                ? "El importe recibido no alcanza el total."
                : null;
    const changeCents = paymentMethod === "cash"
        && cashReceivedCents !== null
        && cashReceivedCents >= ticketTotalCents
        ? cashReceivedCents - ticketTotalCents
        : null;

    function resetCheckoutState() {
        setPaymentMethod(null);
        setVoucherType("24");
        setCashInput("");
        setIsCompleting(false);
        completionInProgress.current = false;
    }

    function openCheckout() {
        if (ticketLines.length === 0) return;
        resetCheckoutState();
        setCheckoutOpen(true);
    }

    function closeCheckout() {
        setCheckoutOpen(false);
        resetCheckoutState();
    }

    function completeTicket() {
        if (completionInProgress.current || ticketLines.length === 0 || paymentMethod === null) return;
        if (paymentMethod === "cash" && (cashReceivedCents === null || cashReceivedCents < ticketTotalCents)) return;
        if (paymentMethod !== "cash" && (voucherError || !voucherInstruction)) return;

        completionInProgress.current = true;
        setIsCompleting(true);
        setCompletionMessage("Ticket completado");
        dispatchTicket({ type: "clear" });
        setCheckoutOpen(false);
        setPaymentMethod(null);
        setVoucherType("24");
        setCashInput("");
    }

    return (
        <div className="rc-page">
            <header className="w-full border-b border-borderSoft bg-surface" aria-hidden={checkoutOpen} inert={checkoutOpen}>
                <div className="rc-shell flex h-14 items-center">
                    <span className="text-base font-bold text-dark">Caja Susinos</span>
                </div>
            </header>
            <main
                className="rc-shell flex-1 space-y-4 pb-32 pt-4 sm:pt-6"
                aria-hidden={checkoutOpen}
                inert={checkoutOpen}
            >
                <h1 className="sr-only">Caja Susinos</h1>
                {completionMessage && <p role="status" className="rounded-xl bg-primarySoft p-3">{completionMessage}</p>}
                {loading ? (
                    <p role="status" className="text-center text-muted">Cargando productos...</p>
                ) : error ? (
                    <div className="space-y-3 text-center">
                        <p role="alert" className="text-error">{error}</p>
                        <button
                            type="button"
                            className="rc-btn-secondary"
                            onClick={() => setRefreshCatalog((attempt) => attempt + 1)}
                        >
                            Reintentar catálogo
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="space-y-3 text-center">
                        <p className="text-muted">No hay productos disponibles.</p>
                        <button
                            type="button"
                            className="rc-btn-secondary min-h-10 px-4 text-xs"
                            onClick={() => setRefreshCatalog((attempt) => attempt + 1)}
                        >
                            Actualizar catálogo
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5" aria-label="Catálogo de Caja">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="rc-btn-secondary min-h-10 px-4 text-xs"
                                onClick={() => setRefreshCatalog((attempt) => attempt + 1)}
                            >
                                Actualizar catálogo
                            </button>
                        </div>
                        {(["BEBIDA", "COMIDA"] as const).map((category) => {
                            const categoryProducts = productsByCategory[category];
                            if (categoryProducts.length === 0) return null;

                            return (
                                <section key={category} aria-labelledby={`caja-${category}`}>
                                    <h2 id={`caja-${category}`} className="mb-2 text-lg font-semibold">
                                        {category === "BEBIDA" ? "Bebida" : "Comida"}
                                    </h2>
                                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                        {categoryProducts.map((product) => {
                                            const selectedQuantity = selectedQuantities.get(product.id) ?? 0;
                                            return (
                                                <li key={product.id} className="min-w-0">
                                                    <div className={`caja-product-card ${selectedQuantity > 0 ? "is-selected" : ""}`}>
                                                        <button
                                                            type="button"
                                                            className="caja-product-button"
                                                            aria-label={`Añadir ${product.name} a la comanda`}
                                                            aria-pressed={selectedQuantity > 0}
                                                            onClick={() => {
                                                                dispatchTicket({ type: "add", product });
                                                                setCompletionMessage(null);
                                                            }}
                                                        >
                                                            <span className="line-clamp-2 min-w-0 break-words font-medium" title={product.name}>
                                                                {product.name}
                                                            </span>
                                                            <span className="font-semibold">
                                                                {priceFormatter.format(product.priceCents / 100)}
                                                            </span>
                                                        </button>
                                                        {selectedQuantity > 0 && (
                                                            <div className="caja-catalog-quantity" aria-label={`Ajustar cantidad de ${product.name}`}>
                                                                <button
                                                                    type="button"
                                                                    className="caja-touch-button"
                                                                    aria-label={`Restar una unidad de ${product.name}`}
                                                                    onClick={() => {
                                                                        const line = ticketLines.find((ticketLine) =>
                                                                            ticketLine.productId === product.id,
                                                                        );
                                                                        if (line) dispatchTicket({ type: "decrement", lineId: line.lineId });
                                                                    }}
                                                                >
                                                                    −
                                                                </button>
                                                                <span aria-label={`Cantidad seleccionada de ${product.name}`}>
                                                                    ×{selectedQuantity}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            );
                        })}
                    </div>
                )}
            </main>
            <footer className="caja-sticky-checkout" aria-hidden={checkoutOpen} inert={checkoutOpen}>
                <div className="rc-shell flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                        <p aria-label="Número de artículos" className="text-xs text-muted">
                            {ticketItemCount} {ticketItemCount === 1 ? "artículo" : "artículos"}
                        </p>
                        <p className="truncate text-xl font-bold tabular-nums" aria-label="Total de la comanda">
                            {priceFormatter.format(ticketTotalCents / 100)}
                        </p>
                    </div>
                    <button
                        ref={checkoutTrigger}
                        type="button"
                        className="rc-btn-primary min-h-12 min-w-32 px-6 text-base"
                        disabled={ticketItemCount === 0}
                        onClick={openCheckout}
                    >
                        Cobrar
                    </button>
                </div>
            </footer>
            {checkoutOpen && (
                <CajaCheckoutPanel
                    lines={ticketLines}
                    itemCount={ticketItemCount}
                    totalCents={ticketTotalCents}
                    paymentMethod={paymentMethod}
                    cashInput={cashInput}
                    cashReceivedCents={cashReceivedCents}
                    cashPresets={getCajaCashPresets(ticketTotalCents)}
                    cashError={cashError}
                    changeCents={changeCents}
                    voucherInstruction={voucherInstruction}
                    voucherError={voucherError}
                    isCompleting={isCompleting}
                    returnFocus={returnFocusToCheckout}
                    onClose={closeCheckout}
                    onSelectMethod={(method) => {
                        setPaymentMethod(method);
                        setCashInput("");
                        if (method === "24" || method === "12") setVoucherType(method);
                    }}
                    onCashInputChange={setCashInput}
                    onSelectCashPreset={(amountCents) => setCashInput(formatCajaCashInput(amountCents))}
                    onIncrement={(lineId) => dispatchTicket({ type: "increment", lineId })}
                    onDecrement={(lineId) => dispatchTicket({ type: "decrement", lineId })}
                    onClear={() => {
                        dispatchTicket({ type: "clear" });
                        closeCheckout();
                    }}
                    onConfirm={completeTicket}
                />
            )}
        </div>
    );
}
