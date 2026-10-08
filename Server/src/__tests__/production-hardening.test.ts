import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertDefaultUserSeedAllowed } from "../scripts/seed-guard.js";
import { resolveJwtSecret } from "../config/jwt.js";

describe("production startup hardening", () => {
    it("requires an explicit JWT secret in production", () => {
        expect(() => resolveJwtSecret("production", undefined))
            .toThrow("JWT_SECRET must be configured in production.");
        expect(() => resolveJwtSecret("production", ""))
            .toThrow("JWT_SECRET must be configured in production.");
    });

    it("uses the explicit production JWT secret without exposing it", () => {
        expect(resolveJwtSecret("production", "production-secret-value"))
            .toBe("production-secret-value");
    });

    it("retains the development fallback outside production", () => {
        expect(resolveJwtSecret("development", undefined)).toBe("dev-secret");
        expect(resolveJwtSecret("test", undefined)).toBe("dev-secret");
    });

    it("refuses default-user seeds only in production", () => {
        expect(() => assertDefaultUserSeedAllowed("production"))
            .toThrow("Default admin and socio seed users cannot be created in production.");
        expect(() => assertDefaultUserSeedAllowed("development")).not.toThrow();
        expect(() => assertDefaultUserSeedAllowed("test")).not.toThrow();
        expect(() => assertDefaultUserSeedAllowed(undefined)).not.toThrow();
    });

    it.each(["seed-admin.ts", "seed-socio.ts"])(
        "guards %s before querying or creating a user",
        (seedFile) => {
            const script = readFileSync(new URL(`../scripts/${seedFile}`, import.meta.url), "utf8");
            const guardIndex = script.indexOf("assertDefaultUserSeedAllowed();");

            expect(guardIndex).toBeGreaterThanOrEqual(0);
            expect(guardIndex).toBeLessThan(script.indexOf("prisma.user.findUnique"));
        },
    );

    it("keeps migrations at startup and does not run any seed scripts", () => {
        const entrypoint = readFileSync(new URL("../../docker-entrypoint.sh", import.meta.url), "utf8");

        expect(entrypoint).toMatch(/^#!\/bin\/sh\nset -e/);
        expect(entrypoint).toContain("npx prisma migrate deploy");
        expect(entrypoint).toContain("npm run start:prod");
        expect(entrypoint).not.toMatch(/npm\s+run\s+seed:(admin|socio|caja)/);
    });

    it("does not define a TLS verification bypass in the backend image", () => {
        const dockerfile = readFileSync(new URL("../../Dockerfile", import.meta.url), "utf8");

        expect(dockerfile).not.toContain("NODE_TLS_REJECT_UNAUTHORIZED");
        expect(dockerfile.indexOf("ENV NODE_ENV=production"))
            .toBeGreaterThan(dockerfile.indexOf("RUN npm run build"));
    });

    it("keeps the local Compose backend in development mode", () => {
        const compose = readFileSync(new URL("../../../docker-compose.yml", import.meta.url), "utf8");

        expect(compose).toMatch(/backend:[\s\S]*?environment:\s*\n\s+NODE_ENV:\s+development/);
    });
});

describe("runtime JWT configuration", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.unstubAllEnvs();
    });

    it("fails module initialization for production without JWT_SECRET", async () => {
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("JWT_SECRET", "");

        await expect(import("../config/jwt.js"))
            .rejects.toThrow("JWT_SECRET must be configured in production.");
    });

    it("loads production configuration with an explicit JWT_SECRET", async () => {
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("JWT_SECRET", "explicit-production-secret");

        await expect(import("../config/jwt.js"))
            .resolves.toMatchObject({ JWT_SECRET: "explicit-production-secret" });
    });

    it("loads local configuration with the development fallback", async () => {
        vi.stubEnv("NODE_ENV", "development");
        vi.stubEnv("JWT_SECRET", "");

        await expect(import("../config/jwt.js"))
            .resolves.toMatchObject({ JWT_SECRET: "dev-secret" });
    });
});
