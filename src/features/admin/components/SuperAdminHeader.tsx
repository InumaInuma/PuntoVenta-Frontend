import React from 'react';
import { ShieldCheck, LogOut, Radio } from 'lucide-react';
import { InstallPwaButton } from '@/components/common/InstallPwaButton';

interface SuperAdminHeaderProps {
  onLogout: () => void;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({ onLogout }) => {
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between safe-top">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
              Almain SaaS
            </h1>
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              ADMIN
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-400 font-semibold truncate">
            Control de suscripciones y comercios
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <InstallPwaButton variant="header" />

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Radio className="w-3 h-3" />
          <span>SIGNALR EN VIVO</span>
        </div>
        <button
          onClick={onLogout}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-zinc-800 hover:bg-rose-950 text-rose-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
