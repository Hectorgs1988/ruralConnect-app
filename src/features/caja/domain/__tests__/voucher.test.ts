import { describe, expect, it } from "vitest";
import { CAJA_VOUCHERS, calculateCajaVoucher, type CajaVoucherType } from "../voucher";

describe("Caja voucher domain", () => {
    it("keeps the legacy voucher configurations and denomination order", () => {
        expect(CAJA_VOUCHERS).toEqual({
            "24": {
                id: "24",
                label: "Vale 24 EUR",
                rowValueCents: 150,
                denominations: [
                    { valueCents: 30, count: 4 },
                    { valueCents: 10, count: 2 },
                    { valueCents: 5, count: 2 },
                ],
            },
            "12": {
                id: "12",
                label: "Vale 12 EUR",
                rowValueCents: 120,
                denominations: [
                    { valueCents: 20, count: 5 },
                    { valueCents: 10, count: 1 },
                    { valueCents: 5, count: 2 },
                ],
            },
        });
    });

    it.each([0, -1])("returns no guidance for non-positive totals (%i cents)", (totalCents) => {
        expect(calculateCajaVoucher(totalCents, "24")).toBeNull();
    });

    it.each([
        [1, 5],
        [4, 5],
        [5, 5],
        [6, 10],
        [9, 10],
        [10, 10],
        [11, 15],
    ])("rounds %i cents upward to %i cents", (totalCents, roundedCents) => {
        expect(calculateCajaVoucher(totalCents, "24")?.roundedCents).toBe(roundedCents);
    });

    it.each([
        [149, 150, "Tacha 1 fila."],
        [150, 150, "Tacha 1 fila."],
        [151, 155, "Tacha 1 fila + 1 de 5."],
        [160, 160, "Tacha 1 fila + 1 de 10."],
        [2399, 2400, "Tacha 16 filas."],
        [2401, 2405, "Tacha 16 filas + 1 de 5."],
        [4800, 4800, "Tacha 32 filas."],
    ])("calculates 24 EUR voucher for %i cents", (totalCents, roundedCents, instruction) => {
        const result = calculateCajaVoucher(totalCents, "24");
        expect(result).toMatchObject({ roundedCents, instruction });
    });

    it.each([
        [119, 120, "Tacha 1 fila."],
        [120, 120, "Tacha 1 fila."],
        [121, 125, "Tacha 1 fila + 1 de 5."],
        [130, 130, "Tacha 1 fila + 1 de 10."],
        [1199, 1200, "Tacha 10 filas."],
        [1201, 1205, "Tacha 10 filas + 1 de 5."],
        [2400, 2400, "Tacha 20 filas."],
    ])("calculates 12 EUR voucher for %i cents", (totalCents, roundedCents, instruction) => {
        const result = calculateCajaVoucher(totalCents, "12");
        expect(result).toMatchObject({ roundedCents, instruction });
    });

    it.each([
        ["24", 135, [
            { valueCents: 30, count: 4 },
            { valueCents: 10, count: 1 },
            { valueCents: 5, count: 1 },
        ]],
        ["12", 35, [
            { valueCents: 20, count: 1 },
            { valueCents: 10, count: 1 },
            { valueCents: 5, count: 1 },
        ]],
    ] as const)(
        "decomposes a partial row in configured denomination order for voucher %s",
        (voucherType: CajaVoucherType, totalCents, expectedBreakdown) => {
            const result = calculateCajaVoucher(totalCents, voucherType);
            expect(result?.partialBreakdown).toEqual(expectedBreakdown);
            const coveredCents = result?.partialBreakdown.reduce(
                (total, denomination) => total + denomination.valueCents * denomination.count,
                0,
            );
            expect(coveredCents).toBe(result?.partialCents);
        },
    );

    it("uses singular and plural row guidance and does not cap full rows by voucher grouping", () => {
        expect(calculateCajaVoucher(300, "24")?.instruction).toBe("Tacha 2 filas.");
        expect(calculateCajaVoucher(240, "12")?.instruction).toBe("Tacha 2 filas.");
        expect(calculateCajaVoucher(4800, "24")?.fullRows).toBe(32);
    });

    it("rejects totals and rounded intermediate values outside the safe integer range", () => {
        expect(() => calculateCajaVoucher(Number.MAX_SAFE_INTEGER + 1, "24"))
            .toThrow(RangeError);
        expect(() => calculateCajaVoucher(Number.MAX_SAFE_INTEGER, "24"))
            .toThrow("Rounded voucher total must be a safe integer.");
    });
});
