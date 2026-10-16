import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ROUTES } from '@/config/routes';
import {
  ScanLine,
  Package,
  Boxes,
  Users,
  Landmark,
  History,
  FileText,
  Settings,
  LogOut,
  Store,
  ShieldCheck,
} from 'lucide-react';

export const DesktopSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, turnoActivo, logout } = useAuth();
  const { itemCount } = useCart();

  const isSuperAdmin = (user?.rol || '').toUpperCase() === 'SUPERADMIN';

  const navLinks = [
    { path: ROUTES.POS, label: 'Punto de Venta', icon: ScanLine, badge: null },
    {
      path: ROUTES.PRODUCTOS,
      label: 'Catálogo de Ventas',
      icon: Package,
      badge: itemCount > 0 ? `${itemCount}` : null,
    },
    { path: ROUTES.INVENTARIO, label: 'Inventario y Productos', icon: Boxes, badge: null },
    { path: ROUTES.CLIENTES, label: 'Clientes y Fiados', icon: Users, badge: null },
    { path: ROUTES.CAJA, label: 'Cajas y Turnos', icon: Landmark, badge: null },
    { path: ROUTES.HISTORIAL, label: 'Historial de Ventas', icon: History, badge: null },
    { path: ROUTES.COTIZACIONES, label: 'Cotizaciones', icon: FileText, badge: null },
    { path: ROUTES.CONFIGURACION, label: 'Ajustes y Ticketera', icon: Settings, badge: null },
    ...(isSuperAdmin
      ? [{ path: ROUTES.ADMIN, label: 'Super Administrador', icon: ShieldCheck, badge: 'SaaS' }]
      : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const displayName = user?.nombreCompleto || user?.nombre || user?.username || 'Usuario';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 text-zinc-100 shrink-0 h-screen sticky top-0 z-40 select-none">
      {/* 1. Header del Comercio */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center font-black shadow-lg shadow-red-500/25 shrink-0">
            <Store className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-extrabold text-white truncate tracking-tight">
              {user?.nombreEmpresa || 'Bodega Don Pepe'}
            </h1>
            <p className="text-[11px] font-semibold text-zinc-400 truncate">
              {user?.nombreSucursal || 'Sucursal Principal'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Estado de Caja / Turno */}
      <div className="px-4 py-3 border-b border-zinc-800/60 bg-zinc-950/40">
        <div
          onClick={() => navigate(ROUTES.CAJA)}
          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all hover:brightness-110 active:scale-98 ${
            turnoActivo
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50'
              : 'bg-amber-950/30 text-amber-400 border-amber-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                turnoActivo ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{turnoActivo ? 'Caja Abierta' : 'Caja Cerrada'}</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">Ver caja →</span>
        </div>
      </div>

      {/* 3. Navegación Principal */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
          Módulos del Sistema
        </div>
        {navLinks.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70 active:scale-98'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${active ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    active
                      ? 'bg-white text-red-600'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Footer: Perfil del Cajero / Admin + Salir */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-zinc-400 truncate uppercase font-semibold">
              {user?.rol || 'Cajero'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer active:scale-95"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
