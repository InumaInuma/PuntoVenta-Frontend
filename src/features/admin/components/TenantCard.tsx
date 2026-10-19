import React from 'react';
import { Store, Phone, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import type { TenantListItem, EstadoTenant } from '@/services/auth/authTypes';

interface TenantCardProps {
  tenant: TenantListItem;
  estadosTenant: EstadoTenant[];
  isLoading: boolean;
  onRequestCambiarEstado: (tenant: TenantListItem, nuevoIdEstado: number) => void;
}

export const TenantCard: React.FC<TenantCardProps> = ({
  tenant: t,
  estadosTenant,
  isLoading,
  onRequestCambiarEstado,
}) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-3.5 sm:p-4 transition-all shadow-sm space-y-3">
      {/* Cabecera del Tenant */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 font-black text-base shrink-0 mt-0.5">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-white leading-tight">
                {t.nombreComercial}
              </h3>
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-black border uppercase shrink-0"
                style={{
                  backgroundColor: `${t.estadoColorHex || '#10b981'}20`,
                  color: t.estadoColorHex || '#10b981',
                  borderColor: `${t.estadoColorHex || '#10b981'}40`,
                }}
              >
                {t.estadoNombre || t.estadoCodigo}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-zinc-400 mt-1 truncate">
              RUC: {t.ruc} • {t.razonSocial}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs sm:text-sm font-black text-emerald-400">
            S/ {t.precioMensual}/mes
          </span>
          <span className="text-[10px] text-zinc-400 block font-semibold">
            {t.planNombre}
          </span>
        </div>
      </div>

      {/* Detalles y Métricas de la Tienda */}
      <div className="bg-zinc-950/60 rounded-2xl p-2.5 grid grid-cols-3 gap-1.5 text-center text-xs border border-zinc-800/80">
        <div>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase block truncate">
            Días Restantes
          </span>
          <span
            className={`font-black text-xs sm:text-sm ${
              t.diasRestantes <= 5 ? 'text-rose-400' : 'text-zinc-200'
            }`}
          >
            {t.diasRestantes} días
          </span>
        </div>
        <div>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase block truncate">
            WhatsApp
          </span>
          <a
            href={`https://wa.me/51${t.telefono}`}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-emerald-400 hover:underline inline-flex items-center gap-1 text-xs sm:text-sm"
          >
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">{t.telefono}</span>
          </a>
        </div>
        <div>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase block truncate">
            Ventas Mes
          </span>
          <span className="font-black text-zinc-200 text-xs sm:text-sm truncate block">
            S/ {t.totalVentasMes.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Acciones de Super Admin para este Comercio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-800/80">
        {/* Selector Directo de Estados */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Estado:</span>
          <select
            value={t.idEstadoTenant}
            onChange={(e) => {
              const nuevoVal = Number(e.target.value);
              if (nuevoVal !== t.idEstadoTenant) {
                onRequestCambiarEstado(t, nuevoVal);
              }
            }}
            disabled={isLoading}
            className="bg-transparent text-xs font-black outline-none cursor-pointer"
            style={{ color: t.estadoColorHex || '#10b981' }}
          >
            {estadosTenant.map((est) => (
              <option key={est.id} value={est.id} className="bg-zinc-900 text-white font-semibold">
                {est.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Botón de acción rápida: Pagó o No Pagó */}
        <div className="w-full sm:w-auto">
          {t.idEstadoTenant === 1 ? (
            <button
              onClick={() => onRequestCambiarEstado(t, 2)}
              disabled={isLoading}
              className="w-full sm:w-auto h-9 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Marcar como No Pagó: Suspende el negocio inmediatamente vía SignalR"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ban className="w-3.5 h-3.5" />
              )}
              <span>No Pagó (Suspender)</span>
            </button>
          ) : (
            <button
              onClick={() => onRequestCambiarEstado(t, 1)}
              disabled={isLoading}
              className="w-full sm:w-auto h-9 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Marcar como Pagó: Reactiva el negocio inmediatamente vía SignalR"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Pagó (Activar)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
