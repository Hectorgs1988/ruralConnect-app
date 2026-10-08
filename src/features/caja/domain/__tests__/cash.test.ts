import { describe, expect, it } from "vitest";
import {
    formatCajaCashInput,
    getCajaCashPresets,
    parseCajaCashAmount,
} from "@/features/caja/domain/cash";

describe("Caja cash helpers", () => {
    it("parses comma and dot decimals directly into integer cents", () => {
        expect(parseCajaCashAmount("12,3")).toBe(1230);
        expect(parseCajaCashAmount("12.30")).toBe(1230);
        expect(parseCajaCashAmount("12")).toBe(1200);
    });

    it.each(["", "abc", "-1,00", "1.234", "1,", "90071992547410.00"])(
        "rejects invalid or unsafe cash amount %s",
        (value) => expect(parseCajaCashAmount(value)).toBeNull(),
    );

    it("offers only deduplicated amounts above the total", () => {
        expect(getCajaCashPresets(1830)).toEqual([1900, 2000, 5000]);
        expect(getCajaCashPresets(2000).every((amount) => amount > 2000)).toBe(true);
        expect(getCajaCashPresets(Number.MAX_SAFE_INTEGER)).toEqual([]);
    });

    it("formats selected preset amounts without floating-point arithmetic", () => {
        expect(formatCajaCashInput(1900)).toBe("19,00");
        expect(formatCajaCashInput(5)).toBe("0,05");
    });
});
