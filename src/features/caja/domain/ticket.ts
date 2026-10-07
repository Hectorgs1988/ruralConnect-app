import type { CajaProduct } from "@/features/caja/types/CajaProduct";

export interface CajaTicketLine {
    lineId: string;
    productId: CajaProduct["id"];
    name: CajaProduct["name"];
    category: CajaProduct["category"];
    priceCents: CajaProduct["priceCents"];
    quantity: number;
}

export type CajaTicketAction =
    | { type: "add"; product: CajaProduct }
    | { type: "increment"; lineId: CajaTicketLine["lineId"] }
    | { type: "decrement"; lineId: CajaTicketLine["lineId"] }
    | { type: "remove"; lineId: CajaTicketLine["lineId"] }
    | { type: "clear" };

function getLineId(product: Pick<CajaProduct, "id" | "name" | "category" | "priceCents">): string {
    return JSON.stringify([product.id, product.name, product.category, product.priceCents]);
}

export function cajaTicketReducer(
    lines: CajaTicketLine[],
    action: CajaTicketAction,
): CajaTicketLine[] {
    if (action.type === "clear") return [];
    if (action.type === "remove") {
        return lines.filter((line) => line.lineId !== action.lineId);
    }

    const lineId = action.type === "add" ? getLineId(action.product) : action.lineId;
    const existingLine = lines.find((line) => line.lineId === lineId);

    if (action.type === "add" && !existingLine) {
        return [...lines, {
            lineId,
            productId: action.product.id,
            name: action.product.name,
            category: action.product.category,
            priceCents: action.product.priceCents,
            quantity: 1,
        }];
    }

    if (!existingLine) return lines;

    const quantityDelta = action.type === "decrement" ? -1 : 1;
    const nextQuantity = existingLine.quantity + quantityDelta;
    if (nextQuantity <= 0) {
        return lines.filter((line) => line.lineId !== existingLine.lineId);
    }

    return lines.map((line) => line.lineId === existingLine.lineId
        ? { ...line, quantity: nextQuantity }
        : line);
}

export function getCajaTicketItemCount(lines: CajaTicketLine[]): number {
    return lines.reduce((count, line) => count + line.quantity, 0);
}

export function getCajaTicketTotalCents(lines: CajaTicketLine[]): number {
    return lines.reduce((total, line) => total + line.priceCents * line.quantity, 0);
}
