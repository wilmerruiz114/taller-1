/** Tema temprano: Negro, Blanco o la paleta de marca de TechEmpresa. */
(function () {
  'use strict';
  const key = window.TechEmpresaAuth?.stateKey || 'techempresa-frontend-v1';
  const choices = ['dark', 'light', 'system'];
  let selection = 'system';
  try {
    const saved = JSON.parse(
      localStorage.getItem(key) ||
        localStorage.getItem('techempresa-frontend-v1') ||
        'null',
    );
    if (choices.includes(saved?.preferences?.theme))
      selection = saved.preferences.theme;
  } catch {
    /* Se utiliza el tema del sistema si el guardado está bloqueado. */
  }

  function apply(value) {
    selection = choices.includes(value) ? value : 'system';
    const mode = selection;
    document.documentElement.dataset.theme = selection;
    document.documentElement.dataset.colorMode = mode;
    document.documentElement.style.colorScheme =
      mode === 'dark' ? 'dark' : 'light';
    window.dispatchEvent(
      new CustomEvent('techempresa:themechange', {
        detail: { selection, mode },
      }),
    );
  }

  window.TechEmpresaTheme = {
    set: apply,
    get selection() {
      return selection;
    },
    get mode() {
      return document.documentElement.dataset.colorMode;
    },
  };
  window.addEventListener('storage', (event) => {
    if (event.key !== key) return;
    try {
      const saved = JSON.parse(event.newValue || 'null');
      apply(saved?.preferences?.theme || 'system');
    } catch {
      /* Un estado dañado no debe interrumpir la interfaz. */
    }
  });
  apply(selection);
})();
