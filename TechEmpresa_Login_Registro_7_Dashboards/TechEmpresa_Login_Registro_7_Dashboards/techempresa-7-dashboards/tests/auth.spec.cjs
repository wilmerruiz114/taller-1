const { test, expect } = require('@playwright/test');
const password = 'ClaveUniversidad123';

async function register(page, email = 'ana@example.com', name = 'Ana Torres') {
  await page.goto('/registro.html');
  await page.getByLabel('Nombre completo', { exact: true }).fill(name);
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill(password);
  await page.locator('#registerForm button[type=submit]').click();
  await expect(page).toHaveURL(/login.html\?registered=1$/);
}

async function login(page, email = 'ana@example.com', remember = false) {
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  if (remember)
    await page.getByLabel('Recordar sesión', { exact: true }).check();
  await page.locator('#loginForm button[type=submit]').click();
  await expect(page).toHaveURL(/index.html$/);
  await expect(page.locator('#view-inicio')).toBeVisible();
}

test('Registro -> login -> dashboard -> cierre de sesión', async ({ page }) => {
  await register(page);
  await expect(page.locator('#authNotice')).toContainText(
    'Cuenta creada correctamente',
  );
  await expect(page.locator('#loginEmail')).toHaveValue('ana@example.com');
  await login(page);
  await expect(page.locator('.account')).toContainText('Ana Torres');
  await page.reload();
  await expect(page.locator('#view-inicio')).toBeVisible();
  await page.locator('.logout').click();
  await expect(page).toHaveURL(/login.html$/);
  await page.goto('/pedidos.html');
  await expect(page).toHaveURL(/login.html$/);
});

test('Los siete dashboards llevan al login cuando no hay sesión', async ({
  page,
}) => {
  for (const file of [
    'index',
    'compras',
    'catalogo',
    'pedidos',
    'notificaciones',
    'perfil',
    'ayuda',
  ]) {
    await page.goto('/' + file + '.html');
    await expect(page).toHaveURL(/login.html$/);
    await expect(page.locator('#loginForm')).toBeVisible();
  }
});

test('Registro rechaza confirmación distinta y no guarda la contraseña en texto', async ({
  page,
}) => {
  await page.goto('/registro.html');
  await page.getByLabel('Nombre completo', { exact: true }).fill('Ana Torres');
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill('ana@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page
    .getByLabel('Confirmar contraseña', { exact: true })
    .fill('OtraClave123');
  await page.locator('#registerForm button[type=submit]').click();
  await expect(page.locator('#authNotice')).toContainText(
    'Las contraseñas no coinciden',
  );
  expect(
    await page.evaluate(() => localStorage.getItem('techempresa-accounts-v1')),
  ).toBeNull();
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill(password);
  await page.locator('#registerForm button[type=submit]').click();
  await expect(page).toHaveURL(/login.html\?registered=1$/);
  const saved = await page.evaluate(() =>
    localStorage.getItem('techempresa-accounts-v1'),
  );
  expect(saved).not.toContain(password);
  const account = JSON.parse(saved)[0];
  expect(account.salt).toMatch(/^[a-f0-9]{32}$/);
  expect(account.passwordHash).toMatch(/^[a-f0-9]{64}$/);
});

test('Registro detecta correos duplicados sin distinguir mayúsculas', async ({
  page,
}) => {
  await register(page);
  await page.getByRole('link', { name: 'Registrarse', exact: true }).click();
  await page
    .getByLabel('Nombre completo', { exact: true })
    .fill('Otra persona');
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill('ANA@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill(password);
  await page.locator('#registerForm button[type=submit]').click();
  await expect(page.locator('#authNotice')).toContainText('ya está registrado');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('techempresa-accounts-v1')).length,
    ),
  ).toBe(1);
});

test('Login rechaza contraseñas incorrectas y permite mostrarlas', async ({
  page,
}) => {
  await register(page);
  await page.locator('#loginPassword').fill('Incorrecta123');
  await page
    .getByRole('button', { name: 'Mostrar contraseña', exact: true })
    .click();
  await expect(page.locator('#loginPassword')).toHaveAttribute('type', 'text');
  await page
    .getByRole('button', { name: 'Ocultar contraseña', exact: true })
    .click();
  await expect(page.locator('#loginPassword')).toHaveAttribute(
    'type',
    'password',
  );
  await page.locator('#loginForm button[type=submit]').click();
  await expect(page.locator('#authNotice')).toContainText(
    'Correo o contraseña incorrectos',
  );
  await expect(page).toHaveURL(/login.html\?registered=1$/);
});

test('Recordar sesión mantiene el acceso en otra pestaña y salir lo invalida', async ({
  page,
  context,
}) => {
  await register(page);
  await login(page, 'ana@example.com', true);
  const other = await context.newPage();
  await other.goto('/catalogo.html');
  await expect(other.locator('#view-catalogo')).toBeVisible();
  await other.locator('.logout').click();
  await page.goto('/perfil.html');
  await expect(page).toHaveURL(/login.html$/);
});

test('Las cuentas conservan sus datos por separado', async ({ page }) => {
  await register(page);
  await login(page);
  await page.locator('.nav a[href="perfil.html"]').click();
  await page
    .getByRole('button', { name: 'Editar perfil', exact: true })
    .click();
  await page.getByLabel('Teléfono', { exact: true }).fill('0991111111');
  await page
    .getByRole('button', { name: 'Guardar cambios', exact: true })
    .click();
  const firstKey = await page.evaluate(() => window.TechEmpresaAuth.stateKey);
  await page.locator('.logout').click();
  await register(page, 'luis@example.com', 'Luis Pérez');
  await login(page, 'luis@example.com');
  await page.locator('.nav a[href="perfil.html"]').click();
  await expect(page.locator('#view-perfil [data-profile=name]')).toHaveText(
    'Luis Pérez',
  );
  await expect(page.locator('#view-perfil [data-profile=phone]')).toHaveText(
    'No configurado',
  );
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).profile.phone,
      firstKey,
    ),
  ).toBe('0991111111');
});

test('El tema elegido en registro se conserva al entrar al dashboard', async ({
  page,
}) => {
  await page.goto('/registro.html');
  await page.locator('#themeSelect').selectOption('dark');
  await register(page);
  await expect(page.locator('#themeSelect')).toHaveValue('dark');
  await login(page);
  await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark');
});

test('Login y registro son adaptables y sus recursos se cargan localmente', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const file of ['login', 'registro']) {
      await page.goto('/' + file + '.html');
      await expect(page.locator('.auth-card')).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator('.auth-building')
            .evaluate((img) => img.complete && img.naturalWidth > 0),
        )
        .toBe(true);
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(layout.content).toBeLessThanOrEqual(layout.width);
    }
  }
  expect(errors).toEqual([]);
});

test('Recuperar acceso explica la demostración sin simular correos', async ({
  page,
}) => {
  await page.goto('/login.html');
  await page
    .getByRole('button', { name: '¿Olvidaste tu contraseña?', exact: true })
    .click();
  await expect(page.locator('#recoveryDialog')).toBeVisible();
  await expect(page.locator('#recoveryDialog')).toContainText(
    'no envía correos',
  );
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(page.locator('#recoveryDialog')).toBeHidden();
});
