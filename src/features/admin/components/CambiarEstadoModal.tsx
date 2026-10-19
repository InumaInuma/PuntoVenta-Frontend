import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Store, AlertTriangle, CheckCircle2, ArrowRight, Loader2, Radio } from 'lucide-react';
import type { TenantListItem, EstadoTenant } from '@/services/auth/authTypes';

interface CambiarEstadoModalProps {
  isOpen: boolean;
  tenant: TenantListItem | null;
  nuevoEstado: EstadoTenant | null;
  isLoading: boolean;
  isSuccess: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const CambiarEstadoModal: React.FC<CambiarEstadoModalProps> = ({
  isOpen,
  tenant,
  nuevoEstado,
  isLoading,
  isSuccess,
  onConfirm,
  onClose,
}) => {
  if (!tenant || !nuevoEstado) return null;

  const esSuspension = nuevoEstado.id === 2; // Suspendido por Falta de Pago
  const esActivacion = nuevoEstado.id === 1; // Activo

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={isSuccess ? 'Estado Actualizado' : 'Confirmar Cambio de Estado'}
      position="center"
      maxWidth="max-w-md"
    >
      <div className="p-1 space-y-4 text-slate-800">
        {!isSuccess ? (
          <>
            {/* 1. Tarjeta del Comercio */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-slate-900 truncate">
                  {tenant.nombreComercial}
                </h4>
                <p className="text-xs text-slate-500 font-medium truncate">
                  RUC: {tenant.ruc} • {tenant.planNombre}
                </p>
              </div>
            </div>

            {/* 2. Transición de Estados */}
            <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-inner">
              <div className="text-center flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Estado Actual
                </span>
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black border"
                  style={{
                    backgroundColor: `${tenant.estadoColorHex || '#64748b'}25`,
                    color: tenant.estadoColorHex || '#94a3b8',
                    borderColor: `${tenant.estadoColorHex || '#64748b'}50`,
                  }}
                >
                  {tenant.estadoNombre}
                </span>
              </div>

              <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-slate-300">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="text-center flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Nuevo Estado
                </span>
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black border"
                  style={{
                    backgroundColor: `${nuevoEstado.colorHex || '#10b981'}25`,
                    color: nuevoEstado.colorHex || '#10b981',
                    borderColor: `${nuevoEstado.colorHex || '#10b981'}50`,
                  }}
                >
                  {nuevoEstado.nombre}
                </span>
              </div>
            </div>

            {/* 3. Alerta de Impacto en Vivo (SignalR) */}
            {esSuspension && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Acceso inmediato bloqueado (SignalR)</p>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    El Punto de Venta (POS) de este comercio será bloqueado en tiempo real. Los cajeros no podrán realizar ventas hasta que el negocio sea reactivado.
                  </p>
                </div>
              </div>
            )}

            {esActivacion && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Reactivación inmediata del servicio</p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    El comercio recuperará acceso total a su inventario, ventas y sistema POS en todos sus dispositivos conectados.
                  </p>
                </div>
              </div>
            )}

            {!esSuspension && !esActivacion && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-indigo-950">
                <Radio className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  El nuevo estado se guardará en la base de datos y se propagará mediante SignalR en tiempo real a los administradores y al comercio.
                </p>
              </div>
            )}

            {/* 4. Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`h-10 px-5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  esSuspension
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <span>Confirmar Cambio</span>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Paso de Éxito */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                ¡Estado Actualizado con Éxito!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                El estado de <strong>{tenant.nombreComercial}</strong> fue modificado a{' '}
                <span
                  className="font-black px-2 py-0.5 rounded-md inline-block mt-1"
                  style={{
                    backgroundColor: `${nuevoEstado.colorHex || '#10b981'}25`,
                    color: nuevoEstado.colorHex || '#10b981',
                  }}
                >
                  {nuevoEstado.nombre}
                </span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 flex items-center justify-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Sincronizado vía SignalR en tiempo real con el comercio</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Aceptar y Cerrar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
