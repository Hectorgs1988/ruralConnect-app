import { useEffect, useReducer, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { listCajaProducts } from "@/api/caja";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";
import CajaTicket from "@/features/caja/components/CajaTicket";
import {
    cajaTicketReducer,
    getCajaTicketItemCount,
    getCajaTicketTotalCents,
} from "@/features/caja/domain/ticket";
import {
    calculateCajaVoucher,
    type CajaVoucherType,
} from "@/features/caja/domain/voucher";

const priceFormatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
});

export default function CajaPage() {
    const { user, token } = useAuth();
    const [products, setProducts] = useState<CajaProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ticketLines, dispatchTicket] = useReducer(cajaTicketReducer, []);
    const [refreshCatalog, setRefreshCatalog] = useState(0);
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);
    const [voucherModeActive, setVoucherModeActive] = useState(false);
    const [voucherType, setVoucherType] = useState<CajaVoucherType>("24");

    useEffect(() => {
        let isMounted = true;

        async function loadProducts() {
            setProducts([]);
            if (!token) {
                setError("No se pudo validar la sesión para cargar el catálogo.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const catalog = await listCajaProducts(token);
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
    }, [token, refreshCatalog]);

    const productsByCategory = {
        BEBIDA: products.filter((product) => product.category === "BEBIDA"),
        COMIDA: products.filter((product) => product.category === "COMIDA"),
    };
    const ticketItemCount = getCajaTicketItemCount(ticketLines);
    const ticketTotalCents = getCajaTicketTotalCents(ticketLines);
    let voucherInstruction: string | null = null;
    let voucherError: string | null = null;
    if (voucherModeActive && ticketTotalCents > 0) {
        try {
            voucherInstruction = calculateCajaVoucher(ticketTotalCents, voucherType)?.instruction ?? null;
        } catch (calculationError) {
            voucherError = calculationError instanceof RangeError
                ? "No se puede calcular la guía del vale porque el total excede el límite seguro."
                : "No se pudo calcular la guía del vale.";
        }
    }

    function completeTicket() {
        if (ticketLines.length === 0) return;
        const completedTotal = new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        }).format(ticketTotalCents / 100);
        setCompletionMessage(`Ticket completado: ${completedTotal}. No se ha guardado un pedido.`);
        setVoucherModeActive(false);
        dispatchTicket({ type: "clear" });
    }

    return (
        <div className="rc-page">
            <Header />
            <main className="rc-shell flex-1 space-y-4 py-10">
                <h1 className="rc-hero-title">Caja Susinos</h1>
                <p className="text-center text-sm text-muted">
                    Sesión iniciada como {user?.name}
                </p>
                <CajaTicket
                    lines={ticketLines}
                    itemCount={ticketItemCount}
                    totalCents={ticketTotalCents}
                    completionMessage={completionMessage}
                    voucherModeActive={voucherModeActive}
                    voucherType={voucherType}
                    voucherInstruction={voucherInstruction}
                    voucherError={voucherError}
                    onIncrement={(lineId) => dispatchTicket({ type: "increment", lineId })}
                    onDecrement={(lineId) => dispatchTicket({ type: "decrement", lineId })}
                    onRemove={(lineId) => dispatchTicket({ type: "remove", lineId })}
                    onClear={() => {
                        dispatchTicket({ type: "clear" });
                        setVoucherModeActive(false);
                        setCompletionMessage(null);
                    }}
                    onComplete={completeTicket}
                    onToggleVoucherMode={() => setVoucherModeActive((active) => !active)}
                    onSelectVoucherType={setVoucherType}
                />
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
                    <p className="text-center text-muted">No hay productos disponibles.</p>
                ) : (
                    <div className="space-y-8" aria-label="Catálogo de Caja">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="rc-btn-secondary"
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
                                    <h2 id={`caja-${category}`} className="mb-3 text-xl font-semibold">
                                        {category === "BEBIDA" ? "Bebida" : "Comida"}
                                    </h2>
                                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {categoryProducts.map((product) => (
                                            <li
                                                key={product.id}
                                                className="rc-card"
                                            >
                                                <button
                                                    type="button"
                                                    className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-primarySoft"
                                                    aria-label={`Añadir ${product.name} a la comanda`}
                                                    onClick={() => {
                                                        dispatchTicket({ type: "add", product });
                                                        setCompletionMessage(null);
                                                    }}
                                                >
                                                    <span className="font-medium">{product.name}</span>
                                                    <span className="whitespace-nowrap">
                                                        {priceFormatter.format(product.priceCents / 100)}
                                                        {ticketLines.some((line) => line.productId === product.id) && (
                                                            <span className="ml-2 text-sm text-muted">
                                                                ×{ticketLines
                                                                    .filter((line) => line.productId === product.id)
                                                                    .reduce((total, line) => total + line.quantity, 0)}
                                                            </span>
                                                        )}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
