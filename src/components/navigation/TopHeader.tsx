import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Store } from 'lucide-react';

interface TopHeaderProps {
  onOpenDrawer?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenDrawer }) => {
  const { user, turnoActivo } = useAuth();

  const displayName = user?.nombreCompleto || user?.nombre || user?.username || 'AV';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between safe-top">
      {/* Lado Izquierdo: Identidad de la Empresa / Bodega */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-500 flex items-center justify-center shrink-0 shadow-xs">
          <Store className="w-5 h-5 stroke-[2.2]" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">
              {user?.nombreEmpresa || 'Bodega Don Pepe'}
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[170px]">
              {user?.nombreSucursal || 'Sucursal Principal'}
            </span>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Estado del Turno + Avatar */}
      <div className="flex items-center gap-2">
        {/* Píldora de estado de caja */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            turnoActivo
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              turnoActivo ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>{turnoActivo ? 'Abierta' : 'Cerrada'}</span>
        </div>

        {/* Avatar Usuario / Drawer */}
        <div
          className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs select-none cursor-pointer hover:opacity-90 active:scale-95 transition-all"
          title={`${user?.nombre} (${user?.rol})`}
          onClick={onOpenDrawer}
        >
          {initials}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
