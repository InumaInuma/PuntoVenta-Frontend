import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/config/routes';
import {
  ShoppingBag,
  Package,
  Users,
  Landmark,
  History,
  FileText,
  Settings,
  LogOut,
  X,
  Search,
  Store,
  ChevronRight,
  ShieldCheck,
  Boxes,
} from 'lucide-react';
import { InstallPwaButton } from '@/components/common/InstallPwaButton';

interface DarkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DarkDrawer: React.FC<DarkDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const isSuperAdmin = (user?.rol || '').toUpperCase() === 'SUPERADMIN';

  const menuItems = [
    ...(isSuperAdmin
      ? [
          {
            group: 'PLATAFORMA SAAS',
            items: [
              { path: ROUTES.ADMIN, label: 'Panel Super Admin', icon: ShieldCheck },
            ],
          },
        ]
      : []),
    {
      group: 'OPERACIONES DEL NEGOCIO',
      items: [
        { path: ROUTES.POS, label: 'Punto de Venta (POS)', icon: ShoppingBag },
        { path: ROUTES.PRODUCTOS, label: 'Catálogo de Ventas', icon: Package },
        { path: ROUTES.INVENTARIO, label: 'Inventario (Crear / Editar)', icon: Boxes },
        { path: ROUTES.CLIENTES, label: 'Clientes y Fiados', icon: Users },
        { path: ROUTES.CAJA, label: 'Cajas y Turnos', icon: Landmark },
        { path: ROUTES.HISTORIAL, label: 'Historial de Ventas', icon: History },
        { path: ROUTES.COTIZACIONES, label: 'Cotizaciones / Proformas', icon: FileText },
      ],
    },
    {
      group: 'CONFIGURACIÓN',
      items: [
        { path: ROUTES.CONFIGURACION, label: 'Ajustes y Ticketera', icon: Settings },
      ],
    },
  ];

  const filteredMenuItems = menuItems.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container (Zinc-900 Dark Mode - Posicionado a la Derecha) */}
      <aside className="relative z-10 w-[82vw] max-w-xs h-full bg-zinc-900 border-l border-zinc-800 text-zinc-100 flex flex-col shadow-2xl safe-top safe-bottom">
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center font-black shadow-md shadow-red-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base tracking-tight leading-none">
                Almain POS
              </h2>
              <span className="text-[11px] text-zinc-400 font-medium">
                {user?.nombreEmpresa || 'Comercio Retail'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-zinc-800/90 text-sm text-zinc-200 placeholder-zinc-500 rounded-xl pl-9 pr-3 outline-none border border-zinc-700/60 focus:border-red-500"
            />
          </div>
        </div>

        {/* User Card */}
        <div className="mx-4 my-2 p-3 rounded-2xl bg-zinc-800/60 border border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
            {(user?.nombreCompleto || user?.username)?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-200 truncate">
              {user?.nombreCompleto || user?.username || 'Usuario'}
            </p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-700 text-zinc-300">
              {user?.rol || 'CAJERO'}
            </span>
          </div>
        </div>

        {/* Navigation Modules */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-4">
          {filteredMenuItems.map((group) => (
            <div key={group.group}>
              <span className="px-3 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">
                {group.group}
              </span>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full h-11 px-3 rounded-xl flex items-center justify-between text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                          : 'text-zinc-300 hover:bg-zinc-800/70 active:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-60`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer: Install PWA + Logout */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          <InstallPwaButton variant="sidebar" />

          <button
            onClick={handleLogout}
            className="w-full h-11 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-zinc-700/60 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>CERRAR SESIÓN</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
