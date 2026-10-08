import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
    createCajaProduct,
    deactivateCajaProduct,
    deleteCajaProduct,
    listAdminCajaProducts,
    reactivateCajaProduct,
    updateCajaProduct,
} from "@/api/caja";
import { useAuth } from "@/context/AuthContext";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";
import CajaAdminDialog from "./CajaAdminDialog";
import CajaProductForm from "./CajaProductForm";
import type { CajaProductDraft } from "./productForm";

type ProductStatusFilter = "all" | "active" | "inactive";
type AdminDialogState =
    | { kind: "form"; product: CajaProduct | null }
    | { kind: "deactivate" | "reactivate"; product: CajaProduct }
    | null;

const priceFormatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
});

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export default function CajaAdminPage() {
    const { token } = useAuth();
    const [products, setProducts] = useState<CajaProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialog, setDialog] = useState<AdminDialogState>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
    const [reactivatingId, setReactivatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
    const listHeadingRef = useRef<HTMLHeadingElement>(null);
    const returnFocusRef = useRef<HTMLElement | null>(null);

    const isMutating = saving
        || deactivatingId !== null
        || reactivatingId !== null
        || deletingId !== null;

    const visibleProducts = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase("es");
        return products.filter((product) => {
            const matchesName = !normalizedSearch
                || product.name.toLocaleLowerCase("es").includes(normalizedSearch);
            const matchesStatus = statusFilter === "all"
                || (statusFilter === "active" ? product.active : !product.active);
            return matchesName && matchesStatus;
        });
    }, [products, search, statusFilter]);

    useEffect(() => {
        if (!success) return undefined;
        const timeout = window.setTimeout(() => setSuccess(null), 2800);
        return () => window.clearTimeout(timeout);
    }, [success]);

    async function refreshProducts() {
        setLoading(true);
        setError(null);
        try {
            if (!token) throw new Error("No se pudo validar la sesión para cargar los productos.");
            setProducts(await listAdminCajaProducts(token));
        } catch (loadError) {
            setError(errorMessage(loadError, "No se pudieron cargar los productos de Caja."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void refreshProducts();
    }, [token]);

    function clearFeedback() {
        setSuccess(null);
        setMutationError(null);
    }

    function openCreateForm(event: MouseEvent<HTMLButtonElement>) {
        returnFocusRef.current = event.currentTarget;
        clearFeedback();
        setConfirmingDelete(false);
        setDialog({ kind: "form", product: null });
    }

    function openEditForm(product: CajaProduct, event: MouseEvent<HTMLButtonElement>) {
        returnFocusRef.current = event.currentTarget;
        clearFeedback();
        setConfirmingDelete(false);
        setDialog({ kind: "form", product });
    }

    function closeDialog() {
        if (isMutating) return;
        setDialog(null);
        setConfirmingDelete(false);
        setMutationError(null);
    }

    async function saveProduct(draft: CajaProductDraft) {
        if (!token || saving || dialog?.kind !== "form") return;
        const editingProduct = dialog.product;
        setSaving(true);
        setMutationError(null);
        setSuccess(null);
        try {
            if (editingProduct) {
                await updateCajaProduct(token, editingProduct.id, {
                    name: draft.name,
                    category: draft.category,
                    priceCents: draft.priceCents,
                });
                setSuccess(`Producto ${editingProduct.id} actualizado.`);
            } else {
                await createCajaProduct(token, draft);
                setSuccess(`Producto ${draft.id} creado.`);
            }
            setDialog(null);
            setConfirmingDelete(false);
            await refreshProducts();
        } catch (saveError) {
            setMutationError(errorMessage(saveError, "No se pudo guardar el producto de Caja."));
        } finally {
            setSaving(false);
        }
    }

    async function confirmDeactivation() {
        if (!token || dialog?.kind !== "deactivate" || deactivatingId) return;
        const product = dialog.product;
        setDeactivatingId(product.id);
        setMutationError(null);
        setSuccess(null);
        try {
            await deactivateCajaProduct(token, product.id);
            setDialog(null);
            setSuccess(`Producto ${product.id} desactivado.`);
            await refreshProducts();
        } catch (deactivateError) {
            setMutationError(errorMessage(deactivateError, "No se pudo desactivar el producto de Caja."));
        } finally {
            setDeactivatingId(null);
        }
    }

    async function confirmReactivation() {
        if (!token || dialog?.kind !== "reactivate" || reactivatingId) return;
        const product = dialog.product;
        setReactivatingId(product.id);
        setMutationError(null);
        setSuccess(null);
        try {
            await reactivateCajaProduct(token, product.id);
            setDialog(null);
            setSuccess(`Producto ${product.id} reactivado.`);
            await refreshProducts();
        } catch (reactivateError) {
            setMutationError(errorMessage(reactivateError, "No se pudo reactivar el producto de Caja."));
        } finally {
            setReactivatingId(null);
        }
    }

    async function confirmDeletion() {
        if (!token || dialog?.kind !== "form" || !dialog.product || deletingId) return;
        const product = dialog.product;
        setDeletingId(product.id);
        setMutationError(null);
        setSuccess(null);
        try {
            await deleteCajaProduct(token, product.id);
            setProducts((current) => current.filter((item) => item.id !== product.id));
            setDialog(null);
            setConfirmingDelete(false);
            setSuccess(`Producto ${product.name} eliminado definitivamente.`);
        } catch (deleteError) {
            setMutationError(errorMessage(deleteError, "No se pudo eliminar el producto de Caja."));
        } finally {
            setDeletingId(null);
        }
    }

    function openLifecycleDialog(
        kind: "deactivate" | "reactivate",
        product: CajaProduct,
        event: MouseEvent<HTMLButtonElement>,
    ) {
        returnFocusRef.current = event.currentTarget;
        clearFeedback();
        setDialog({ kind, product });
    }

    const dialogTitleId = dialog?.kind === "form"
        ? "caja-product-form-title"
        : dialog?.kind === "deactivate"
            ? "caja-deactivation-title"
            : dialog?.kind === "reactivate"
                ? "caja-reactivation-title"
                : "";

    return (
        <div className="rc-page">
            <Header />
            <main className="rc-shell flex-1 space-y-6 py-6 md:py-10">
                <header className="space-y-2">
                    <h1 className="rc-hero-title">Gestión de productos de Caja</h1>
                    <p className="text-center text-sm text-muted md:text-base">
                        Administración de productos Caja, independiente del catálogo de Despensa.
                    </p>
                </header>

                <div className="flex justify-end">
                    <button
                        type="button"
                        className="rc-btn-primary min-h-11"
                        onClick={(event) => openCreateForm(event)}
                    >
                        Crear producto
                    </button>
                </div>

                {success && <p role="status" className="rc-card p-4">{success}</p>}

                <section aria-labelledby="caja-products-heading" className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border border-borderSoft bg-surface p-4 sm:flex-row sm:items-end">
                        <label className="flex-1 space-y-1">
                            <span className="text-sm font-medium">Buscar por nombre</span>
                            <input
                                type="search"
                                className="min-h-11 w-full rounded-lg border border-borderSoft bg-surfaceMuted px-3 text-dark focus:outline-none focus:ring-2 focus:ring-primary/60"
                                placeholder="Nombre del producto"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </label>
                        <label className="space-y-1 sm:w-48">
                            <span className="text-sm font-medium">Estado</span>
                            <select
                                className="min-h-11 w-full rounded-lg border border-borderSoft bg-surfaceMuted px-3 text-dark focus:outline-none focus:ring-2 focus:ring-primary/60"
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as ProductStatusFilter)}
                            >
                                <option value="all">Todos</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </label>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <h2
                            ref={listHeadingRef}
                            id="caja-products-heading"
                            className="text-lg font-semibold"
                            tabIndex={-1}
                        >
                            Productos
                        </h2>
                        {!loading && !error && (
                            <span className="text-sm text-muted">
                                {visibleProducts.length} {visibleProducts.length === 1 ? "producto" : "productos"}
                            </span>
                        )}
                    </div>

                    {mutationError && !dialog && (
                        <p role="alert" className="rc-card p-4 text-error">{mutationError}</p>
                    )}

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
                        <p className="rc-card p-5 text-center text-muted">
                            No hay productos en el catálogo de Caja.
                        </p>
                    ) : visibleProducts.length === 0 ? (
                        <p className="rc-card p-5 text-center text-muted">
                            No hay productos que coincidan con la búsqueda y el estado seleccionados.
                        </p>
                    ) : (
                        <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
                            {visibleProducts.map((product) => (
                                <li key={product.id} className="min-w-0">
                                    <article className="rc-card flex h-full min-w-0 flex-col gap-4 p-4">
                                        <div className="flex min-w-0 items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="break-words text-base font-semibold leading-snug">
                                                    {product.name}
                                                </h3>
                                                <p className="mt-1 break-all text-xs text-muted">{product.id}</p>
                                            </div>
                                            <span className={`caja-admin-status ${product.active
                                                ? "caja-admin-status-active"
                                                : "caja-admin-status-inactive"}`}
                                            >
                                                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
                                                {product.active ? "Activo" : "Inactivo"}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-borderSoft pt-3">
                                            <span className="text-sm text-muted">
                                                {product.category === "BEBIDA" ? "Bebida" : "Comida"}
                                            </span>
                                            <span className="text-lg font-bold tabular-nums">
                                                {priceFormatter.format(product.priceCents / 100)}
                                            </span>
                                        </div>

                                        <div className="mt-auto flex flex-wrap gap-2 border-t border-borderSoft pt-3">
                                            <button
                                                type="button"
                                                className="rc-btn-secondary min-h-10 flex-1 px-4"
                                                disabled={isMutating}
                                                onClick={(event) => openEditForm(product, event)}
                                            >
                                                Editar
                                            </button>
                                            {product.active ? (
                                                <button
                                                    type="button"
                                                    className="rc-btn-secondary min-h-10 flex-1 px-4"
                                                    disabled={isMutating}
                                                    onClick={(event) => openLifecycleDialog("deactivate", product, event)}
                                                >
                                                    Desactivar
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="rc-btn-secondary min-h-10 flex-1 px-4"
                                                    disabled={isMutating}
                                                    onClick={(event) => openLifecycleDialog("reactivate", product, event)}
                                                >
                                                    Reactivar
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
            <Footer />

            {dialog && (
                <CajaAdminDialog
                    labelledBy={dialogTitleId}
                    onClose={closeDialog}
                    fallbackFocusRef={listHeadingRef}
                    returnFocusRef={returnFocusRef}
                >
                    {mutationError && (
                        <p role="alert" className="mb-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                            {mutationError}
                        </p>
                    )}
                    {dialog.kind === "form" ? (
                        <CajaProductForm
                            key={dialog.product?.id ?? "new"}
                            product={dialog.product ?? undefined}
                            isSubmitting={saving}
                            onCancel={closeDialog}
                            onValidDraft={saveProduct}
                            onRequestDelete={dialog.product
                                ? () => {
                                    setMutationError(null);
                                    setConfirmingDelete(true);
                                }
                                : undefined}
                            isDeleteConfirming={confirmingDelete}
                            isDeleting={deletingId !== null}
                            onCancelDeleteConfirmation={() => {
                                setMutationError(null);
                                setConfirmingDelete(false);
                            }}
                            onConfirmDelete={() => void confirmDeletion()}
                        />
                    ) : dialog.kind === "deactivate" ? (
                        <div className="space-y-4">
                            <div>
                                <h2 id="caja-deactivation-title" className="text-xl font-semibold">
                                    Desactivar «{dialog.product.name}»
                                </h2>
                                <p className="mt-2 text-sm text-muted">
                                    El producto se conservará, pero dejará de aparecer en el catálogo activo.
                                    Podrás reactivarlo más adelante.
                                </p>
                            </div>
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    className="rc-btn-secondary min-h-11"
                                    disabled={isMutating}
                                    data-dialog-autofocus
                                    onClick={closeDialog}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="rc-btn-primary min-h-11"
                                    disabled={isMutating}
                                    onClick={() => void confirmDeactivation()}
                                >
                                    {deactivatingId ? "Desactivando..." : "Confirmar desactivación"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <h2 id="caja-reactivation-title" className="text-xl font-semibold">
                                    Reactivar «{dialog.product.name}»
                                </h2>
                                <p className="mt-2 text-sm text-muted">
                                    El producto volverá a aparecer en el catálogo activo de Caja.
                                </p>
                            </div>
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    className="rc-btn-secondary min-h-11"
                                    disabled={isMutating}
                                    data-dialog-autofocus
                                    onClick={closeDialog}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="rc-btn-primary min-h-11"
                                    disabled={isMutating}
                                    onClick={() => void confirmReactivation()}
                                >
                                    {reactivatingId ? "Reactivando..." : "Confirmar reactivación"}
                                </button>
                            </div>
                        </div>
                    )}
                </CajaAdminDialog>
            )}
        </div>
    );
}
