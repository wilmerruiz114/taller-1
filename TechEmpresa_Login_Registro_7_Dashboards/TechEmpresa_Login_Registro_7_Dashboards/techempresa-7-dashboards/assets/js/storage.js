/** Persistencia local; nunca se envían datos por la red. */
(function () {
  'use strict';
  const app = window.TechEmpresa;
  const key = window.TechEmpresaAuth?.stateKey || 'techempresa-frontend-v1';
  const account = window.TechEmpresaAuth?.currentUser;
  const defaults = () => JSON.parse(JSON.stringify(app.data.seed));
  const string = (value, fallback, max = 3000) =>
    typeof value === 'string' ? value.slice(0, max) : fallback;
  let persistent = true;
  let state = defaults();

  function normalize(value) {
    const clean = defaults();
    if (!value || value.version !== 1) return clean;
    for (const name of ['name', 'email', 'phone', 'address']) {
      clean.profile[name] = string(
        value.profile?.[name],
        clean.profile[name],
        255,
      );
    }
    if (Array.isArray(value.favorites)) {
      clean.favorites = [
        ...new Set(
          value.favorites.filter((id) =>
            app.data.products.some((p) => p.id === id),
          ),
        ),
      ];
    }
    if (Array.isArray(value.orders)) {
      clean.orders = value.orders
        .filter(
          (o) =>
            o &&
            Number.isInteger(o.id) &&
            Number.isFinite(o.total) &&
            typeof o.date === 'string' &&
            !Number.isNaN(Date.parse(o.date)),
        )
        .slice(0, 500)
        .map((o) => ({
          id: o.id,
          total: o.total,
          date: o.date,
          products: string(o.products, 'Producto de demostración', 200),
          status: 'Pendiente',
        }));
    }
    if (Array.isArray(value.notifications)) {
      clean.notifications = value.notifications
        .filter((n) => n && typeof n.id === 'string')
        .slice(0, 500)
        .map((n) => ({
          id: n.id,
          title: string(n.title, 'Notificación', 200),
          message: string(n.message, '', 500),
          category: string(n.category, 'Cuenta', 40),
          read: n.read === true,
        }));
    }
    if (Array.isArray(value.tickets)) {
      clean.tickets = value.tickets
        .filter(
          (t) =>
            t &&
            Number.isInteger(t.id) &&
            typeof t.date === 'string' &&
            !Number.isNaN(Date.parse(t.date)),
        )
        .slice(0, 500)
        .map((t) => ({
          id: t.id,
          subject: string(t.subject, 'Consulta', 160),
          message: string(t.message, ''),
          date: t.date,
          status: 'Abierto',
        }));
    }
    clean.preferences.theme = ['dark', 'light', 'system'].includes(
      value.preferences?.theme,
    )
      ? value.preferences.theme
      : 'system';
    clean.assistant.open = value.assistant?.open === true;
    if (Array.isArray(value.assistant?.messages)) {
      clean.assistant.messages = value.assistant.messages
        .filter(
          (message) =>
            message &&
            ['user', 'assistant'].includes(message.role) &&
            typeof message.text === 'string',
        )
        .slice(-40)
        .map((message) => ({
          role: message.role,
          whatsapp: message.whatsapp === true,
          text: message.text.slice(0, 1000),
          links: Array.isArray(message.links)
            ? message.links
                .filter((key) => Object.hasOwn(app.data.views, key))
                .slice(0, 3)
            : [],
        }));
    }
    clean.layout.sidebarCollapsed = value.layout?.sidebarCollapsed === true;
    clean.preferences.orders = value.preferences?.orders !== false;
    clean.preferences.offers = value.preferences?.offers !== false;
    return clean;
  }

  try {
    let saved = localStorage.getItem(key);
    const newAccount = account && !saved;
    if (newAccount) {
      const old = localStorage.getItem('techempresa-frontend-v1');
      const claimed = localStorage.getItem('techempresa-legacy-claimed-v1');
      if (old && !claimed) saved = old;
      else if (old) {
        try {
          const settings = JSON.parse(old);
          saved = JSON.stringify({
            ...defaults(),
            preferences: settings.preferences,
            layout: settings.layout,
          });
        } catch {
          /* Se utilizan valores iniciales si la configuración antigua no se puede leer. */
        }
      }
    }
    if (saved) {
      try {
        state = normalize(JSON.parse(saved));
      } catch {
        state = defaults();
      }
    }
    if (newAccount) {
      state.profile.name = account.name;
      state.profile.email = account.email;
    }
    localStorage.setItem(key, JSON.stringify(state));
    if (newAccount && !localStorage.getItem('techempresa-legacy-claimed-v1'))
      localStorage.setItem('techempresa-legacy-claimed-v1', account.id);
  } catch {
    persistent = false;
  }

  app.store = {
    state,
    get persistent() {
      return persistent;
    },
    save() {
      try {
        localStorage.setItem(key, JSON.stringify(state));
        return true;
      } catch {
        persistent = false;
        const warning = document.getElementById('storageNotice');
        if (warning) warning.hidden = false;
        return false;
      }
    },
  };
})();
