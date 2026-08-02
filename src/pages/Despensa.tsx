import { type FC, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/button";
import { checkoutDespensa, listMisComprasDespensa, listProductosDespensa } from "@/api/despensa";
import { useAuth } from "@/context/AuthContext";
import type { CheckoutDespensaResponse, CompraDespensa, ProductoDespensa } from "@/types/ProductoDespensa";

const formatEuro = (amountInCents: number) =>
    new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
    }).format(amountInCents / 100);

const Despensa: FC = () => {
    const { token, user } = useAuth();
    const [productos, setProductos] = useState<ProductoDespensa[]>([]);
    const [cantidades, setCantidades] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [lastCheckout, setLastCheckout] = useState<CheckoutDespensaResponse | null>(null);
    const [compras, setCompras] = useState<CompraDespensa[]>([]);

    const loadProductos = async () => {
        if (!token) {
            setProductos([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await listProductosDespensa(token);
            setProductos(data);
            setCantidades((current) => {
                const next: Record<string, number> = {};
                for (const producto of data) {
                    next[producto.id] = Math.min(current[producto.id] ?? 0, producto.unidadesDisponibles);
                }
                return next;
            });
        } catch (err: any) {
            setError(err?.message ?? "No se pudo cargar la despensa");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadProductos();
    }, [token]);

    useEffect(() => {
        if (!token) {
            setCompras([]);
            return;
        }

        const loadCompras = async () => {
            try {
                const data = await listMisComprasDespensa(token);
                setCompras(data);
            } catch {
                setCompras([]);
            }
        };

        void loadCompras();
    }, [token]);

    const cartItems = useMemo(() => {
        return productos
            .map((producto) => ({
                producto,
                cantidad: cantidades[producto.id] ?? 0,
            }))
            .filter((item) => item.cantidad > 0);
    }, [cantidades, productos]);

    const totalCentimos = useMemo(
        () => cartItems.reduce((sum, item) => sum + item.producto.precioCentimos * item.cantidad, 0),
        [cartItems]
    );

    const updateCantidad = (producto: ProductoDespensa, value: number) => {
        const nextValue = Number.isNaN(value)
            ? 0
            : Math.max(0, Math.min(producto.unidadesDisponibles, value));

        setCantidades((current) => ({
            ...current,
            [producto.id]: nextValue,
        }));
    };

    const handleCheckout = async () => {
        if (!token || cartItems.length === 0) return;

        try {
            setPaying(true);
            setError(null);
            setSuccess(null);

            const response = await checkoutDespensa(
                cartItems.map((item) => ({
                    productoId: item.producto.id,
                    cantidad: item.cantidad,
                })),
                token
            );

            setLastCheckout(response);
            setSuccess("Pago simulado correctamente. El stock ya se ha actualizado.");
            setCantidades({});
            await loadProductos();
            if (token) {
                const comprasActualizadas = await listMisComprasDespensa(token);
                setCompras(comprasActualizadas);
            }
        } catch (err: any) {
            setError(err?.message ?? "No se pudo completar la compra");
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="rc-page">
            <Header />

            <main className="flex-1 rc-shell py-10 space-y-8">
                <h1 className="rc-hero-title">Despensa</h1>
                <p className="rc-hero-subtitle">
                    Selecciona productos, simula el pago y actualiza el stock en tiempo real.
                </p>

                {user?.role === "ADMIN" && (
                    <div className="flex justify-end">
                        <Link
                            to="/GestionDespensa"
                            className="rc-btn-secondary"
                        >
                            Gestionar despensa
                        </Link>
                    </div>
                )}

                {error && (
                    <div className="rc-card-section border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rc-card-section border border-emerald-200 text-emerald-700 text-sm">
                        {success}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[2fr,1fr] mb-10">
                    <section className="rc-card-section space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold text-dark">Productos disponibles</h2>
                                <p className="text-sm text-muted mt-1">
                                    Stock actualizado tras cada compra simulada.
                                </p>
                            </div>
                            <Button type="button" variant="secondary" onClick={() => void loadProductos()}>
                                Actualizar
                            </Button>
                        </div>

                        {loading ? (
                            <p className="text-sm text-muted">Cargando productos...</p>
                        ) : productos.length === 0 ? (
                            <p className="text-sm text-muted">No hay productos dados de alta en la despensa.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {productos.map((producto) => {
                                    const cantidad = cantidades[producto.id] ?? 0;
                                    const agotado = producto.unidadesDisponibles === 0;

                                    return (
                                        <article key={producto.id} className="rc-card p-5 space-y-4 bg-white/95">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-dark">{producto.nombre}</h3>
                                                    <p className="text-sm text-muted mt-1 min-h-10">
                                                        {producto.descripcion || "Producto disponible en la despensa comunitaria."}
                                                    </p>
                                                </div>
                                                <span className="rc-pill whitespace-nowrap">
                                                    {formatEuro(producto.precioCentimos)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-dark">
                                                        {producto.unidadesDisponibles} unidades disponibles
                                                    </p>
                                                    <p className="text-xs text-muted mt-1">
                                                        {agotado ? "Temporalmente agotado" : "Elige cuántas quieres reservar"}
                                                    </p>
                                                </div>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={producto.unidadesDisponibles}
                                                    value={cantidad}
                                                    disabled={agotado}
                                                    onChange={(e) => updateCantidad(producto, Number(e.target.value))}
                                                    className="w-24 rounded-2xl border border-borderSoft bg-surface px-3 py-2 text-sm text-dark outline-none focus:ring-2 focus:ring-primaryStrong/40"
                                                />
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <aside className="rc-card-section space-y-5 h-fit xl:sticky xl:top-6">
                        <div>
                            <h2 className="text-xl font-semibold text-dark">Resumen del pedido</h2>
                            <p className="text-sm text-muted mt-1">
                                Pago simulado mediante pasarela de pruebas.
                            </p>
                        </div>

                        {cartItems.length === 0 ? (
                            <p className="text-sm text-muted">Todavía no has seleccionado productos.</p>
                        ) : (
                            <div className="space-y-3">
                                {cartItems.map(({ producto, cantidad }) => (
                                    <div key={producto.id} className="flex items-center justify-between gap-4 text-sm">
                                        <div>
                                            <p className="font-medium text-dark">{producto.nombre}</p>
                                            <p className="text-muted">{cantidad} x {formatEuro(producto.precioCentimos)}</p>
                                        </div>
                                        <span className="font-semibold text-dark">
                                            {formatEuro(producto.precioCentimos * cantidad)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-t border-borderSoft pt-4 flex items-center justify-between text-base font-semibold text-dark">
                            <span>Total</span>
                            <span>{formatEuro(totalCentimos)}</span>
                        </div>

                        <Button
                            type="button"
                            className="w-full"
                            disabled={cartItems.length === 0 || paying}
                            onClick={() => void handleCheckout()}
                        >
                            {paying ? "Procesando pago simulado..." : "Pagar ahora"}
                        </Button>

                        {lastCheckout && (
                            <div className="rounded-2xl bg-surfaceMuted border border-borderSoft p-4 text-sm space-y-2">
                                <p className="font-semibold text-dark">Última compra</p>
                                <p className="text-muted">Referencia: {lastCheckout.compraId}</p>
                                <p className="text-muted">Estado: pago simulado completado</p>
                                <p className="text-muted">Importe: {formatEuro(lastCheckout.totalCentimos)}</p>
                            </div>
                        )}
                    </aside>
                </div>

                <section className="rc-card-section space-y-5 mb-10">
                    <div>
                        <h2 className="text-xl font-semibold text-dark">Historial de compras</h2>
                        <p className="text-sm text-muted mt-1">
                            Últimos pedidos realizados por tu cuenta en la despensa.
                        </p>
                    </div>

                    {compras.length === 0 ? (
                        <p className="text-sm text-muted">Todavía no hay compras registradas.</p>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {compras.map((compra) => (
                                <article key={compra.id} className="rc-card p-5 space-y-4 bg-white/95">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-dark">Pedido {compra.id.slice(0, 8)}</h3>
                                            <p className="text-sm text-muted mt-1">
                                                {new Date(compra.createdAt).toLocaleString("es-ES")}
                                            </p>
                                        </div>
                                        <span className="rc-pill">{formatEuro(compra.totalCentimos)}</span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        {compra.items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between gap-4">
                                                <span className="text-dark">{item.nombreProducto} x {item.cantidad}</span>
                                                <span className="font-medium text-dark">{formatEuro(item.subtotalCentimos)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Despensa;
