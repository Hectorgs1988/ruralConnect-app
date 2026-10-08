import { expect, signIn, test } from "./fixtures/caja";
import { E2E_API_URL } from "./config";

test("Caja catalog and ticket support quantity changes, removal, totals and clear", async ({ page }) => {
  await signIn(page, "socio");
  await page.goto("/caja");

  const beer = page.getByRole("button", { name: "Añadir Cerveza E2E a la comanda" });
  await beer.click();
  await beer.click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("2 artículos");
  await expect(page.getByLabel("Total de la comanda")).toHaveText("3,00 €");

  await page.getByRole("button", { name: "Sumar una unidad de Cerveza E2E a 1,50 €" }).click();
  await expect(page.getByLabel("Cantidad de Cerveza E2E", { exact: true })).toHaveText("3");
  await expect(page.getByLabel("Número de artículos")).toHaveText("3 artículos");
  await expect(page.getByLabel("Total de la comanda")).toHaveText("4,50 €");

  await page.getByRole("button", { name: "Restar una unidad de Cerveza E2E a 1,50 €" }).click();
  await expect(page.getByLabel("Total de la comanda")).toHaveText("3,00 €");
  await page.getByRole("button", { name: "Añadir Pincho E2E a la comanda" }).click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("3 artículos");
  await expect(page.getByLabel("Total de la comanda")).toHaveText("4,49 €");

  await page.getByRole("button", { name: "Quitar Pincho E2E a 1,49 € de la comanda" }).click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("2 artículos");
  await expect(page.getByLabel("Total de la comanda")).toHaveText("3,00 €");
  await page.getByRole("button", { name: "Restar una unidad de Cerveza E2E a 1,50 €" }).click();
  await page.getByRole("button", { name: "Restar una unidad de Cerveza E2E a 1,50 €" }).click();
  await expect(page.getByText("Aún no hay productos en la comanda.")).toBeVisible();
  await expect(page.getByLabel("Total de la comanda")).toHaveText("0,00 €");

  await beer.click();
  await page.getByRole("button", { name: "Vaciar" }).click();
  await expect(page.getByText("Aún no hay productos en la comanda.")).toBeVisible();
});

test("voucher guidance preserves legacy totals, rounding, selection and reset behavior", async ({ page }) => {
  await signIn(page, "socio");
  await page.goto("/caja");
  await page.getByRole("button", { name: "Añadir Pincho E2E a la comanda" }).click();
  await page.getByRole("button", { name: "Pagar con vale" }).click();

  await expect(page.getByRole("button", { name: "Vale 24 EUR" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Total: 1,49 EUR - Tacha 1 fila.")).toBeVisible();
  await page.getByRole("button", { name: "Vale 12 EUR" }).click();
  await expect(page.getByText("Total: 1,49 EUR - Tacha 1 fila + 1 de 20 + 1 de 10.")).toBeVisible();

  await page.getByRole("button", { name: "Vaciar" }).click();
  await expect(page.getByRole("group", { name: "Tipo de vale" })).toHaveCount(0);
  await page.getByRole("button", { name: "Añadir Pincho E2E a la comanda" }).click();
  await page.getByRole("button", { name: "Pagar con vale" }).click();
  await expect(page.getByRole("button", { name: "Vale 12 EUR" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Completar ticket" }).click();
  await expect(page.getByRole("status")).toContainText("Ticket completado: 1,49");
  await expect(page.getByRole("group", { name: "Tipo de vale" })).toHaveCount(0);
  await page.getByRole("button", { name: "Añadir Pincho E2E a la comanda" }).click();
  await page.getByRole("button", { name: "Pagar con vale" }).click();
  await expect(page.getByRole("button", { name: "Vale 12 EUR" })).toHaveAttribute("aria-pressed", "true");
});

test("ADMIN can create, edit and soft-deactivate a Caja product without exposing it in the cashier catalog", async ({ page, cajaApi }) => {
  await signIn(page, "admin");
  await page.getByRole("link", { name: "Caja Susinos" }).click();
  await page.getByRole("button", { name: /Admin/ }).click();
  await page.getByRole("link", { name: "Panel de administración" }).click();
  await page.getByRole("link", { name: "Acceder" }).last().click();

  await expect(page.getByRole("heading", { name: "Gestión de productos de Caja" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Inactivo E2E" })).toContainText("Inactivo");
  await expect(page.getByRole("row", { name: /Cerveza E2E/ })).toBeVisible();

  await page.getByRole("button", { name: "Crear producto" }).click();
  await page.getByRole("textbox", { name: "ID", exact: true }).fill("producto-e2e");
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Producto Nuevo E2E");
  await page.getByRole("combobox").selectOption("COMIDA");
  await page.getByLabel("Precio (EUR)").fill("2.35");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByText("Producto producto-e2e creado.", { exact: true })).toBeVisible();

  const productRow = page.getByRole("row", { name: /producto-e2e Producto Nuevo E2E/ });
  await productRow.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByRole("textbox", { name: "ID", exact: true })).toHaveAttribute("readonly");
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Producto Editado E2E");
  await page.getByLabel("Precio (EUR)").fill("2.50");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Producto producto-e2e actualizado.", { exact: true })).toBeVisible();

  const editedRow = page.getByRole("row", { name: /producto-e2e Producto Editado E2E/ });
  await editedRow.getByRole("button", { name: "Desactivar" }).click();
  await page.getByRole("button", { name: "Confirmar desactivación" }).click();
  await expect(page.getByText("Producto producto-e2e desactivado.", { exact: true })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "producto-e2e" })).toContainText("Inactivo");

  await page.getByRole("link", { name: "Caja Susinos" }).click();
  await expect(page.getByRole("heading", { name: "Caja Susinos" })).toBeVisible();
  await expect(page.getByText("Producto Editado E2E")).toHaveCount(0);

  await page.goto("/GestionCajaProductos");
  await page.getByRole("row").filter({ hasText: "producto-e2e" })
    .getByRole("button", { name: "Reactivar" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar reactivación: Producto Editado E2E" }))
    .toBeVisible();
  await page.getByRole("button", { name: "Confirmar reactivación" }).click();
  await expect(page.getByText("Producto producto-e2e reactivado.", { exact: true })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "producto-e2e" })).toContainText("Activo");
  await page.goto("/caja");
  await expect(page.getByRole("button", { name: "Añadir Producto Editado E2E a la comanda" }))
    .toBeVisible();

  expect(cajaApi.authorizedRequests).toContain("POST /api/caja/products");
  expect(cajaApi.authorizedRequests).toContain("PATCH /api/caja/products/producto-e2e");
  expect(cajaApi.authorizedRequests).toContain("PATCH /api/caja/products/producto-e2e/deactivate");
  expect(cajaApi.authorizedRequests).toContain("PATCH /api/caja/products/producto-e2e/reactivate");
});

test("SOCIO is denied Caja administration by the existing role guard", async ({ page }) => {
  await signIn(page, "socio");
  await page.goto("/GestionCajaProductos");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Gestión de productos de Caja" })).toHaveCount(0);
});

test("Caja product writes reject unauthenticated and SOCIO requests", async ({ page }) => {
  const product = {
    id: "producto-no-autorizado",
    name: "Producto no autorizado",
    category: "COMIDA",
    priceCents: 100,
  };

  await page.goto("/login");
  const unauthenticatedStatus = await page.evaluate(async ({ payload, apiUrl }) => {
    const response = await fetch(`${apiUrl}/api/caja/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.status;
  }, { payload: product, apiUrl: E2E_API_URL });
  expect(unauthenticatedStatus).toBe(401);

  await signIn(page, "socio");
  const nonAdminStatus = await page.evaluate(async ({ payload, apiUrl }) => {
    const auth = JSON.parse(localStorage.getItem("auth") ?? "{}");
    const response = await fetch(`${apiUrl}/api/caja/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(payload),
    });
    return response.status;
  }, { payload: product, apiUrl: E2E_API_URL });
  expect(nonAdminStatus).toBe(403);
});

test("catalog API failures show an error and never fall back to local or legacy products", async ({ page, cajaApi }) => {
  cajaApi.failCatalog = true;
  await signIn(page, "socio");
  await page.goto("/caja");

  await expect(page.getByRole("alert")).toHaveText("Catálogo E2E no disponible");
  await expect(page.getByText("Cerveza E2E")).toHaveCount(0);
  await expect(page.getByText("Refresco")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reintentar catálogo" })).toBeVisible();
});
