export function assertDefaultUserSeedAllowed(nodeEnv = process.env.NODE_ENV): void {
    if (nodeEnv === "production") {
        throw new Error("Default admin and socio seed users cannot be created in production.");
    }
}
