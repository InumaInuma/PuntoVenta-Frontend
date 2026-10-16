// Centralización de Rutas del Sistema (Estándar People)

export const ROUTES = {
  LOGIN: '/login',
  POS: '/',
  PRODUCTOS: '/productos',
  INVENTARIO: '/inventario',
  CLIENTES: '/clientes',
  CAJA: '/caja',
  HISTORIAL: '/historial',
  COTIZACIONES: '/cotizaciones',
  CONFIGURACION: '/configuracion',
  ADMIN: '/admin',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
