import { expect, signIn, test } from "./fixtures/caja";
import { E2E_API_URL } from "./config";

test("Caja catalog and checkout review support quantity changes, removal, totals and clear", async ({ page }) => {
  await page.goto("/caja");

  const beer = page.getByRole("button", { name: "Añadir Cerveza E2E a la comanda" });
  await beer.click();
  await beer.click();
  const pincho = page.getByRole("button", { name: "Añadir Pincho E2E a la comanda" });
  await pincho.click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("3 artículos");
  await expect(page.getByLabel("Total de la comanda")).toHaveText("4,49 €");
  await page.getByRole("button", { name: "Restar una unidad de Cerveza E2E" }).click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("2 artículos");
  await expect(page.getByLabel("Total de la comanda")).toHaveText("2,99 €");
  await page.getByRole("button", { name: "Restar una unidad de Cerveza E2E" }).click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("1 artículo");
  await expect(beer).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByLabel("Total de la comanda")).toHaveText("1,49 €");
  await page.getByRole("button", { name: "Cobrar" }).click();

  expect(await page.getByRole("button", { name: /Quitar .* de la comanda/ }).count()).toBe(0);
  await page.getByRole("button", { name: "Sumar una unidad de Pincho E2E a 1,49 €" }).click();
  await expect(page.getByLabel("Cantidad de Pincho E2E", { exact: true })).toHaveText("2");
  await expect(page.getByLabel("Total revisado")).toHaveText("2,98 €");
  await page.getByRole("button", { name: "Restar una unidad de Pincho E2E a 1,49 €" }).click();
  await page.getByRole("button", { name: "Restar una unidad de Pincho E2E a 1,49 €" }).click();
  await expect(page.getByText("Aún no hay productos en la comanda.")).toBeVisible();
  await expect(page.getByLabel("Total revisado")).toHaveText("0,00 €");
  await page.getByRole("button", { name: "Volver" }).click();
  await beer.click();
  await page.getByRole("button", { name: "Cobrar" }).click();
  await page.getByRole("button", { name: "Vaciar" }).click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("0 artículos");
});

test("voucher checkout preserves guidance and only completes after confirmation", async ({ page }) => {
  await page.goto("/caja");
  await page.getByRole("button", { name: "Añadir Pincho E2E a la comanda" }).click();
  await page.getByRole("button", { name: "Cobrar" }).click();
  await page.getByRole("button", { name: "Vale 24 EUR" }).click();

  await expect(page.getByText("Total: 1,49 EUR - Tacha 1 fila.")).toBeVisible();
  await page.getByRole("button", { name: "Vale 12 EUR" }).click();
  await expect(page.getByText("Total: 1,49 EUR - Tacha 1 fila + 1 de 20 + 1 de 10.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar ticket" })).toBeEnabled();

  await page.getByRole("button", { name: "Volver" }).click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("1 artículo");
  await page.getByRole("button", { name: "Cobrar" }).click();
  await expect(page.getByRole("button", { name: "Vale 24 EUR" })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Vale 12 EUR" }).click();
  await page.getByRole("button", { name: "Confirmar ticket" }).click();
  await expect(page.getByRole("status")).toHaveText("Ticket completado");
  await expect(page.getByLabel("Número de artículos")).toHaveText("0 artículos");
});

test("mobile sticky checkout supports cash and voucher completion without payment or order APIs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 360 });
  const prohibitedApiRequests: string[] = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (/\/api\/(payments?|orders?)(\/|$)/i.test(pathname)) prohibitedApiRequests.push(pathname);
  });
  await page.goto("/caja");
  await expect(page.getByRole("heading", { name: "Bebida" })).toBeVisible();

  await page.getByRole("button", { name: "Añadir Cerveza E2E a la comanda" }).click();
  await page.getByRole("button", { name: "Añadir Agua E2E a la comanda" }).click();
  const stickyBar = page.locator(".caja-sticky-checkout");
  await expect(stickyBar).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(stickyBar).toBeInViewport();

  await page.getByRole("button", { name: "Cobrar" }).click();
  await page.getByRole("button", { name: "Efectivo" }).click();
  await page.getByRole("button", { name: "Exacto" }).click();
  await expect(page.getByLabel("Importe recibido")).toHaveValue("2,50");
  await expect(page.getByLabel("Cambio")).toHaveText("0,00 €");
  await page.getByLabel("Importe recibido").fill("3,00");
  await expect(page.getByLabel("Cambio")).toHaveText("0,50 €");
  await page.getByRole("button", { name: "Confirmar ticket" }).click();
  await expect(page.getByRole("status")).toHaveText("Ticket completado");

  await page.getByRole("button", { name: "Añadir Pincho E2E a la comanda" }).click();
  await page.getByRole("button", { name: "Cobrar" }).click();
  await page.getByRole("button", { name: "Vale 12 EUR" }).click();
  await expect(page.getByText("Total: 1,49 EUR - Tacha 1 fila + 1 de 20 + 1 de 10.")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar ticket" }).click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("0 artículos");
  expect(prohibitedApiRequests).toEqual([]);
});

test("mobile product cards keep their dimensions as selection controls appear", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/caja");

  const shortCard = page.locator(".caja-product-card").filter({
    has: page.getByRole("button", { name: "Añadir Cerveza E2E a la comanda" }),
  });
  const longName = "Bocadillo especial de la casa con ingredientes variados";
  const longCard = page.locator(".caja-product-card").filter({
    has: page.getByRole("button", { name: `Añadir ${longName} a la comanda` }),
  });
  const shortCardBefore = await shortCard.boundingBox();
  const longCardBefore = await longCard.boundingBox();
  expect(shortCardBefore).not.toBeNull();
  expect(longCardBefore).not.toBeNull();
  expect(longCardBefore?.height).toBe(shortCardBefore?.height);

  await page.getByRole("button", { name: `Añadir ${longName} a la comanda` }).click();

  const longCardAfter = await longCard.boundingBox();
  expect(longCardAfter?.height).toBe(longCardBefore?.height);
  await expect(page.getByLabel(`Cantidad seleccionada de ${longName}`)).toHaveText("×1");
  await page.getByRole("button", { name: `Restar una unidad de ${longName}` }).click();
  await expect(page.getByLabel("Número de artículos")).toHaveText("0 artículos");
  await expect(page.getByLabel("Total de la comanda")).toHaveText("0,00 €");
});

test("ADMIN can manage Caja products and permanently delete them from the mobile admin screen", async ({ page, cajaApi }) => {
  await signIn(page, "admin");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/GestionCajaProductos");

  await expect(page.getByRole("heading", { name: "Gestión de productos de Caja" })).toBeVisible();
  await expect(page.getByRole("article").filter({ hasText: "Inactivo E2E" })).toContainText("Inactivo");
  await expect(page.getByRole("article").filter({ hasText: "Cerveza E2E" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);

  await page.getByRole("button", { name: "Crear producto" }).click();
  await page.getByRole("textbox", { name: "ID", exact: true }).fill("producto-e2e");
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Producto Nuevo E2E");
  await page.getByLabel("Categoría").selectOption("COMIDA");
  await page.getByLabel("Precio (EUR)").fill("2.35");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByText("Producto producto-e2e creado.", { exact: true })).toBeVisible();

  const newProductCard = page.getByRole("article").filter({ hasText: "producto-e2e" });
  await newProductCard.getByRole("button", { name: "Editar" }).click();
  await expect(page.getByRole("textbox", { name: "ID", exact: true })).toHaveAttribute("readonly");
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Producto Editado E2E");
  await page.getByLabel("Precio (EUR)").fill("2.50");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Producto producto-e2e actualizado.", { exact: true })).toBeVisible();

  const editedProductCard = page.getByRole("article").filter({ hasText: "producto-e2e" });
  await editedProductCard.getByRole("button", { name: "Desactivar" }).click();
  await page.getByRole("button", { name: "Confirmar desactivación" }).click();
  await expect(page.getByText("Producto producto-e2e desactivado.", { exact: true })).toBeVisible();
  await expect(page.getByRole("article").filter({ hasText: "producto-e2e" })).toContainText("Inactivo");

  await page.goto("/caja");
  await expect(page.getByRole("heading", { name: "Caja Susinos" })).toBeVisible();
  await expect(page.getByText("Producto Editado E2E")).toHaveCount(0);

  await page.goto("/GestionCajaProductos");
  await page.getByRole("article").filter({ hasText: "producto-e2e" })
    .getByRole("button", { name: "Reactivar" }).click();
  await expect(page.getByRole("heading", { name: "Reactivar «Producto Editado E2E»" }))
    .toBeVisible();
  await page.getByRole("button", { name: "Confirmar reactivación" }).click();
  await expect(page.getByText("Producto producto-e2e reactivado.", { exact: true })).toBeVisible();
  await expect(page.getByRole("article").filter({ hasText: "producto-e2e" })).toContainText("Activo");
  await page.goto("/caja");
  await expect(page.getByRole("button", { name: "Añadir Producto Editado E2E a la comanda" }))
    .toBeVisible();

  await page.goto("/GestionCajaProductos");
  await page.getByRole("article").filter({ hasText: "producto-e2e" })
    .getByRole("button", { name: "Editar" }).click();
  await page.getByRole("button", { name: "Eliminar definitivamente" }).click();
  await expect(page.getByRole("heading", { name: "Eliminar definitivamente «Producto Editado E2E»" }))
    .toBeVisible();
  await expect(page.getByText("Esta acción no se puede deshacer.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar definitivamente" }).click();
  const deleteSuccess = page.getByRole("status");
  await expect(deleteSuccess).toHaveText("Producto Producto Editado E2E eliminado definitivamente.");
  await expect(deleteSuccess).toBeHidden({ timeout: 4000 });
  await expect(page.getByRole("article").filter({ hasText: "producto-e2e" })).toHaveCount(0);
  await page.goto("/caja");
  await expect(page.getByRole("button", { name: "Añadir Producto Editado E2E a la comanda" }))
    .toHaveCount(0);

  expect(cajaApi.handledRequests).toContain("POST /api/caja/products");
  expect(cajaApi.handledRequests).toContain("PATCH /api/caja/products/producto-e2e");
  expect(cajaApi.handledRequests).toContain("PATCH /api/caja/products/producto-e2e/deactivate");
  expect(cajaApi.handledRequests).toContain("PATCH /api/caja/products/producto-e2e/reactivate");
  expect(cajaApi.handledRequests).toContain("DELETE /api/caja/products/producto-e2e");
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
  await page.goto("/caja");

  await expect(page.getByRole("alert")).toHaveText("Catálogo E2E no disponible");
  await expect(page.getByText("Cerveza E2E")).toHaveCount(0);
  await expect(page.getByText("Refresco")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reintentar catálogo" })).toBeVisible();
});
