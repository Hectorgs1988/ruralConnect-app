export function resolveJwtSecret(
    nodeEnv: string | undefined,
    configuredSecret: string | undefined,
): string {
    if (configuredSecret?.trim()) return configuredSecret;
    if (nodeEnv === "production") {
        throw new Error("JWT_SECRET must be configured in production.");
    }
    return "dev-secret";
}

export const JWT_SECRET = resolveJwtSecret(process.env.NODE_ENV, process.env.JWT_SECRET);
