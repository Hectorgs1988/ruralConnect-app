export type CajaVoucherType = "24" | "12";

export interface CajaVoucherDenomination {
    readonly valueCents: number;
    readonly count: number;
}

export interface CajaVoucherConfiguration {
    readonly id: CajaVoucherType;
    readonly label: string;
    readonly rowValueCents: number;
    readonly denominations: readonly CajaVoucherDenomination[];
}

export interface CajaVoucherCalculation {
    readonly roundedCents: number;
    readonly rowValueCents: number;
    readonly fullRows: number;
    readonly partialCents: number;
    readonly partialBreakdown: readonly CajaVoucherDenomination[];
    readonly instruction: string;
}

export const CAJA_VOUCHERS = {
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
} as const satisfies Readonly<Record<CajaVoucherType, CajaVoucherConfiguration>>;

function requireSafeInteger(value: number, description: string): number {
    if (!Number.isSafeInteger(value)) {
        throw new RangeError(`${description} must be a safe integer.`);
    }
    return value;
}

export function calculateCajaVoucher(
    totalCents: number,
    voucherType: CajaVoucherType,
): CajaVoucherCalculation | null {
    requireSafeInteger(totalCents, "Voucher total");
    if (totalCents <= 0) return null;

    const voucher = CAJA_VOUCHERS[voucherType];
    const remainder = totalCents % 5;
    const roundedCents = requireSafeInteger(
        totalCents + (remainder === 0 ? 0 : 5 - remainder),
        "Rounded voucher total",
    );
    const fullRows = Math.floor(roundedCents / voucher.rowValueCents);
    const partialCents = roundedCents - fullRows * voucher.rowValueCents;

    let remainingCents = partialCents;
    const partialBreakdown = voucher.denominations.map((denomination, index) => {
        const isLastDenomination = index === voucher.denominations.length - 1;
        const needed = isLastDenomination
            ? Math.ceil(remainingCents / denomination.valueCents)
            : Math.floor(remainingCents / denomination.valueCents);
        const count = Math.min(denomination.count, needed);
        remainingCents -= count * denomination.valueCents;
        return { ...denomination, count };
    }).filter((denomination) => denomination.count > 0);

    if (remainingCents !== 0) {
        throw new RangeError("Voucher denominations cannot exactly cover the partial row.");
    }

    const partialCoveredCents = partialBreakdown.reduce(
        (covered, denomination) => covered + denomination.valueCents * denomination.count,
        0,
    );
    requireSafeInteger(partialCoveredCents, "Partial voucher coverage");
    if (partialCoveredCents !== partialCents) {
        throw new RangeError("Voucher denominations do not exactly cover the partial row.");
    }

    const partialText = partialBreakdown
        .map(({ count, valueCents }) => `${count} de ${valueCents}`)
        .join(" + ");
    const instruction = fullRows > 0 && partialText
        ? `Tacha ${fullRows} ${fullRows === 1 ? "fila" : "filas"} + ${partialText}.`
        : partialText
            ? `Tacha ${partialText}.`
            : `Tacha ${fullRows} ${fullRows === 1 ? "fila" : "filas"}.`;

    return {
        roundedCents,
        rowValueCents: voucher.rowValueCents,
        fullRows,
        partialCents,
        partialBreakdown,
        instruction,
    };
}
