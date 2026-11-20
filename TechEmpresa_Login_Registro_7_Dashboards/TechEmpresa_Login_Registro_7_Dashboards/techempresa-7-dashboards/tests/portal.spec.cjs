const { test, expect } = require('@playwright/test');

// Las pruebas de dashboards parten de una cuenta y sesión de prueba locales.
// Los formularios reales se comprueban por separado en auth.spec.cjs.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      const account = {
        id: 'test-user',
        name: 'Andrea Torres',
        email: 'cliente@ejemplo.com',
        salt: '00'.repeat(16),
        passwordHash: '00'.repeat(32),
        iterations: 100000,
      };
      localStorage.setItem(
        'techempresa-accounts-v1',
        JSON.stringify([account]),
      );
      sessionStorage.setItem(
        'techempresa-session-v1',
        JSON.stringify({
          accountId: account.id,
          expiresAt: Date.now() + 86400000,
        }),
      );
    } catch {
      /* El caso de almacenamiento bloqueado verifica el error del login. */
    }
  });
});

const pages = [
  'inicio',
  'compras',
  'catalogo',
  'pedidos',
  'notificaciones',
  'perfil',
  'ayuda',
];

for (const slug of pages) {
  test(`Carga de ${slug}: sin errores ni solicitudes externas`, async ({
    page,
  }) => {
    const errors = [],
      failed = [],
      external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push(r.url());
    });
    page.on('request', (r) => {
      if (!r.url().startsWith('http://127.0.0.1:8790/')) external.push(r.url());
    });
    await page.goto(slug === 'inicio' ? '/' : '/' + slug + '.html');
    await expect(page.locator('.view:visible')).toHaveCount(1);
    await expect(page.locator('.view:visible')).toHaveAttribute(
      'data-view',
      slug,
    );
    await expect(page.locator('.view:visible .metric')).toHaveCount(4);
    await expect(page.locator('.nav [aria-current=page]')).toHaveAttribute(
      'href',
      slug === 'inicio' ? 'index.html' : slug + '.html',
    );
    await expect(page.locator('.brand .brand-full')).toBeVisible();
    expect(
      await page
        .locator('.brand .brand-full')
        .evaluate((img) => img.complete && img.naturalWidth === 240),
    ).toBeTruthy();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    expect(errors).toEqual([]);
    expect(failed).toEqual([]);
    expect(external).toEqual([]);
  });
}

test('Catálogo combina búsqueda, categoría y favoritos; persiste al recargar', async ({
  page,
}) => {
  await page.goto('/catalogo.html');
  await page
    .getByRole('button', { name: 'Explorar productos', exact: true })
    .click();
  await expect(page.locator('#products .product')).toHaveCount(6);
  await page.locator('#productSearch').fill('Laptop');
  await page.locator('#categoryFilter').selectOption('Audio');
  await expect(page.locator('#productsEmpty')).toBeVisible();
  await page.locator('#categoryFilter').selectOption('Computadoras');
  await page
    .getByRole('button', { name: 'Ver Laptop Pro 14”', exact: true })
    .click();
  await page
    .getByRole('button', { name: '♥ Quitar favorito', exact: true })
    .click();
  await expect(page.locator('#view-catalogo [data-stat=favorites]')).toHaveText(
    '35',
  );
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('#view-catalogo [data-stat=favorites]')).toHaveText(
    '35',
  );
});

test('Pedido de demostración actualiza resumen, listado y notificaciones', async ({
  page,
}) => {
  await page.goto('/catalogo.html');
  await page
    .getByRole('button', { name: 'Ver Monitor QHD', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Solicitar producto (demo)', exact: true })
    .click();
  await page.locator('.nav a[href="pedidos.html"]').click();
  await expect(page.locator('#ordersTable')).toContainText('#1062');
  await expect(
    page.locator('#view-pedidos [data-stat=totalOrders]'),
  ).toHaveText('19');
  await page.locator('.nav a[href="notificaciones.html"]').click();
  await expect(page.locator('#notificationList')).toContainText(
    'Pedido #1062 registrado',
  );
  await page
    .getByRole('button', { name: 'Marcar todas leídas', exact: true })
    .click();
  await expect(
    page.locator('#view-notificaciones [data-stat=unread]'),
  ).toHaveText('0');
  await page.reload();
  await expect(
    page.locator('#view-notificaciones [data-stat=unread]'),
  ).toHaveText('0');
});

test('Perfil muestra HTML como texto y guarda datos al cambiar de pantalla', async ({
  page,
}) => {
  await page.goto('/perfil.html');
  await page
    .getByRole('button', { name: 'Editar perfil', exact: true })
    .click();
  await page.getByLabel('Nombre completo').fill('<img src=x onerror=alert(1)>');
  await page.getByLabel('Teléfono', { exact: true }).fill('0999999999');
  await page.getByLabel('Dirección', { exact: true }).fill('Quito');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('.account')).toContainText(
    '<img src=x onerror=alert(1)>',
  );
  await expect(page.locator('.account img')).toHaveCount(0);
  await expect(
    page.locator('#view-perfil [data-stat=profileComplete]'),
  ).toHaveText('100%');
  await page.locator('.nav a[href="index.html"]').click();
  await page.reload();
  await expect(page.locator('.account')).toContainText(
    '<img src=x onerror=alert(1)>',
  );
});

test('Ayuda busca sin tildes y guarda tickets locales', async ({ page }) => {
  await page.goto('/ayuda.html');
  await page.locator('#faqSearch').fill('como actualizar');
  await expect(page.locator('#faqList details:visible')).toHaveCount(1);
  await page.locator('#faqList details:visible summary').click();
  await expect(page.locator('#faqList details:visible p')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir ticket', exact: true }).click();
  await page.getByLabel('Asunto', { exact: true }).fill('Consulta de prueba');
  await page
    .getByLabel('Mensaje', { exact: true })
    .fill('Necesito ayuda con mi pedido de demostración.');
  await page
    .getByRole('button', { name: 'Guardar solicitud', exact: true })
    .click();
  await expect(page.locator('#ticketList')).toContainText('Consulta de prueba');
  await expect(page.locator('#view-ayuda [data-stat=openTickets]')).toHaveText(
    '2',
  );
  await page.reload();
  await page.locator('.ticket-history summary').click();
  await expect(page.locator('#ticketList')).toContainText('Consulta de prueba');
});

test('El acceso explica cuando el navegador bloquea el almacenamiento', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Blocked');
      },
    });
  });
  await page.goto('/');
  await expect(page).toHaveURL(/login.html$/);
  await expect(page.locator('#authNotice')).toContainText(
    'bloquea el almacenamiento',
  );
});

test('Un estado local dañado se recupera sin romper las pantallas', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('techempresa-frontend-v1:test-user', '{invalid-json'),
  );
  await page.goto('/perfil.html');
  await expect(page.locator('#view-perfil [data-profile=name]')).toHaveText(
    'Andrea Torres',
  );
  await expect(page.locator('#storageNotice')).toBeHidden();
});

for (const width of [320, 390, 768, 1280]) {
  test(`Navegación y diseño sin desbordamiento a ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    for (const slug of pages) {
      if (width <= 720) await page.locator('#menuToggle').click();
      await page
        .locator(
          `.nav a[href="${slug === 'inicio' ? 'index.html' : slug + '.html'}"]`,
        )
        .click();
      await expect(page.locator(`#view-${slug}`)).toBeVisible();
      const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        width: document.documentElement.scrollWidth,
      }));
      expect(layout.width).toBeLessThanOrEqual(layout.viewport);
      await expect(page.locator('#menuOverlay')).toBeHidden();
    }
  });
}

test('Menú compacto: conserva el ancho y la preferencia en los siete dashboards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  await page.locator('#menuToggle').click();
  await expect(page.locator('#menuToggle')).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  for (const slug of pages) {
    const filename = slug === 'inicio' ? 'index.html' : slug + '.html';
    await page.locator(`.nav a[href="${filename}"]`).click();
    await expect(page.locator('body')).toHaveClass(/is-collapsed/);
    const layout = await page.evaluate(() => ({
      mainWidth: document.querySelector('.main').getBoundingClientRect().width,
      mainX: document.querySelector('.main').getBoundingClientRect().x,
      sidebar: document.querySelector('.sidebar').getBoundingClientRect().width,
      width: innerWidth,
    }));
    expect(layout.sidebar).toBe(64);
    expect(layout.mainX).toBe(64);
    expect(layout.mainWidth).toBe(layout.width - 64);
    await expect(page.locator('.brand-mark')).toBeVisible();
    await expect(page.locator('.brand-full')).toBeHidden();
    await expect(page.locator('.nav .nav-label:visible')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('body')).toHaveClass(/is-collapsed/);
  }
  await page.locator('#menuToggle').click();
  await expect(page.locator('body')).not.toHaveClass(/is-collapsed/);
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/is-collapsed/);
  await expect(page.locator('.nav .nav-label:visible')).toHaveCount(7);
});

test('Pasar de escritorio compacto a móvil mantiene el menú utilizable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.locator('#menuToggle').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#menuToggle').click();
  await expect(page.locator('.nav .nav-label:visible')).toHaveCount(7);
  await expect(page.locator('.brand-full')).toBeVisible();
  await page.locator('.nav a[href="ayuda.html"]').click();
  await expect(page.locator('#view-ayuda')).toBeVisible();
  await expect(page.locator('#menuOverlay')).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('.brand-mark')).toBeVisible();
  await expect
    .poll(() =>
      page.locator('.main').evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBe(1216);
});

test('La configuración nueva conserva perfil y favoritos de una versión anterior', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('techempresa-frontend-v1')) {
      localStorage.setItem(
        'techempresa-frontend-v1',
        JSON.stringify({
          version: 1,
          profile: {
            name: 'Cliente existente',
            email: 'cliente@example.com',
            phone: '0999999999',
            address: 'Quito',
          },
          favorites: [2],
          orders: [],
          tickets: [],
          preferences: { orders: false, offers: true },
        }),
      );
    }
  });
  await page.goto('/perfil.html');
  await expect(page.locator('#view-perfil [data-profile=phone]')).toHaveText(
    '0999999999',
  );
  await expect(page.locator('#view-perfil [data-profile=address]')).toHaveText(
    'Quito',
  );
  await page.locator('#menuToggle').click();
  await page.locator('.nav a[href="catalogo.html"]').click();
  await expect(page.locator('#view-catalogo [data-stat=favorites]')).toHaveText(
    '35',
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem(window.TechEmpresaAuth.stateKey)),
  );
  expect(saved.profile.name).toBe('Andrea Torres');
  expect(saved.profile.phone).toBe('0999999999');
  expect(saved.preferences.orders).toBe(false);
  expect(saved.layout.sidebarCollapsed).toBe(true);
});

for (const theme of ['dark', 'light']) {
  test(`Tema ${theme}: se aplica y conserva en los siete HTML`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('#themeSelect').selectOption(theme);
    const expected =
      theme === 'dark' ? 'rgb(12, 13, 16)' : 'rgb(245, 246, 248)';
    for (const slug of pages) {
      await page
        .locator(
          `.nav a[href="${slug === 'inicio' ? 'index.html' : slug + '.html'}"]`,
        )
        .click();
      await expect(page.locator('html')).toHaveAttribute(
        'data-color-mode',
        theme,
      );
      await expect(page.locator('#themeSelect')).toHaveValue(theme);
      expect(
        await page
          .locator('body')
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe(expected);
    }
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute(
      'data-color-mode',
      theme,
    );
  });
}

test('Sistema conserva exactamente la paleta de marca en los siete HTML', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('#themeSelect')).toHaveValue('system');
  const palette = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      [
        'navy',
        'blue',
        'teal',
        'orange',
        'purple',
        'page',
        'surface',
        'soft',
        'muted',
        'line',
        'sidebar',
      ].map((key) => [key, style.getPropertyValue('--' + key).trim()]),
    );
  });
  expect(palette).toEqual({
    navy: '#092755',
    blue: '#0869e8',
    teal: '#04ae9e',
    orange: '#ffa244',
    purple: '#8052eb',
    page: '#edf4ff',
    surface: '#ffffff',
    soft: '#f1f6ff',
    muted: '#667fa4',
    line: '#e3edf9',
    sidebar: '240px',
  });
  for (const slug of pages) {
    await page
      .locator(
        `.nav a[href="${slug === 'inicio' ? 'index.html' : slug + '.html'}"]`,
      )
      .click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-color-mode',
      'system',
    );
    expect(
      await page
        .locator('body')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe('rgb(237, 244, 255)');
    expect(
      await page
        .locator('.sidebar')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe('rgb(9, 39, 85)');
    await expect(page.locator('.brand-full')).toHaveAttribute(
      'src',
      'assets/img/logo.svg',
    );
  }
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute(
    'data-color-mode',
    'system',
  );
  expect(
    await page
      .locator('body')
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe('rgb(237, 244, 255)');
});

test('Botón directo de WhatsApp en los siete dashboards', async ({ page }) => {
  const outgoing = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://wa.me/'))
      outgoing.push(request.url());
  });
  for (const slug of pages) {
    await page.goto(slug === 'inicio' ? '/' : '/' + slug + '.html');
    const link = page.getByRole('link', {
      name: 'Contactar por WhatsApp',
      exact: true,
    });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      'href',
      'https://wa.me/521234567890?text=Hola%2C%20necesito%20informaci%C3%B3n',
    );
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(
      page.locator('#assistantLauncher, #assistantPanel'),
    ).toHaveCount(0);
    expect(await page.locator('script[src="assets/js/app.js"]').count()).toBe(
      1,
    );
  }
  expect(outgoing).toEqual([]);
});

test('Botón y temas funcionan en móvil sin desbordamientos', async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 640 });
    await page.goto('/');
    for (const theme of ['dark', 'light', 'system']) {
      await page.locator('#themeSelect').selectOption(theme);
      const layout = await page.evaluate(() => {
        const button = document
          .querySelector('.whatsapp-button')
          .getBoundingClientRect();
        return {
          viewport: innerWidth,
          content: document.documentElement.scrollWidth,
          x: button.x,
          right: button.right,
          bottom: button.bottom,
          height: innerHeight,
        };
      });
      expect(layout.content).toBeLessThanOrEqual(layout.viewport);
      expect(layout.x).toBeGreaterThanOrEqual(0);
      expect(layout.right).toBeLessThanOrEqual(layout.viewport);
      expect(layout.bottom).toBeLessThanOrEqual(layout.height);
    }
  }
});

test('El clic prepara el texto solicitado en una pestaña nueva, sin contactar WhatsApp durante la prueba', async ({
  page,
  context,
}) => {
  await context.route('https://wa.me/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'Destino interceptado para la prueba local.',
    }),
  );
  await page.goto('/');
  const popupPromise = context.waitForEvent('page');
  await page
    .getByRole('link', { name: 'Contactar por WhatsApp', exact: true })
    .click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  const url = new URL(popup.url());
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toBe('/521234567890');
  expect(url.searchParams.get('text')).toBe('Hola, necesito información');
  expect(await popup.evaluate(() => window.opener === null)).toBe(true);
});
