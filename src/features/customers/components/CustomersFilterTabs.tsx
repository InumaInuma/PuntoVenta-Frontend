import React from 'react';
import { Search } from 'lucide-react';

export type FilterTabOption = 'todos' | 'deuda' | 'aldia';

interface CustomersFilterTabsProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterTab: FilterTabOption;
  onFilterChange: (tab: FilterTabOption) => void;
  totalClientes: number;
  totalConDeuda: number;
}

export const CustomersFilterTabs: React.FC<CustomersFilterTabsProps> = ({
  search,
  onSearchChange,
  filterTab,
  onFilterChange,
  totalClientes,
  totalConDeuda,
}) => {
  return (
    <div className="space-y-2">
      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar casero por nombre, DNI o WhatsApp..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-12 bg-white rounded-2xl pl-11 pr-4 text-sm font-semibold border border-slate-200/90 shadow-xs outline-none focus:border-red-500 transition-colors"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Pestañas de Filtro */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl text-xs font-bold gap-1">
        <button
          type="button"
          onClick={() => onFilterChange('todos')}
          className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterTab === 'todos'
              ? 'bg-white text-slate-900 shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos ({totalClientes})
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('deuda')}
          className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
            filterTab === 'deuda'
              ? 'bg-white text-rose-600 shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Con Deuda</span>
          {totalConDeuda > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {totalConDeuda}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('aldia')}
          className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterTab === 'aldia'
              ? 'bg-white text-emerald-600 shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Al Día ({totalClientes - totalConDeuda})
        </button>
      </div>
    </div>
  );
};
