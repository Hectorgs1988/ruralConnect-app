import { useState, type FormEvent } from "react";
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
}: CajaProductFormProps) {
    const mode = product ? "edit" : "create";
    const [values, setValues] = useState(() => initialValues(product));
    const [errors, setErrors] = useState<CajaProductFormErrors>({});

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

    return (
        <section className="rc-card space-y-4 p-5" aria-labelledby="caja-product-form-title">
            <h2 id="caja-product-form-title" className="text-xl font-semibold">
                {product ? `Editar ${product.name}` : "Crear producto"}
            </h2>
            <p className="text-sm text-muted">
                Gestiona los datos del producto Caja.
            </p>
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
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button type="submit" className="rc-btn-primary" disabled={isSubmitting}>
                        {isSubmitting
                            ? "Guardando..."
                            : mode === "create" ? "Guardar producto" : "Guardar cambios"}
                    </button>
                    <button
                        type="button"
                        className="rc-btn-secondary"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </section>
    );
}
