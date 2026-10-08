import { expect, test as base, type Page } from "@playwright/test";
import { E2E_API_ORIGIN } from "../config";

type CajaCategory = "BEBIDA" | "COMIDA";
type CajaE2ERole = "socio" | "admin";

interface CajaE2EProduct {
  id: string;
  name: string;
  category: CajaCategory;
  priceCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CajaApiFixture {
  authorizedRequests: string[];
  get loginRequests(): number;
  failCatalog: boolean;
}

interface Fixtures {
  cajaApi: CajaApiFixture;
}

const TEST_USERS = {
  socio: {
    email: "socio.e2e@example.test",
    password: "e2e-socio-password",
    token: "e2e-socio-token",
    user: { id: "e2e-socio", name: "Socio E2E", role: "SOCIO" },
  },
  admin: {
    email: "admin.e2e@example.test",
    password: "e2e-admin-password",
    token: "e2e-admin-token",
    user: { id: "e2e-admin", name: "Admin E2E", role: "ADMIN" },
  },
} as const;

function initialProducts(): CajaE2EProduct[] {
  const timestamp = "2026-10-08T00:00:00.000Z";
  return [
    {
      id: "cerveza-e2e",
      name: "Cerveza E2E",
      category: "BEBIDA",
      priceCents: 150,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "agua-e2e",
      name: "Agua E2E",
      category: "BEBIDA",
      priceCents: 100,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "pincho-e2e",
      name: "Pincho E2E",
      category: "COMIDA",
      priceCents: 149,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "inactivo-e2e",
      name: "Inactivo E2E",
      category: "COMIDA",
      priceCents: 200,
      active: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

function isAuthorized(request: { headers(): Record<string, string> }, role?: CajaE2ERole): boolean {
  const token = request.headers().authorization?.replace(/^Bearer\s+/i, "");
  if (!role) return token === TEST_USERS.socio.token || token === TEST_USERS.admin.token;
  return token === TEST_USERS[role].token;
}

function jsonResponse(status: number, data: unknown) {
  return {
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "http://localhost:5173" },
    body: JSON.stringify(data),
  };
}

export const test = base.extend<Fixtures>({
  cajaApi: [async ({ page }, use) => {
    let products = initialProducts();
    let loginRequests = 0;
    const authorizedRequests: string[] = [];
    const fixture: CajaApiFixture = {
      authorizedRequests,
      get loginRequests() {
        return loginRequests;
      },
      failCatalog: false,
    };

    const unexpectedApiOrigins: string[] = [];
    await page.route((url) => url.pathname.startsWith("/api/"), async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();

      if (url.origin !== E2E_API_ORIGIN) {
        unexpectedApiOrigins.push(url.origin);
        await route.fulfill(jsonResponse(502, { error: "Unexpected E2E API origin blocked" }));
        return;
      }

      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "http://localhost:5173",
            "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
            "access-control-allow-headers": "authorization, content-type",
          },
        });
        return;
      }

      if (url.pathname === "/api/auth/login" && method === "POST") {
        loginRequests += 1;
        const body = request.postDataJSON() as { email?: string; password?: string };
        const account = Object.values(TEST_USERS).find(
          (candidate) => candidate.email === body.email && candidate.password === body.password,
        );
        await route.fulfill(account
          ? jsonResponse(200, { token: account.token, user: account.user })
          : jsonResponse(401, { error: "Usuario o contraseña incorrectos" }));
        return;
      }

      if (url.pathname === "/api/caja/products" && method === "GET") {
        if (!isAuthorized(request)) {
          await route.fulfill(jsonResponse(401, { error: "No autenticado" }));
          return;
        }
        authorizedRequests.push(`${method} ${url.pathname}`);
        if (fixture.failCatalog) {
          await route.fulfill(jsonResponse(503, { error: "Catálogo E2E no disponible" }));
          return;
        }
        await route.fulfill(jsonResponse(200, products.filter((product) => product.active)));
        return;
      }

      if (url.pathname === "/api/caja/admin/products" && method === "GET") {
        if (!isAuthorized(request, "admin")) {
          await route.fulfill(jsonResponse(isAuthorized(request) ? 403 : 401, { error: "No autorizado" }));
          return;
        }
        authorizedRequests.push(`${method} ${url.pathname}`);
        await route.fulfill(jsonResponse(200, products));
        return;
      }

      if (url.pathname === "/api/caja/products" && method === "POST") {
        if (!isAuthorized(request, "admin")) {
          await route.fulfill(jsonResponse(isAuthorized(request) ? 403 : 401, { error: "No autorizado" }));
          return;
        }
        authorizedRequests.push(`${method} ${url.pathname}`);
        const body = request.postDataJSON() as Omit<CajaE2EProduct, "active" | "createdAt" | "updatedAt">;
        if (products.some((product) => product.id === body.id)) {
          await route.fulfill(jsonResponse(409, { error: "Ya existe un producto con ese ID" }));
          return;
        }
        const now = new Date().toISOString();
        const created: CajaE2EProduct = { ...body, active: true, createdAt: now, updatedAt: now };
        products = [...products, created];
        await route.fulfill(jsonResponse(201, created));
        return;
      }

      const deactivateMatch = url.pathname.match(/^\/api\/caja\/products\/([^/]+)\/deactivate$/);
      if (deactivateMatch && method === "PATCH") {
        if (!isAuthorized(request, "admin")) {
          await route.fulfill(jsonResponse(isAuthorized(request) ? 403 : 401, { error: "No autorizado" }));
          return;
        }
        authorizedRequests.push(`${method} ${url.pathname}`);
        const id = decodeURIComponent(deactivateMatch[1]);
        const product = products.find((item) => item.id === id);
        if (!product) {
          await route.fulfill(jsonResponse(404, { error: "Producto no encontrado" }));
          return;
        }
        product.active = false;
        product.updatedAt = new Date().toISOString();
        await route.fulfill(jsonResponse(200, product));
        return;
      }

      const updateMatch = url.pathname.match(/^\/api\/caja\/products\/([^/]+)$/);
      if (updateMatch && method === "PATCH") {
        if (!isAuthorized(request, "admin")) {
          await route.fulfill(jsonResponse(isAuthorized(request) ? 403 : 401, { error: "No autorizado" }));
          return;
        }
        authorizedRequests.push(`${method} ${url.pathname}`);
        const id = decodeURIComponent(updateMatch[1]);
        const product = products.find((item) => item.id === id);
        if (!product) {
          await route.fulfill(jsonResponse(404, { error: "Producto no encontrado" }));
          return;
        }
        const body = request.postDataJSON() as Partial<CajaE2EProduct>;
        Object.assign(product, body, { updatedAt: new Date().toISOString() });
        await route.fulfill(jsonResponse(200, product));
        return;
      }

      await route.fulfill(jsonResponse(404, { error: "Endpoint E2E no configurado" }));
    });

    await use(fixture);
    await page.unrouteAll({ behavior: "wait" });
    expect(unexpectedApiOrigins, "E2E API requests must use the isolated test origin").toEqual([]);
  }, { auto: true }],
});

export { expect };

export async function signIn(page: Page, role: CajaE2ERole): Promise<void> {
  const account = TEST_USERS[role];
  await page.goto("/login");
  await page.getByPlaceholder("Usuario").fill(account.email);
  await page.getByPlaceholder("Contraseña").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio");
}
