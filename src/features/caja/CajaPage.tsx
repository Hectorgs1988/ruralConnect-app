import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { listCajaProducts } from "@/api/caja";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";

const priceFormatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
});

export default function CajaPage() {
    const { user, token } = useAuth();
    const [products, setProducts] = useState<CajaProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadProducts() {
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
    }, [token]);

    const productsByCategory = {
        BEBIDA: products.filter((product) => product.category === "BEBIDA"),
        COMIDA: products.filter((product) => product.category === "COMIDA"),
    };

    return (
        <div className="rc-page">
            <Header />
            <main className="rc-shell flex-1 space-y-4 py-10">
                <h1 className="rc-hero-title">Caja Susinos</h1>
                <p className="text-center text-sm text-muted">
                    Sesión iniciada como {user?.name}
                </p>
                {loading ? (
                    <p role="status" className="text-center text-muted">Cargando productos...</p>
                ) : error ? (
                    <p role="alert" className="text-center text-error">{error}</p>
                ) : products.length === 0 ? (
                    <p className="text-center text-muted">No hay productos disponibles.</p>
                ) : (
                    <div className="space-y-8" aria-label="Catálogo de Caja">
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
                                                className="rc-card flex items-center justify-between gap-4 p-4"
                                            >
                                                <span className="font-medium">{product.name}</span>
                                                <span className="whitespace-nowrap">
                                                    {priceFormatter.format(product.priceCents / 100)}
                                                </span>
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
