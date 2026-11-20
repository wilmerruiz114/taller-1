/** Acceso académico local. No sustituye una autenticación en un servidor. */
(function () {
  'use strict';
  const accountsKey = 'techempresa-accounts-v1';
  const sessionKey = 'techempresa-session-v1';
  const rememberKey = 'techempresa-remember-v1';
  const legacyStateKey = 'techempresa-frontend-v1';
  const iterations = 100000;
  let current = null;
  let storageAvailable = true;

  function accounts() {
    const raw = localStorage.getItem(accountsKey);
    if (!raw) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved))
      throw new Error('No se pudo leer el registro local de cuentas.');
    return saved.filter(
      (account) =>
        account &&
        typeof account.id === 'string' &&
        typeof account.email === 'string' &&
        typeof account.name === 'string' &&
        /^[a-f0-9]{32}$/.test(account.salt) &&
        /^[a-f0-9]{64}$/.test(account.passwordHash),
    );
  }

  function readSession(value, registered) {
    if (!value) return null;
    try {
      const saved = JSON.parse(value);
      if (
        !saved ||
        !Number.isFinite(saved.expiresAt) ||
        saved.expiresAt <= Date.now()
      )
        return null;
      const account = registered.find((item) => item.id === saved.accountId);
      return account
        ? { id: account.id, name: account.name, email: account.email }
        : null;
    } catch {
      return null;
    }
  }

  try {
    const registered = accounts();
    current =
      readSession(sessionStorage.getItem(sessionKey), registered) ||
      readSession(localStorage.getItem(rememberKey), registered);
  } catch {
    storageAvailable = false;
  }

  function requireStorage() {
    if (!storageAvailable)
      throw new Error(
        'El navegador bloquea el almacenamiento. Permítelo y vuelve a cargar la página.',
      );
  }

  function email(value) {
    return String(value || '')
      .trim()
      .toLowerCase();
  }
  function hex(bytes) {
    return [...bytes]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
  }

  async function passwordHash(password, salt, rounds = iterations) {
    if (!window.crypto?.subtle)
      throw new Error(
        'Abre el proyecto con Live Server en localhost para utilizar el registro y el login.',
      );
    const saltBytes = new Uint8Array(
      salt.match(/.{2}/g).map((value) => parseInt(value, 16)),
    );
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: rounds },
      key,
      256,
    );
    return hex(new Uint8Array(bits));
  }

  async function register(fields) {
    requireStorage();
    const name = String(fields.name || '').trim();
    const address = email(fields.email);
    const password = String(fields.password || '');
    if (!name || name.length > 120)
      throw new Error('Escribe un nombre de entre 1 y 120 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 190)
      throw new Error('Escribe un correo electrónico válido.');
    if (password.length < 8 || password.length > 256)
      throw new Error('La contraseña debe tener entre 8 y 256 caracteres.');
    if (password !== fields.confirm)
      throw new Error('Las contraseñas no coinciden.');
    if (accounts().some((account) => account.email === address))
      throw new Error('Ese correo ya está registrado. Inicia sesión.');
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await passwordHash(password, salt);
    const registered = accounts();
    if (registered.some((account) => account.email === address))
      throw new Error('Ese correo ya está registrado. Inicia sesión.');
    const account = {
      id: hex(crypto.getRandomValues(new Uint8Array(16))),
      name,
      email: address,
      salt,
      passwordHash: hash,
      iterations,
    };
    registered.push(account);
    localStorage.setItem(accountsKey, JSON.stringify(registered));
    return { id: account.id, name, email: address };
  }

  async function login(fields) {
    requireStorage();
    const account = accounts().find(
      (item) => item.email === email(fields.email),
    );
    if (!account) throw new Error('Correo o contraseña incorrectos.');
    const hash = await passwordHash(
      String(fields.password || ''),
      account.salt,
      account.iterations || iterations,
    );
    if (hash !== account.passwordHash)
      throw new Error('Correo o contraseña incorrectos.');
    const remember = fields.remember === 'on';
    const value = JSON.stringify({
      accountId: account.id,
      expiresAt: Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000,
    });
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(rememberKey);
    if (remember) localStorage.setItem(rememberKey, value);
    else sessionStorage.setItem(sessionKey, value);
    current = { id: account.id, name: account.name, email: account.email };
    return current;
  }

  function logout() {
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(rememberKey);
    current = null;
  }

  window.TechEmpresaAuth = {
    register,
    login,
    logout,
    get currentUser() {
      return current ? { ...current } : null;
    },
    get storageAvailable() {
      return storageAvailable;
    },
    get stateKey() {
      return current ? legacyStateKey + ':' + current.id : legacyStateKey;
    },
  };

  if (!current) document.documentElement.classList.add('auth-checking');
  document.addEventListener('DOMContentLoaded', () => {
    const authPage = ['login', 'registro'].includes(document.body.dataset.page);
    if (!authPage && !current) {
      location.replace('login.html');
      return;
    }
    document.documentElement.classList.remove('auth-checking');
  });
})();
