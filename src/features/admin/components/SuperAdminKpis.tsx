import React from 'react';

interface SuperAdminKpisProps {
  totalNegocios: number;
  activos: number;
  mrr: number;
  vencidos: number;
}

export const SuperAdminKpis: React.FC<SuperAdminKpisProps> = ({
  totalNegocios,
  activos,
  mrr,
  vencidos,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 sm:p-3.5 text-center flex flex-col justify-between">
        <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block truncate">
          Comercios
        </span>
        <p className="text-xl sm:text-2xl font-black text-white my-0.5">
          {totalNegocios}
        </p>
        <span className="text-[10px] font-bold text-emerald-400 block truncate">
          {activos} activos
        </span>
      </div>

      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 sm:p-3.5 text-center flex flex-col justify-between">
        <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block truncate">
          MRR Mes
        </span>
        <p className="text-xl sm:text-2xl font-black text-emerald-400 my-0.5">
          S/ {mrr}
        </p>
        <span className="text-[10px] font-semibold text-zinc-400 block truncate">
          Facturación
        </span>
      </div>

      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 sm:p-3.5 text-center flex flex-col justify-between">
        <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block truncate">
          En Mora
        </span>
        <p className="text-xl sm:text-2xl font-black text-rose-400 my-0.5">
          {vencidos}
        </p>
        <span className="text-[10px] font-semibold text-rose-400/80 block truncate">
          {vencidos > 0 ? 'Por cobrar' : 'Al día'}
        </span>
      </div>
    </div>
  );
};
