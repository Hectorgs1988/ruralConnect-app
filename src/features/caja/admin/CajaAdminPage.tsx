import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
    createCajaProduct,
    deactivateCajaProduct,
    listAdminCajaProducts,
    updateCajaProduct,
} from "@/api/caja";
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
    const [success, setSuccess] = useState<string | null>(null);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
    const [deactivationProduct, setDeactivationProduct] = useState<CajaProduct | null>(null);

    async function loadProducts(): Promise<CajaProduct[]> {
        if (!token) throw new Error("No se pudo validar la sesión para cargar los productos.");
        return listAdminCajaProducts(token);
    }

    async function refreshProducts() {
        setLoading(true);
        setError(null);
        try {
            setProducts(await loadProducts());
        } catch (loadError) {
            setError(loadError instanceof Error
                ? loadError.message
                : "No se pudieron cargar los productos de Caja.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void refreshProducts();
    }, [token]);

    function openCreateForm() {
        setSuccess(null);
        setMutationError(null);
        setDeactivationProduct(null);
        setFormProduct(null);
    }

    function openEditForm(product: CajaProduct) {
        setSuccess(null);
        setMutationError(null);
        setDeactivationProduct(null);
        setFormProduct(product);
    }

    async function saveProduct(draft: CajaProductDraft) {
        if (!token || saving) return;
        setSaving(true);
        setMutationError(null);
        setSuccess(null);
        try {
            if (formProduct) {
                await updateCajaProduct(token, formProduct.id, {
                    name: draft.name,
                    category: draft.category,
                    priceCents: draft.priceCents,
                });
                setSuccess(`Producto ${formProduct.id} actualizado.`);
            } else {
                await createCajaProduct(token, draft);
                setSuccess(`Producto ${draft.id} creado.`);
            }
            setFormProduct(undefined);
            await refreshProducts();
        } catch (saveError) {
            setMutationError(saveError instanceof Error
                ? saveError.message
                : "No se pudo guardar el producto de Caja.");
        } finally {
            setSaving(false);
        }
    }

    function cancelForm() {
        if (saving) return;
        setFormProduct(undefined);
    }

    async function confirmDeactivation() {
        if (!token || !deactivationProduct || deactivatingId) return;
        const productToDeactivate = deactivationProduct;
        setDeactivatingId(productToDeactivate.id);
        setMutationError(null);
        setSuccess(null);
        try {
            await deactivateCajaProduct(token, productToDeactivate.id);
            setDeactivationProduct(null);
            setSuccess(`Producto ${productToDeactivate.id} desactivado.`);
            await refreshProducts();
        } catch (deactivateError) {
            setMutationError(deactivateError instanceof Error
                ? deactivateError.message
                : "No se pudo desactivar el producto de Caja.");
        } finally {
            setDeactivatingId(null);
        }
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

                {success && (
                    <p role="status" className="rc-card p-4">{success}</p>
                )}
                {mutationError && (
                    <p role="alert" className="rc-card p-4 text-error">{mutationError}</p>
                )}

                {formProduct !== undefined && (
                    <CajaProductForm
                        key={formProduct?.id ?? "new"}
                        product={formProduct ?? undefined}
                        isSubmitting={saving}
                        onCancel={cancelForm}
                        onValidDraft={saveProduct}
                    />
                )}

                {deactivationProduct && (
                    <section className="rc-card space-y-3 p-4" aria-labelledby="caja-deactivation-title">
                        <h2 id="caja-deactivation-title" className="font-semibold">
                            Confirmar desactivación: {deactivationProduct.name}
                        </h2>
                        <p>
                            El producto se conservará, pero dejará de aparecer en el catálogo activo.
                        </p>
                        <button
                            type="button"
                            className="rc-btn-primary"
                            disabled={deactivatingId !== null}
                            onClick={() => void confirmDeactivation()}
                        >
                            {deactivatingId === deactivationProduct.id ? "Desactivando..." : "Confirmar desactivación"}
                        </button>
                        <button
                            type="button"
                            className="rc-btn-secondary"
                            disabled={deactivatingId !== null}
                            onClick={() => setDeactivationProduct(null)}
                        >Cancelar</button>
                    </section>
                )}

                <p className="text-sm text-muted">
                    Los productos inactivos se muestran como tales. No existe una acción de reactivación
                    disponible en la API actual.
                </p>

                {loading ? (
                    <p role="status" className="text-center text-muted">Cargando productos de Caja...</p>
                ) : error ? (
                    <div className="space-y-3 text-center">
                        <p role="alert" className="text-error">{error}</p>
                        <button
                            type="button"
                            className="rc-btn-secondary"
                            onClick={() => void refreshProducts()}
                        >
                            Reintentar
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <p className="text-center text-muted">No hay productos en el catálogo de Caja.</p>
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
                                                disabled={saving || deactivatingId !== null}
                                                onClick={() => openEditForm(product)}
                                            >
                                                Editar
                                            </button>
                                            {product.active && (
                                                <button
                                                    type="button"
                                                    className="rc-btn-secondary"
                                                    disabled={saving || deactivatingId !== null}
                                                    onClick={() => {
                                                        setSuccess(null);
                                                        setMutationError(null);
                                                        setFormProduct(undefined);
                                                        setDeactivationProduct(product);
                                                    }}
                                                >
                                                    Desactivar
                                                </button>
                                            )}
                                            {!product.active && (
                                                <span className="text-sm text-muted">
                                                    Reactivación no disponible
                                                </span>
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
