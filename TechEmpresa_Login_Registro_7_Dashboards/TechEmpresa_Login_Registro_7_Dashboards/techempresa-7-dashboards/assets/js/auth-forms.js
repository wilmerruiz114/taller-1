/** Registro -> login -> Inicio. Formularios de la demostración académica. */
(function () {
  'use strict';
  const auth = window.TechEmpresaAuth;
  const form =
    document.getElementById('loginForm') ||
    document.getElementById('registerForm');
  const notice = document.getElementById('authNotice');
  const register = form.id === 'registerForm';

  function show(message, kind = 'error') {
    notice.textContent = message;
    notice.className = 'auth-notice ' + kind;
    notice.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    notice.hidden = false;
  }

  if (auth.currentUser) {
    location.replace('index.html');
    return;
  }
  if (!auth.storageAvailable)
    show(
      'El navegador bloquea el almacenamiento. Permítelo y vuelve a cargar la página.',
    );
  if (
    !register &&
    new URLSearchParams(location.search).get('registered') === '1'
  ) {
    show(
      'Cuenta creada correctamente. Inicia sesión para entrar a tu dashboard.',
      'success',
    );
    try {
      const email = sessionStorage.getItem('techempresa-registration-email');
      if (email) document.getElementById('loginEmail').value = email;
      sessionStorage.removeItem('techempresa-registration-email');
    } catch {
      /* El formulario se puede completar manualmente. */
    }
  }

  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const field = document.getElementById(button.dataset.togglePassword);
      const reveal = field.type === 'password';
      field.type = reveal ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(reveal));
      button.setAttribute(
        'aria-label',
        (reveal ? 'Ocultar ' : 'Mostrar ') +
          (field.name === 'confirm'
            ? 'confirmación de contraseña'
            : 'contraseña'),
      );
    });
  });

  document
    .getElementById('forgotPassword')
    ?.addEventListener('click', () =>
      document.getElementById('recoveryDialog').showModal(),
    );
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type=submit]');
    const previous = button.innerHTML;
    button.disabled = true;
    button.textContent = register ? 'Creando cuenta…' : 'Verificando…';
    notice.hidden = true;
    try {
      const fields = Object.fromEntries(new FormData(form));
      if (register) {
        const account = await auth.register(fields);
        try {
          sessionStorage.setItem(
            'techempresa-registration-email',
            account.email,
          );
        } catch {
          /* No es obligatorio recordar el correo. */
        }
        location.assign('login.html?registered=1');
      } else {
        await auth.login(fields);
        location.assign('index.html');
      }
    } catch (error) {
      show(
        error.message ||
          'No se pudo completar la operación. Vuelve a intentarlo.',
      );
    } finally {
      button.disabled = false;
      button.innerHTML = previous;
    }
  });
})();
