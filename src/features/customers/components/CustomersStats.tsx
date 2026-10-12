import React from 'react';
import { Users, CreditCard, DollarSign } from 'lucide-react';

interface CustomersStatsProps {
  totalClientes: number;
  totalConDeuda: number;
  totalDeudaAcumulada: number;
}

export const CustomersStats: React.FC<CustomersStatsProps> = ({
  totalClientes,
  totalConDeuda,
  totalDeudaAcumulada,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs text-center">
        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-1">
          <Users className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
          Caseros
        </span>
        <span className="text-base font-black text-slate-800 font-mono">
          {totalClientes}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs text-center">
        <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1">
          <CreditCard className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
          Con Deuda
        </span>
        <span className="text-base font-black text-amber-600 font-mono">
          {totalConDeuda}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-3 border border-red-100 bg-red-50/20 shadow-xs text-center">
        <div className="w-7 h-7 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-1">
          <DollarSign className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
          Por Cobrar
        </span>
        <span className="text-sm font-black text-red-600 font-mono truncate block">
          S/ {totalDeudaAcumulada.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
