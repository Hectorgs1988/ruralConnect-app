const MAX_SAFE_CENTS = BigInt(Number.MAX_SAFE_INTEGER);

export function parseCajaCashAmount(value: string): number | null {
    const normalized = value.trim().replace(",", ".");
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
    if (!match) return null;

    const wholeEuroText = match[1].replace(/^0+(?=\d)/, "");
    if (wholeEuroText.length > 14) return null;
    const euros = BigInt(wholeEuroText);
    const cents = BigInt((match[2] ?? "").padEnd(2, "0") || "0");
    const totalCents = euros * 100n + cents;
    return totalCents <= MAX_SAFE_CENTS ? Number(totalCents) : null;
}

export function getCajaCashPresets(totalCents: number): number[] {
    if (!Number.isSafeInteger(totalCents) || totalCents < 0) return [];

    const total = BigInt(totalCents);
    return [...new Set([100n, 500n, 1_000n, 2_000n, 5_000n].map(
        (stepCents) => ((total / stepCents) + 1n) * stepCents,
    ).filter((amountCents) => amountCents <= MAX_SAFE_CENTS).map(Number))];
}

export function formatCajaCashInput(amountCents: number): string {
    const euros = Math.floor(amountCents / 100);
    const cents = String(amountCents % 100).padStart(2, "0");
    return `${euros},${cents}`;
}
