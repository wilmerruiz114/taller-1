# TechEmpresa — Login, Registro y 7 dashboards

Dos páginas de acceso independientes, basadas en la referencia visual suministrada, conectadas al portal existente. Incluye panel azul de marca, fotografía de edificios, formularios adaptables y los temas Negro, Blanco y Sistema.

## Empezar

1. Descomprime el ZIP completo.
2. Abre la carpeta en VS Code y usa **Live Server**.
3. Abre `login.html` desde esa dirección local.
4. Pulsa **Registrarse**, crea una cuenta de prueba y vuelve al login.
5. Inicia sesión con el correo y la contraseña que acabas de registrar.

Live Server mantiene una misma dirección para compartir las cuentas y la configuración entre HTML. Usa `localhost` o `127.0.0.1` para disponer de Web Crypto. También puedes servir la carpeta desde Apache/XAMPP en `http://localhost/`. No se necesita PHP, MySQL ni compilación para esta demostración.

## Páginas y recorrido

| Pantalla       | Archivo               | Conexión                              |
| -------------- | --------------------- | ------------------------------------- |
| Iniciar sesión | `login.html`          | Credenciales correctas → `index.html` |
| Crear cuenta   | `registro.html`       | Registro correcto → `login.html`      |
| Inicio         | `index.html`          | Acceso a los siete dashboards         |
| Mis compras    | `compras.html`        | Menú del portal                       |
| Mi catálogo    | `catalogo.html`       | Menú del portal                       |
| Mis pedidos    | `pedidos.html`        | Menú del portal                       |
| Notificaciones | `notificaciones.html` | Menú del portal                       |
| Mi perfil      | `perfil.html`         | Menú del portal                       |
| Ayuda          | `ayuda.html`          | Menú del portal                       |

Al entrar a un dashboard sin sesión, se redirige a `login.html`. **Cerrar sesión** elimina la sesión local y vuelve al login. En el login se puede abrir Registro y en Registro se puede volver a Iniciar sesión.

## Funciones del acceso

- Nombre, correo, contraseña y confirmación en el registro.
- Contraseña de entre 8 y 256 caracteres; confirmación coincidente.
- Correos duplicados detectados sin distinguir mayúsculas y minúsculas.
- Iconos para mostrar y ocultar ambas contraseñas.
- Login con correo y contraseña registrados; muestra un error si no coinciden.
- **Recordar sesión:** conserva el acceso local hasta 30 días. Sin marcarlo, la sesión dura mientras se mantenga la pestaña, con un máximo de un día.
- El estado de los dashboards se almacena por cuenta. Cambiar de usuario no mezcla las modificaciones realizadas después de iniciar sesión.
- La primera cuenta recupera la configuración y los datos de demostración de la versión anterior; su nombre y correo se sustituyen por los del registro. Las cuentas siguientes comienzan con datos de muestra y preferencias de apariencia.
- **¿Olvidaste tu contraseña?** explica el alcance de la demostración y enlaza a crear otra cuenta de prueba. No simula el envío de correos.

Esta es una **demostración académica local**, sin servidor de autenticación. Las cuentas, sus hashes y las sesiones se guardan en el navegador. Las contraseñas no se almacenan en texto: se deriva un hash PBKDF2-SHA-256 con sal aleatoria y 100 000 iteraciones mediante Web Crypto. Un control de acceso solo en el navegador no protege datos en un servidor; una aplicación real necesita autenticación y validación del lado del servidor.

El correo que se usa para iniciar sesión es el del registro. El formulario de perfil conserva sus datos de demostración y no cambia las credenciales de acceso.

## Se conserva el portal

- Siete HTML independientes para los dashboards.
- Menú de 240 px o compacto de 64 px con estado recordado.
- Temas **Negro**, **Blanco** y **Sistema**. Sistema conserva la paleta original `#092755`, `#0869e8`, `#edf4ff` y las demás variables solicitadas.
- Catálogo, búsqueda, favoritos, pedidos y notificaciones de demostración.
- Perfil, preferencias y tickets locales.
- Botón flotante ☎ de WhatsApp en los dashboards, con el número y texto del fragmento proporcionado:

```text
https://wa.me/521234567890?text=Hola%2C%20necesito%20informaci%C3%B3n
```

Abrir ese enlace prepara **Hola, necesito información**; no envía un mensaje automáticamente. El número es un ejemplo y debe sustituirse para usar un contacto real. El panel del bot anterior sigue sustituido por ese botón.

## Archivos

```text
techempresa-7-dashboards/
├── login.html
├── registro.html
├── index.html
├── compras.html
├── catalogo.html
├── pedidos.html
├── notificaciones.html
├── perfil.html
├── ayuda.html
├── assets/
│   ├── css/auth.css          # Diseño de login y registro
│   ├── css/styles.css        # Distribución del portal
│   ├── css/themes.css        # Negro, Blanco y Sistema
│   ├── css/whatsapp.css      # Contacto flotante
│   ├── js/auth.js            # Cuentas, sesiones y navegación de acceso
│   ├── js/auth-forms.js      # Formularios y validación
│   ├── js/theme.js           # Tema inicial
│   ├── js/ui.js              # Selector de temas
│   ├── js/data.js            # Datos ficticios
│   ├── js/storage.js         # Estado y migración por cuenta
│   ├── js/app.js             # Interacciones del portal
│   └── img/                 # Marca y fotografía local
├── design/                  # SVG original de los dashboards
├── tests/
├── playwright.config.cjs
├── package.json
└── package-lock.json
```

La fotografía del edificio se incluye en `assets/img/office-building.jpg` para evitar depender de una conexión externa al abrir el proyecto. Fuente: [Unsplash](https://images.unsplash.com/photo-1486406146926-c627a92ad1ab). Es una imagen de ambientación; no representa una sede real de TechEmpresa.

## Verificación opcional

Node.js solo es necesario para las herramientas de desarrollo:

```sh
npm ci
npx playwright install chromium
npm test
npm run format:check
```

36 pruebas aprobadas con Chromium: recorrido registro → login → dashboard → cierre de sesión, acceso sin sesión, contraseñas y duplicados, visibilidad de contraseña, persistencia de sesión, separación de datos, temas, diseño adaptable y regresiones del portal. Las pruebas utilizan un servidor HTTP local en el puerto 8790.

## Persistencia

Mantén la misma dirección, puerto y perfil del navegador para recuperar las cuentas y preferencias. Borrar los datos del sitio elimina las cuentas locales y sus modificaciones. El almacenamiento se separa por cuenta bajo `techempresa-frontend-v1:<id>`; el estado antiguo se conserva para la migración inicial.
