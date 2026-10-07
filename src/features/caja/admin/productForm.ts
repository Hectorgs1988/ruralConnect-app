import type { CajaProductCategory } from "@/features/caja/types/CajaProduct";

export interface CajaProductFormValues {
    id: string;
    name: string;
    category: string;
    priceEuros: string;
}

export interface CajaProductDraft {
    id: string;
    name: string;
    category: CajaProductCategory;
    priceCents: number;
}

export type CajaProductFormErrors = Partial<Record<keyof CajaProductFormValues, string>>;

export type CajaProductFormValidation =
    | { valid: true; draft: CajaProductDraft; errors: CajaProductFormErrors }
    | { valid: false; errors: CajaProductFormErrors };

export function priceCentsToEurosInput(priceCents: number): string {
    const euros = Math.floor(priceCents / 100);
    const cents = String(priceCents % 100).padStart(2, "0");
    return `${euros}.${cents}`;
}

function parseEurosToCents(value: string): number | null {
    const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(value.trim());
    if (!match) return null;

    const euros = Number(match[1]);
    const cents = Number((match[2] ?? "").padEnd(2, "0"));
    const totalCents = euros * 100 + cents;
    return Number.isSafeInteger(totalCents) ? totalCents : null;
}

export function validateCajaProductForm(
    values: CajaProductFormValues,
    mode: "create" | "edit",
): CajaProductFormValidation {
    const errors: CajaProductFormErrors = {};
    const id = values.id.trim();
    const name = values.name.trim();
    const priceCents = parseEurosToCents(values.priceEuros);

    if (mode === "create" && !id) errors.id = "El ID es obligatorio.";
    if (!name) errors.name = "El nombre es obligatorio.";
    if (values.category !== "BEBIDA" && values.category !== "COMIDA") {
        errors.category = "Selecciona Bebida o Comida.";
    }
    if (priceCents === null) {
        errors.priceEuros = "Introduce un precio no negativo con hasta dos decimales.";
    }

    if (Object.keys(errors).length > 0 || priceCents === null
        || (values.category !== "BEBIDA" && values.category !== "COMIDA")) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        errors,
        draft: {
            id,
            name,
            category: values.category,
            priceCents,
        },
    };
}
