import { describe, expect, it } from "vitest";

import { formatReservationEmailDateTime } from "../services/email";

describe("formatReservationEmailDateTime", () => {
    it("formatea las reservas en horario de Madrid", () => {
        const formatted = formatReservationEmailDateTime(
            new Date("2026-07-30T12:00:00.000Z"),
        );

        expect(formatted).toContain("30/7/26");
        expect(formatted).toContain("14:00");
    });
});