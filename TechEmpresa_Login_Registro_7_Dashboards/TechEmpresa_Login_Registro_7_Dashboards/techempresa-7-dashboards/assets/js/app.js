/** Navegación e interacciones de la demo. No requiere servidor, Fetch ni módulos. */
(function () {
  'use strict';
  const { data, store } = window.TechEmpresa;
  const state = store.state;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const dialog = $('#appDialog');
  const mobile = window.matchMedia('(max-width: 720px)');
  let toastTimer;
  let catalogExpanded = false;
  let dialogTrigger;

  const escape = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char],
    );
  const money = (value) =>
    '$' + Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const date = (value) =>
    new Intl.DateTimeFormat('es-EC', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value + (value.length === 10 ? 'T12:00:00' : '')));
  const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const normalize = (value) =>
    String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  function toast(message) {
    const box = $('#toast');
    clearTimeout(toastTimer);
    box.textContent = message;
    box.hidden = false;
    toastTimer = setTimeout(() => {
      box.hidden = true;
    }, 6000);
  }

  function persist(message) {
    const saved = store.save();
    toast(
      saved
        ? message
        : `${message} El navegador no permite conservar el cambio al cerrar.`,
    );
    renderAll();
  }

  function status(value) {
    const color =
      value === 'Entregado' || value === 'Resuelto'
        ? 'done'
        : value === 'En camino'
          ? 'route'
          : 'pending';
    return `<span class="status ${color}">${escape(value)}</span>`;
  }

  function updateStats() {
    const unread = state.notifications.filter((n) => !n.read).length;
    const stats = {
      totalOrders: 18 + state.orders.length,
      delivered: 14,
      pendingHome: 4 + state.orders.length,
      pendingOrders: 2 + state.orders.length,
      preparing: 2,
      onroute: 2,
      unread,
      read: 11 + state.notifications.filter((n) => n.read).length,
      catalogProducts: '1,280',
      catalogCategories: 24,
      offers: 18,
      favorites: 34 + state.favorites.length,
      promotions: 5,
      orderNotices: 4 + state.orders.length,
      profileComplete:
        state.profile.phone && state.profile.address ? '100%' : '90%',
      addresses: 2,
      payments: 3,
      openTickets: 1 + state.tickets.length,
      resolvedTickets: 8,
      faqCount: 24,
      guides: 12,
    };
    $$('[data-stat]').forEach((el) => {
      el.textContent = stats[el.dataset.stat];
    });
    $$('[data-profile]').forEach((el) => {
      const name = el.dataset.profile;
      el.textContent =
        state.profile[name] ||
        (name === 'phone' ? 'No configurado' : 'Pendiente de configurar');
    });
    $('#storageNotice').hidden = store.persistent;
  }

  function allOrders() {
    return [...state.orders].reverse().concat(data.orders);
  }

  function renderOrders() {
    $$('.recent-orders').forEach((list) => {
      list.innerHTML = allOrders()
        .slice(0, 3)
        .map(
          (order) =>
            `<a class="item" href="pedidos.html"><span class="item-icon" aria-hidden="true">▣</span><div class="item-main"><strong>Pedido #${order.id}</strong><p>${escape(order.products)}</p></div>${status(order.status)}</a>`,
        )
        .join('');
    });
    if (!$('#ordersTable')) return;
    $('#ordersTable').innerHTML = allOrders()
      .map(
        (order) =>
          `<tr><td><span class="table-icon" aria-hidden="true">▣</span>#${order.id}</td><td>${escape(order.products)}</td><td>${escape(date(order.date))}</td><td>${status(order.id === 1059 ? 'Pendiente' : order.status)}</td></tr>`,
      )
      .join('');
  }

  function renderCatalog() {
    if (!$('#products')) return;
    const query = normalize($('#productSearch').value.trim());
    const category = $('#categoryFilter').value;
    const favoritesOnly = $('#favoritesFilter').checked;
    const pool =
      catalogExpanded || query || category || favoritesOnly
        ? data.products
        : data.products.filter((p) => [1, 2, 4, 6].includes(p.id));
    const visible = pool.filter(
      (p) =>
        (!query || normalize(p.name + ' ' + p.category).includes(query)) &&
        (!category || p.category === category) &&
        (!favoritesOnly || state.favorites.includes(p.id)),
    );
    $('#products').innerHTML = visible
      .map(
        (product) =>
          `<button class="product" type="button" data-product="${product.id}" aria-label="Ver ${escape(product.name)}"><span class="product-icon" aria-hidden="true">▣</span><span><strong>${escape(product.name)}</strong><span class="price">${money(product.price)}</span></span></button>`,
      )
      .join('');
    $('#productsEmpty').hidden = visible.length > 0;
    $$('[data-category]').forEach((button) => {
      const selected = button.dataset.category === category;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function renderNotifications() {
    if (!$('#notificationList')) return;
    $('#notificationList').innerHTML = [...state.notifications]
      .sort((a, b) => Number(a.read) - Number(b.read))
      .map(
        (n) =>
          `<article class="item notification ${n.read ? 'is-read' : ''}"><span class="item-icon" aria-hidden="true">▣</span><div class="item-main"><strong>${escape(n.title)}</strong><p>${escape(n.message)}</p></div><span class="status ${n.category === 'Promoción' ? 'promotion' : ''}">${escape(n.category)}</span><button type="button" class="read-button" data-read="${escape(n.id)}" aria-label="${n.read ? 'Marcar como no leída' : 'Marcar como leída'}: ${escape(n.title)}" title="${n.read ? 'Marcar no leída' : 'Marcar leída'}">${n.read ? '↶' : '✓'}</button></article>`,
      )
      .join('');
    $('#notificationsEmpty').hidden = state.notifications.length > 0;
  }

  function renderTickets() {
    if (!$('#ticketList')) return;
    const tickets = [...state.tickets].reverse();
    $('#ticketList').innerHTML =
      '<p class="hint">Esta muestra incluye 1 ticket abierto y 8 resueltos de referencia. Tus solicitudes creadas aquí aparecen debajo.</p>' +
      (tickets.length
        ? '<div class="rows">' +
          tickets
            .map(
              (ticket) =>
                `<article class="item"><span class="item-icon" aria-hidden="true">▤</span><div class="item-main"><strong>#${ticket.id} · ${escape(ticket.subject)}</strong><p>${escape(ticket.message)}</p><p>${escape(date(ticket.date))}</p></div>${status(ticket.status)}</article>`,
            )
            .join('') +
          '</div>'
        : '<p class="empty">Todavía no has creado nuevas solicitudes en esta demostración.</p>');
  }

  function renderAll() {
    updateStats();
    renderOrders();
    renderCatalog();
    renderNotifications();
    renderTickets();
  }

  function closeMenu() {
    document.body.classList.remove('sidebar-open');
    $('#menuOverlay').hidden = true;
    $('#sidebar').inert = mobile.matches;
    $('#menuToggle').setAttribute(
      'aria-expanded',
      String(
        !mobile.matches && !document.body.classList.contains('is-collapsed'),
      ),
    );
  }

  function route() {
    const slug = document.body.dataset.page || 'inicio';
    const view = data.views[slug] || data.views.inicio;
    document.title = view.label + ' | TechEmpresa Clientes';
    closeMenu();
  }

  function openDialog(title, body) {
    dialogTrigger = document.activeElement;
    $('#dialogTitle').textContent = title;
    $('#dialogBody').innerHTML = body;
    if (!dialog.open) dialog.showModal();
  }

  function formActions(label) {
    return `<div class="form-actions"><button class="button secondary" type="button" data-close-dialog>Cancelar</button><button class="button" type="submit">${label}</button></div>`;
  }

  function showProduct(id) {
    const product = data.products.find((p) => p.id === id);
    if (!product) return;
    const favorite = state.favorites.includes(id);
    openDialog(
      product.name,
      `<div class="dialog-product"><span class="product-icon" aria-hidden="true">▣</span><div><p>${escape(product.description)}</p><span class="price">${money(product.price)}</span></div></div><p class="hint">${escape(product.category)} · ${product.stock} unidades de ejemplo disponibles.</p><p class="notice">El pedido será una simulación guardada en este navegador. No se procesa ningún pago.</p><div class="form-actions"><button class="button secondary" type="button" data-favorite="${id}" aria-pressed="${favorite}">${favorite ? '♥ Quitar favorito' : '♡ Añadir favorito'}</button><button class="button" type="button" data-order="${id}">Solicitar producto (demo)</button></div>`,
    );
  }

  function editProfile() {
    const fields = [
      ['name', 'Nombre completo', 'text', 120],
      ['email', 'Correo electrónico', 'email', 190],
      ['phone', 'Teléfono', 'tel', 45],
      ['address', 'Dirección', 'text', 255],
    ];
    openDialog(
      'Editar perfil',
      `<p class="notice">Datos de demostración. Evita introducir información sensible; este sitio no se conecta a un servidor.</p><form id="profileForm" class="form-grid">${fields.map(([name, label, type, limit]) => `<label>${label}<input type="${type}" name="${name}" maxlength="${limit}" value="${escape(state.profile[name])}" ${name === 'name' || name === 'email' ? 'required' : ''} /></label>`).join('')}${formActions('Guardar cambios')}</form>`,
    );
  }

  function openTicket() {
    openDialog(
      'Abrir ticket de demostración',
      `<p class="notice">La solicitud se guarda en este navegador. No se envía a un equipo de soporte real.</p><form id="ticketForm" class="form-grid"><label>Asunto<input name="subject" maxlength="160" required /></label><label>Mensaje<textarea name="message" minlength="10" maxlength="3000" required></textarea></label><p class="hint">Entre 10 y 3000 caracteres.</p>${formActions('Guardar solicitud')}</form>`,
    );
  }

  function preferences() {
    openDialog(
      'Preferencias de cuenta',
      `<p class="notice">Estas preferencias se guardan solo en este navegador. No activan envíos de correo.</p><form id="preferencesForm" class="form-grid"><label class="check-label"><input type="checkbox" name="orders" ${state.preferences.orders ? 'checked' : ''} /> Avisos de pedidos</label><label class="check-label"><input type="checkbox" name="offers" ${state.preferences.offers ? 'checked' : ''} /> Ofertas y promociones</label>${formActions('Guardar preferencias')}</form>`,
    );
  }

  const actions = {
    'open-ticket': openTicket,
    'edit-profile': editProfile,
    preferences,
    'mark-all': () => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      persist('Notificaciones marcadas como leídas.');
    },
    'explore-products': () => {
      catalogExpanded = true;
      $('#catalogFilters').open = true;
      renderCatalog();
      $('#productSearch').focus();
    },
    'show-favorites': () => {
      catalogExpanded = true;
      $('#catalogFilters').open = true;
      $('#favoritesFilter').checked = true;
      $('#productSearch').value = '';
      $('#categoryFilter').value = '';
      renderCatalog();
      $('#products').scrollIntoView({ block: 'center' });
    },
    'clear-filters': () => {
      $('#productSearch').value = '';
      $('#categoryFilter').value = '';
      $('#favoritesFilter').checked = false;
      catalogExpanded = true;
      renderCatalog();
    },
    payments: () =>
      openDialog(
        'Métodos de pago de ejemplo',
        '<p class="notice">La pantalla del SVG muestra 3 métodos como referencia visual. Esta versión no gestiona pagos ni guarda tarjetas bancarias.</p><p class="hint">Para cobrar o administrar métodos reales se necesita un servidor y una pasarela de pagos.</p><div class="form-actions"><button class="button" type="button" data-close-dialog>Entendido</button></div>',
      ),
    logout: () => {
      window.TechEmpresaAuth.logout();
      location.replace('login.html');
    },
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button, a');
    if (!button) return;
    if (button.hasAttribute('data-close-dialog')) {
      dialog.close();
      return;
    }
    if (button.dataset.action && actions[button.dataset.action]) {
      event.preventDefault();
      actions[button.dataset.action]();
      return;
    }
    if (button.dataset.product) showProduct(Number(button.dataset.product));
    if (button.dataset.category) {
      catalogExpanded = true;
      $('#categoryFilter').value = button.dataset.category;
      $('#catalogFilters').open = true;
      renderCatalog();
      $('#products').scrollIntoView({ block: 'center' });
    }
    if (button.dataset.favorite) {
      const id = Number(button.dataset.favorite);
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter((value) => value !== id)
        : [...state.favorites, id];
      persist('Favoritos actualizados.');
      // Actualizar el botón sin cerrar la ventana ni perder el foco.
      const favorite = state.favorites.includes(id);
      button.textContent = favorite ? '♥ Quitar favorito' : '♡ Añadir favorito';
      button.setAttribute('aria-pressed', String(favorite));
    }
    if (button.dataset.order) {
      const product = data.products.find(
        (p) => p.id === Number(button.dataset.order),
      );
      if (!product) return;
      const id = Math.max(1061, ...state.orders.map((o) => o.id)) + 1;
      state.orders.push({
        id,
        products: product.name,
        total: product.price,
        status: 'Pendiente',
        date: today(),
      });
      state.notifications.unshift({
        id: `order-${id}`,
        title: `Pedido #${id} registrado`,
        message: 'Solicitud de demostración, sin cobro ni envío real.',
        category: 'Pedido',
        read: false,
      });
      dialog.close();
      persist(
        `Pedido de demostración #${id} registrado. No se realizó ningún cobro.`,
      );
    }
    if (button.dataset.read) {
      const notification = state.notifications.find(
        (n) => n.id === button.dataset.read,
      );
      if (notification) {
        notification.read = !notification.read;
        persist(
          notification.read
            ? 'Notificación marcada como leída.'
            : 'Notificación marcada como no leída.',
        );
      }
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (
      !['profileForm', 'ticketForm', 'preferencesForm', 'demoLogin'].includes(
        form.id,
      )
    )
      return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(form));
    if (form.id === 'profileForm') {
      if (!fields.name.trim()) {
        toast('Escribe un nombre válido.');
        return;
      }
      for (const name of ['name', 'email', 'phone', 'address'])
        state.profile[name] = fields[name].trim();
      dialog.close();
      persist('Perfil de demostración actualizado.');
    } else if (form.id === 'ticketForm') {
      if (!fields.subject.trim() || fields.message.trim().length < 10) {
        toast('Escribe un asunto y al menos 10 caracteres de mensaje.');
        return;
      }
      const id = Math.max(100, ...state.tickets.map((ticket) => ticket.id)) + 1;
      state.tickets.push({
        id,
        subject: fields.subject.trim(),
        message: fields.message.trim(),
        date: today(),
        status: 'Abierto',
      });
      dialog.close();
      $('.ticket-history').open = true;
      persist(`Solicitud de demostración #${id} guardada en este navegador.`);
    } else if (form.id === 'preferencesForm') {
      state.preferences.orders = fields.orders === 'on';
      state.preferences.offers = fields.offers === 'on';
      dialog.close();
      persist('Preferencias de demostración guardadas.');
    } else {
      if (!fields.name.trim()) {
        toast('Escribe un nombre válido.');
        return;
      }
      state.profile.name = fields.name.trim();
      dialog.close();
      persist('Nombre de la demostración actualizado.');
    }
  });

  $('.skip-link').addEventListener('click', (event) => {
    event.preventDefault();
    $('#mainContent').setAttribute('tabindex', '-1');
    $('#mainContent').focus();
  });

  $('#menuToggle').addEventListener('click', () => {
    if (mobile.matches) {
      const open = document.body.classList.toggle('sidebar-open');
      $('#menuOverlay').hidden = !open;
      $('#sidebar').inert = !open;
      $('#menuToggle').setAttribute('aria-expanded', String(open));
    } else {
      const collapsed = document.body.classList.toggle('is-collapsed');
      $('#menuToggle').setAttribute('aria-expanded', String(!collapsed));
      state.layout.sidebarCollapsed = collapsed;
      store.save();
    }
  });
  $('#menuOverlay').addEventListener('click', closeMenu);
  window.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      document.body.classList.contains('sidebar-open')
    ) {
      closeMenu();
      $('#menuToggle').focus();
    }
  });
  mobile.addEventListener('change', closeMenu);
  dialog.addEventListener('close', () => {
    if (dialogTrigger?.isConnected) dialogTrigger.focus();
  });
  $('#productSearch')?.addEventListener('input', renderCatalog);
  $('#categoryFilter')?.addEventListener('change', renderCatalog);
  $('#favoritesFilter')?.addEventListener('change', renderCatalog);
  $('#catalogFilters')?.addEventListener('toggle', () => {
    if ($('#catalogFilters').open && !catalogExpanded) {
      catalogExpanded = true;
      renderCatalog();
    }
  });
  $('#faqSearch')?.addEventListener('input', (event) => {
    const query = normalize(event.target.value.trim());
    const questions = $$('#faqList details');
    questions.forEach((question) => {
      question.hidden = !normalize(question.textContent).includes(query);
    });
    $('#faqEmpty').hidden = questions.some((question) => !question.hidden);
  });

  document.body.classList.toggle('is-collapsed', state.layout.sidebarCollapsed);
  route();
  renderAll();
})();
