import { expect, signIn, test } from "./fixtures/caja";
import { E2E_API_ORIGIN } from "./config";

test("anonymous users can open Caja directly without login or Rural Connect navigation", async ({ page, cajaApi }) => {
  await page.goto("/caja");

  await expect(page).toHaveURL(/\/caja$/);
  await expect(page.getByRole("heading", { name: "Caja Susinos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Añadir Cerveza E2E a la comanda" }))
    .toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  for (const privateLink of ["Inicio", "Eventos", "Reservas", "Compartir coche", "Despensa", "Administración"]) {
    await expect(page.getByRole("link", { name: privateLink })).toHaveCount(0);
  }
  expect(cajaApi.loginRequests).toBe(0);
  expect(cajaApi.handledRequests).toContain("GET /api/caja/products");
  expect(cajaApi.catalogAuthorizationHeaders.length).toBeGreaterThan(0);
  expect(cajaApi.catalogAuthorizationHeaders.every((header) => header === "")).toBe(true);
});

test("existing Rural Connect login and authenticated navigation into Caja work without another login", async ({ page, cajaApi }) => {
  await signIn(page, "socio");

  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByRole("heading", { name: "Bienvenido/a a Rural Connect" })).toBeVisible();

  const catalogResponse = page.waitForResponse((response) => {
    const request = response.request();
    const url = new URL(response.url());
    return request.method() === "GET"
      && url.origin === E2E_API_ORIGIN
      && url.pathname === "/api/caja/products";
  });
  await page.getByRole("link", { name: "Caja Susinos" }).click();
  expect((await catalogResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/caja$/);
  await expect(page.getByRole("heading", { name: "Caja Susinos" })).toBeVisible();
  expect(cajaApi.loginRequests).toBe(1);
  expect(cajaApi.handledRequests).toContain("GET /api/caja/products");
  expect(cajaApi.catalogAuthorizationHeaders.length).toBeGreaterThan(0);
  expect(cajaApi.catalogAuthorizationHeaders.every((header) => header === "")).toBe(true);
});

test("anonymous users remain redirected from Rural Connect private and admin routes", async ({ page }) => {
  for (const path of ["/inicio", "/GestionCajaProductos"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Gestión de productos de Caja" })).toHaveCount(0);
  }
});
