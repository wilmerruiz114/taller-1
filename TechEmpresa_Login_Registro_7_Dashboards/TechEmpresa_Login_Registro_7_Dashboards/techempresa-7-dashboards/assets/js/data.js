/** Datos ficticios transcritos del SVG; no representan una cuenta real. */
window.TechEmpresa = {
  data: {
    products: [
      {
        id: 1,
        name: 'Laptop Pro 14”',
        category: 'Computadoras',
        price: 950,
        stock: 42,
        description:
          'Portátil de 14 pulgadas para estudiar y trabajar. Producto de demostración.',
      },
      {
        id: 2,
        name: 'Monitor QHD',
        category: 'Monitores',
        price: 320,
        stock: 18,
        description: 'Monitor QHD de 27 pulgadas. Producto de demostración.',
      },
      {
        id: 3,
        name: 'Teclado inalámbrico',
        category: 'Accesorios',
        price: 68,
        stock: 106,
        description:
          'Teclado compacto para tu escritorio. Producto de demostración.',
      },
      {
        id: 4,
        name: 'Audífonos',
        category: 'Audio',
        price: 74,
        stock: 30,
        description:
          'Audífonos inalámbricos para música y llamadas. Producto de demostración.',
      },
      {
        id: 5,
        name: 'Silla ergonómica',
        category: 'Oficina',
        price: 210,
        stock: 21,
        description: 'Silla de oficina ajustable. Producto de demostración.',
      },
      {
        id: 6,
        name: 'Router Wi-Fi 6',
        category: 'Redes',
        price: 129,
        stock: 34,
        description:
          'Router para conectar tus dispositivos. Producto de demostración.',
      },
    ],
    categories: [
      'Computadoras',
      'Monitores',
      'Accesorios',
      'Audio',
      'Oficina',
      'Redes',
    ],
    orders: [
      {
        id: 1058,
        products: 'Laptop empresarial',
        status: 'Entregado',
        date: '2026-11-10',
        total: 950,
      },
      {
        id: 1059,
        products: 'Monitor de 27 pulgadas',
        status: 'En preparación',
        date: '2026-11-12',
        total: 320,
      },
      {
        id: 1060,
        products: 'Accesorios tecnológicos',
        status: 'En camino',
        date: '2026-11-13',
        total: 74,
      },
      {
        id: 1061,
        products: 'Teclado inalámbrico',
        status: 'Entregado',
        date: '2026-11-14',
        total: 68,
      },
    ],
    seed: {
      profile: {
        name: 'Andrea Torres',
        email: 'cliente@ejemplo.com',
        phone: '',
        address: '',
      },
      favorites: [1, 4],
      orders: [],
      notifications: [
        {
          id: 'n1',
          title: 'Pedido #1058 enviado',
          message: 'Tu pedido está en camino.',
          category: 'Pedido',
          read: false,
        },
        {
          id: 'n2',
          title: 'Oferta disponible',
          message: 'Descuento en accesorios seleccionados.',
          category: 'Promoción',
          read: false,
        },
        {
          id: 'n3',
          title: 'Perfil actualizado',
          message: 'Los datos de tu cuenta se actualizaron.',
          category: 'Cuenta',
          read: false,
        },
        {
          id: 'n4',
          title: 'Soporte respondió',
          message: 'Respuesta disponible a tu consulta.',
          category: 'Soporte',
          read: true,
        },
      ],
      tickets: [],
      preferences: {
        orders: true,
        offers: true,
        theme: 'system',
      },
      layout: { sidebarCollapsed: false },
      assistant: { open: false, messages: [] },
      version: 1,
    },
    views: {
      inicio: {
        title: 'Mi Dashboard',
        subtitle:
          'Bienvenida a TechEmpresa. Consulta tus pedidos y tu actividad.',
        label: 'Inicio',
      },
      compras: {
        title: 'Dashboard de Mis Compras',
        subtitle: 'Consulta tus compras recientes y su estado.',
        label: 'Mis compras',
      },
      catalogo: {
        title: 'Dashboard de Mi Catálogo',
        subtitle: 'Explora productos, categorías y ofertas disponibles.',
        label: 'Mi catálogo',
      },
      pedidos: {
        title: 'Dashboard de Mis Pedidos',
        subtitle: 'Consulta el estado de tus pedidos y su seguimiento.',
        label: 'Mis pedidos',
      },
      notificaciones: {
        title: 'Dashboard de Notificaciones',
        subtitle: 'Revisa alertas, actualizaciones y novedades de tu cuenta.',
        label: 'Notificaciones',
      },
      perfil: {
        title: 'Dashboard de Mi Perfil',
        subtitle: 'Administra tu información personal y tus preferencias.',
        label: 'Mi perfil',
      },
      ayuda: {
        title: 'Dashboard de Ayuda',
        subtitle: 'Encuentra soporte, preguntas frecuentes y contacto.',
        label: 'Ayuda',
      },
    },
  },
};
