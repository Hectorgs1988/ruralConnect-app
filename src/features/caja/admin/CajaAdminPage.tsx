import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { listCajaProducts } from "@/api/caja";
import { useAuth } from "@/context/AuthContext";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";
import CajaProductForm from "./CajaProductForm";
import type { CajaProductDraft } from "./productForm";

const priceFormatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
});

export default function CajaAdminPage() {
    const { token } = useAuth();
    const [products, setProducts] = useState<CajaProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formProduct, setFormProduct] = useState<CajaProduct | null | undefined>(undefined);
    const [draftNotice, setDraftNotice] = useState<string | null>(null);
    const [deactivationProduct, setDeactivationProduct] = useState<CajaProduct | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadProducts() {
            if (!token) {
                setProducts([]);
                setError("No se pudo validar la sesión para cargar los productos.");
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
                        : "No se pudieron cargar los productos de Caja.");
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

    function openCreateForm() {
        setDraftNotice(null);
        setDeactivationProduct(null);
        setFormProduct(null);
    }

    function openEditForm(product: CajaProduct) {
        setDraftNotice(null);
        setDeactivationProduct(null);
        setFormProduct(product);
    }

    function acceptDraft(draft: CajaProductDraft) {
        setDraftNotice(
            `Borrador validado (${draft.id}: ${draft.priceCents} céntimos). No se ha guardado; la escritura se integrará en S2-05.`,
        );
    }

    function cancelForm() {
        setFormProduct(undefined);
    }

    return (
        <div className="rc-page">
            <Header />
            <main className="rc-shell flex-1 space-y-6 py-10">
                <h1 className="rc-hero-title">Gestión de productos de Caja</h1>
                <p className="text-center text-muted">
                    Administración de productos Caja, independiente del catálogo de Despensa.
                </p>

                <div className="flex justify-end">
                    <button type="button" className="rc-btn-primary" onClick={openCreateForm}>
                        Crear producto
                    </button>
                </div>

                {draftNotice && (
                    <p role="status" className="rc-card p-4">{draftNotice}</p>
                )}

                {formProduct !== undefined && (
                    <CajaProductForm
                        key={formProduct?.id ?? "new"}
                        product={formProduct ?? undefined}
                        onCancel={cancelForm}
                        onValidDraft={acceptDraft}
                    />
                )}

                {deactivationProduct && (
                    <section className="rc-card space-y-3 p-4" aria-labelledby="caja-deactivation-title">
                        <h2 id="caja-deactivation-title" className="font-semibold">
                            Desactivar {deactivationProduct.name}
                        </h2>
                        <p role="status">
                            La desactivación no se ha ejecutado. Se conectará a la API en S2-05.
                        </p>
                        <button
                            type="button"
                            className="rc-btn-secondary"
                            onClick={() => setDeactivationProduct(null)}
                        >
                            Cerrar
                        </button>
                    </section>
                )}

                <p className="text-sm text-muted">
                    El catálogo disponible actualmente solo devuelve productos activos. Los inactivos
                    no se pueden listar hasta que S2-05 incorpore un endpoint de administración.
                </p>

                {loading ? (
                    <p role="status" className="text-center text-muted">Cargando productos de Caja...</p>
                ) : error ? (
                    <p role="alert" className="text-center text-error">{error}</p>
                ) : products.length === 0 ? (
                    <p className="text-center text-muted">No hay productos activos en el catálogo.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-borderSoft">
                                    <th scope="col" className="p-3">ID</th>
                                    <th scope="col" className="p-3">Nombre</th>
                                    <th scope="col" className="p-3">Categoría</th>
                                    <th scope="col" className="p-3">Precio</th>
                                    <th scope="col" className="p-3">Estado</th>
                                    <th scope="col" className="p-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="border-b border-borderSoft">
                                        <td className="p-3">{product.id}</td>
                                        <td className="p-3">{product.name}</td>
                                        <td className="p-3">
                                            {product.category === "BEBIDA" ? "Bebida" : "Comida"}
                                        </td>
                                        <td className="p-3">{priceFormatter.format(product.priceCents / 100)}</td>
                                        <td className="p-3">
                                            {product.active ? "Activo" : "Inactivo"}
                                        </td>
                                        <td className="flex flex-wrap gap-2 p-3">
                                            <button
                                                type="button"
                                                className="rc-btn-secondary"
                                                onClick={() => openEditForm(product)}
                                            >
                                                Editar
                                            </button>
                                            {product.active && (
                                                <button
                                                    type="button"
                                                    className="rc-btn-secondary"
                                                    onClick={() => {
                                                        setDraftNotice(null);
                                                        setFormProduct(undefined);
                                                        setDeactivationProduct(product);
                                                    }}
                                                >
                                                    Desactivar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
