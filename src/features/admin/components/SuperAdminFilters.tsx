import React from 'react';
import { Search } from 'lucide-react';
import type { TenantListItem, EstadoTenant } from '@/services/auth/authTypes';

interface SuperAdminFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterEstadoId: number | null;
  onFilterEstadoChange: (id: number | null) => void;
  tenants: TenantListItem[];
  estadosTenant: EstadoTenant[];
}

export const SuperAdminFilters: React.FC<SuperAdminFiltersProps> = ({
  search,
  onSearchChange,
  filterEstadoId,
  onFilterEstadoChange,
  tenants,
  estadosTenant,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nombre, RUC o teléfono..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Chips de filtro con scroll horizontal fluido en móvil */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        <button
          onClick={() => onFilterEstadoChange(null)}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 ${
            filterEstadoId === null
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          TODOS ({tenants.length})
        </button>
        {estadosTenant.map((est) => {
          const count = tenants.filter((t) => t.idEstadoTenant === est.id).length;
          const isSelected = filterEstadoId === est.id;
          return (
            <button
              key={est.id}
              onClick={() => onFilterEstadoChange(est.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800/90 text-zinc-400 hover:text-white'
              }`}
              style={isSelected ? { borderColor: est.colorHex, borderBottomWidth: 2 } : {}}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: est.colorHex }} />
              <span>{est.nombre}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
