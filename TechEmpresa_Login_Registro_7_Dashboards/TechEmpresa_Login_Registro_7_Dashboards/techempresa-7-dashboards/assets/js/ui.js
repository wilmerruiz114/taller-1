/** Selector de temas compartido por los siete dashboards. */
(function () {
  'use strict';
  const { store } = window.TechEmpresa;
  const state = store.state;
  const themes = window.TechEmpresaTheme;
  const picker = document.getElementById('themeSelect');

  function updateAppearance() {
    picker.value = themes.selection;
    state.preferences.theme = themes.selection;
    document.querySelectorAll('.brand-full').forEach((logo) => {
      const source =
        themes.mode === 'light'
          ? 'assets/img/logo-light.svg'
          : 'assets/img/logo.svg';
      if (logo.getAttribute('src') !== source) logo.setAttribute('src', source);
    });
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        'content',
        themes.mode === 'dark'
          ? '#0c0d10'
          : themes.mode === 'system'
            ? '#092755'
            : '#f5f6f8',
      );
  }

  function chooseTheme(value) {
    themes.set(value);
    state.preferences.theme = themes.selection;
    store.save();
  }

  picker.addEventListener('change', () => chooseTheme(picker.value));
  window.addEventListener('techempresa:themechange', updateAppearance);
  updateAppearance();
})();
