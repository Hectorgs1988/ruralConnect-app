import { expect, signIn, test } from "./fixtures/caja";
import { E2E_API_ORIGIN } from "./config";

test("direct Caja access signs in with Rural Connect and returns to the requested path", async ({ page, cajaApi }) => {
  await page.goto("/caja");

  await expect(page).toHaveURL(/\/login$/);
  await page.getByPlaceholder("Usuario").fill("socio.e2e@example.test");
  await page.getByPlaceholder("Contraseña").fill("e2e-socio-password");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/caja$/);
  await expect(page.getByRole("heading", { name: "Caja Susinos" })).toBeVisible();
  await expect(page.getByText("Sesión iniciada como Socio E2E")).toBeVisible();
  await expect(page.getByRole("button", { name: "Añadir Cerveza E2E a la comanda" }))
    .toBeVisible();
  expect(cajaApi.authorizedRequests).toContain("GET /api/caja/products");
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
  expect(cajaApi.authorizedRequests).toContain("GET /api/caja/products");
});
