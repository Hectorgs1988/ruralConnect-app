import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";
import {
    priceCentsToEurosInput,
    validateCajaProductForm,
    type CajaProductDraft,
    type CajaProductFormErrors,
    type CajaProductFormValues,
} from "./productForm";

interface CajaProductFormProps {
    product?: CajaProduct;
    isSubmitting: boolean;
    onCancel: () => void;
    onValidDraft: (draft: CajaProductDraft) => Promise<void>;
    onRequestDelete?: () => void;
    isDeleteConfirming?: boolean;
    isDeleting?: boolean;
    onCancelDeleteConfirmation?: () => void;
    onConfirmDelete?: () => void;
}

function initialValues(product?: CajaProduct): CajaProductFormValues {
    return {
        id: product?.id ?? "",
        name: product?.name ?? "",
        category: product?.category ?? "",
        priceEuros: product ? priceCentsToEurosInput(product.priceCents) : "",
    };
}

export default function CajaProductForm({
    product,
    isSubmitting,
    onCancel,
    onValidDraft,
    onRequestDelete,
    isDeleteConfirming = false,
    isDeleting = false,
    onCancelDeleteConfirmation,
    onConfirmDelete,
}: CajaProductFormProps) {
    const mode = product ? "edit" : "create";
    const [values, setValues] = useState(() => initialValues(product));
    const [errors, setErrors] = useState<CajaProductFormErrors>({});
    const deleteActionRef = useRef<HTMLButtonElement>(null);
    const deleteCancelRef = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        (isDeleteConfirming ? deleteCancelRef.current : deleteActionRef.current)?.focus();
    }, [isDeleteConfirming]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSubmitting) return;
        const result = validateCajaProductForm(values, mode);
        setErrors(result.errors);
        if (result.valid) void onValidDraft(result.draft);
    }

    function update<K extends keyof CajaProductFormValues>(
        field: K,
        value: CajaProductFormValues[K],
    ) {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    }

    if (isDeleteConfirming && product) {
        return (
            <div className="space-y-4">
                <div>
                    <h2 id="caja-product-form-title" className="text-xl font-semibold">
                        Eliminar definitivamente «{product.name}»
                    </h2>
                    <p className="mt-2 font-medium text-error">
                        Esta acción no se puede deshacer.
                    </p>
                    <p className="mt-2 text-sm text-muted">
                        El producto se eliminará definitivamente de Caja.
                    </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        ref={deleteCancelRef}
                        type="button"
                        className="rc-btn-secondary min-h-11"
                        disabled={isDeleting}
                        onClick={onCancelDeleteConfirmation}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="caja-admin-danger-button min-h-11"
                        disabled={isDeleting}
                        onClick={onConfirmDelete}
                    >
                        {isDeleting ? "Eliminando..." : "Eliminar definitivamente"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 id="caja-product-form-title" className="text-xl font-semibold">
                    {product ? `Editar ${product.name}` : "Crear producto"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Gestiona los datos del producto Caja.
                </p>
            </div>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
                <label className="space-y-1">
                    <span>ID</span>
                    <input
                        className="w-full rounded-md border border-borderSoft bg-surfaceMuted px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary/60"
                        value={values.id}
                        onChange={(event) => update("id", event.target.value)}
                        readOnly={mode === "edit"}
                        aria-invalid={Boolean(errors.id)}
                        aria-describedby={errors.id ? "caja-product-id-error" : undefined}
                    />
                    {errors.id && <span id="caja-product-id-error" role="alert">{errors.id}</span>}
                </label>
                <label className="space-y-1">
                    <span>Nombre</span>
                    <input
                        className="w-full rounded-md border border-borderSoft bg-surfaceMuted px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary/60"
                        value={values.name}
                        onChange={(event) => update("name", event.target.value)}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "caja-product-name-error" : undefined}
                    />
                    {errors.name && <span id="caja-product-name-error" role="alert">{errors.name}</span>}
                </label>
                <label className="space-y-1">
                    <span>Categoría</span>
                    <select
                        className="w-full rounded-md border border-borderSoft bg-surfaceMuted px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary/60"
                        value={values.category}
                        onChange={(event) => update("category", event.target.value)}
                        aria-invalid={Boolean(errors.category)}
                        aria-describedby={errors.category ? "caja-product-category-error" : undefined}
                    >
                        <option value="">Selecciona una categoría</option>
                        <option value="BEBIDA">Bebida</option>
                        <option value="COMIDA">Comida</option>
                    </select>
                    {errors.category && (
                        <span id="caja-product-category-error" role="alert">{errors.category}</span>
                    )}
                </label>
                <label className="space-y-1">
                    <span>Precio (EUR)</span>
                    <input
                        className="w-full rounded-md border border-borderSoft bg-surfaceMuted px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary/60"
                        type="text"
                        inputMode="decimal"
                        value={values.priceEuros}
                        onChange={(event) => update("priceEuros", event.target.value)}
                        aria-invalid={Boolean(errors.priceEuros)}
                        aria-describedby={errors.priceEuros ? "caja-product-price-error" : undefined}
                    />
                    {errors.priceEuros && (
                        <span id="caja-product-price-error" role="alert">{errors.priceEuros}</span>
                    )}
                </label>
                <div className="flex flex-col gap-3 border-t border-borderSoft pt-4 sm:col-span-2">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            className="rc-btn-secondary min-h-11"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rc-btn-primary min-h-11"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Guardando..."
                                : mode === "create" ? "Guardar producto" : "Guardar cambios"}
                        </button>
                    </div>
                    {mode === "edit" && onRequestDelete && (
                        <div className="border-t border-borderSoft pt-3">
                            <p className="mb-2 text-xs text-muted">
                                Acción irreversible, separada de la edición habitual.
                            </p>
                            <button
                                ref={deleteActionRef}
                                type="button"
                                className="caja-admin-danger-link min-h-11"
                                onClick={onRequestDelete}
                                disabled={isSubmitting || isDeleting}
                            >
                                Eliminar definitivamente
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
