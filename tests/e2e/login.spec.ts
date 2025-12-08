import { test, expect } from '@playwright/test';

test('login de socio navega a /inicio y muestra el mensaje de bienvenida', async ({ page }) => {
  // Ir directamente a la página de login
  await page.goto('/login');

  // Rellenar credenciales del socio creadas por seed en la BD
  await page.getByPlaceholder('Usuario').fill('socio@test.com');
  await page.getByPlaceholder('Contraseña').fill('socio123');

  // Enviar formulario
  await page.getByRole('button', { name: 'Login' }).click();

  // Debería redirigir a /inicio (ruta protegida)
  await page.waitForURL('**/inicio');

  // Y mostrar el título de bienvenida de la página Inicio
  await expect(
    page.getByRole('heading', { name: 'Bienvenido/a a Rural Connect' })
  ).toBeVisible();
});
