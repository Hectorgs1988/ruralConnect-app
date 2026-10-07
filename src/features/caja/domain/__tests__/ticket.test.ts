import { describe, expect, it } from "vitest";
import type { CajaProduct } from "@/features/caja/types/CajaProduct";
import {
    cajaTicketReducer,
    getCajaTicketItemCount,
    getCajaTicketTotalCents,
} from "../ticket";

const product: CajaProduct = {
    id: "gominola-1",
    name: "Gominola",
    category: "COMIDA",
    priceCents: 19,
    active: true,
    createdAt: "2026-10-07T10:00:00.000Z",
    updatedAt: "2026-10-07T11:00:00.000Z",
};

describe("Caja ticket domain", () => {
    it("uses stable product IDs and preserves the original product snapshot on repeated selection", () => {
        const lines = cajaTicketReducer([], { type: "add", product });
        const nextLines = cajaTicketReducer(lines, { type: "add", product: { ...product } });

        expect(nextLines).toEqual([{
            lineId: JSON.stringify(["gominola-1", "Gominola", "COMIDA", 19]),
            productId: "gominola-1",
            name: "Gominola",
            category: "COMIDA",
            priceCents: 19,
            quantity: 2,
        }]);
    });

    it("calculates item count and totals in integer cents without floating-point drift", () => {
        const lines = [
            { lineId: "gominola", productId: "gominola-1", name: "Gominola", category: "COMIDA" as const, priceCents: 19, quantity: 3 },
            { lineId: "refresco", productId: "refresco", name: "Refresco", category: "BEBIDA" as const, priceCents: 7, quantity: 2 },
        ];

        expect(getCajaTicketItemCount(lines)).toBe(5);
        expect(getCajaTicketTotalCents(lines)).toBe(71);
        expect(Number.isInteger(getCajaTicketTotalCents(lines))).toBe(true);
    });

    it("removes a line when decrementing its last unit and supports clearing", () => {
        const oneLine = cajaTicketReducer([], { type: "add", product });
        expect(cajaTicketReducer(oneLine, { type: "decrement", lineId: oneLine[0].lineId })).toEqual([]);

        const twoLines = cajaTicketReducer(oneLine, {
            type: "add",
            product: { ...product, id: "agua", name: "Agua" },
        });
        expect(cajaTicketReducer(twoLines, { type: "clear" })).toEqual([]);
    });

    it("keeps changed commercial snapshots in separate lines and counts both prices", () => {
        const oldPriceProduct = { ...product, priceCents: 150 };
        const newPriceProduct = { ...product, priceCents: 180 };
        const oldPriceLine = cajaTicketReducer([], { type: "add", product: oldPriceProduct });
        const bothLines = cajaTicketReducer(oldPriceLine, { type: "add", product: newPriceProduct });

        expect(bothLines).toHaveLength(2);
        expect(bothLines.map(({ productId, name, category, priceCents, quantity }) => ({
            productId, name, category, priceCents, quantity,
        }))).toEqual([
            { productId: product.id, name: product.name, category: product.category, priceCents: 150, quantity: 1 },
            { productId: product.id, name: product.name, category: product.category, priceCents: 180, quantity: 1 },
        ]);
        expect(getCajaTicketItemCount(bothLines)).toBe(2);
        expect(getCajaTicketTotalCents(bothLines)).toBe(330);
    });

    it("targets increment, decrement, direct removal, and zero-removal by line identity", () => {
        const oldPrice = { ...product, priceCents: 150 };
        const newPrice = { ...product, priceCents: 180 };
        const oneOldLine = cajaTicketReducer([], { type: "add", product: oldPrice });
        const twoLines = cajaTicketReducer(oneOldLine, { type: "add", product: newPrice });
        const [oldLine, newLine] = twoLines;

        const incrementedOld = cajaTicketReducer(twoLines, { type: "increment", lineId: oldLine.lineId });
        expect(incrementedOld.map((line) => line.quantity)).toEqual([2, 1]);
        expect(incrementedOld[0].priceCents).toBe(150);
        expect(incrementedOld[1].priceCents).toBe(180);

        const decrementedOld = cajaTicketReducer(incrementedOld, {
            type: "decrement",
            lineId: oldLine.lineId,
        });
        expect(decrementedOld.map((line) => line.quantity)).toEqual([1, 1]);

        const removedOld = cajaTicketReducer(decrementedOld, {
            type: "decrement",
            lineId: oldLine.lineId,
        });
        expect(removedOld).toEqual([newLine]);

        const removedNew = cajaTicketReducer(twoLines, { type: "remove", lineId: newLine.lineId });
        expect(removedNew).toEqual([oldLine]);
    });
});
