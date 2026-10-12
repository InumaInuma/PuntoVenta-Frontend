import React from 'react';
import type { Cliente } from '@/types';
import { Button } from '@/components/ui/Button';
import { Phone, MessageCircle, Pencil, Trash2, CreditCard } from 'lucide-react';

interface CustomerCardProps {
  cliente: Cliente;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  onOpenAbono: (cliente: Cliente) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  cliente,
  onEdit,
  onDelete,
  onOpenAbono,
}) => {
  const saldo = cliente.saldoDeudor ?? 0;
  const limite = cliente.limiteCredito ?? 0;
  const tieneDeuda = saldo > 0;
  const porcentajeUso = limite > 0 ? Math.min(100, (saldo / limite) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-all">
      {/* Cabecera del Cliente */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
            {cliente.nombreCompleto ? cliente.nombreCompleto[0].toUpperCase() : 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-black text-sm text-slate-900 truncate">
              {cliente.nombreCompleto}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
              {cliente.numeroDocumento && (
                <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-700 font-bold">
                  {cliente.tipoDocumento || 'DNI'}: {cliente.numeroDocumento}
                </span>
              )}
              {cliente.telefono && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {cliente.telefono}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas: WhatsApp, Editar, Eliminar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {cliente.telefono && (
            <a
              href={`https://wa.me/51${cliente.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `¡Hola ${cliente.nombreCompleto}! Le saludamos de su bodega amiga para recordarle su saldo pendiente de fiado: S/ ${saldo.toFixed(2)}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              title="Enviar recordatorio por WhatsApp"
              className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onEdit(cliente)}
            title="Editar datos del casero"
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(cliente)}
            title="Eliminar casero"
            className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Balance de Fiado y Barra de Límite */}
      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">
              Límite Fiado
            </span>
            <span className="font-extrabold text-slate-700 font-mono">
              S/ {limite.toFixed(2)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">
              Saldo Deudor
            </span>
            <span
              className={`text-base font-black font-mono ${
                tieneDeuda ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              S/ {saldo.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Barra de Progreso de Crédito */}
        {limite > 0 && (
          <div className="space-y-1">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  porcentajeUso >= 90
                    ? 'bg-rose-500'
                    : porcentajeUso >= 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${porcentajeUso}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>{porcentajeUso.toFixed(0)}% del crédito usado</span>
              <span>Disponible: S/ {Math.max(0, limite - saldo).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Botón de Abonar si tiene deuda */}
      {tieneDeuda && (
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={() => onOpenAbono(cliente)}
          icon={<CreditCard className="w-4 h-4" />}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
        >
          REGISTRAR ABONO / PAGO
        </Button>
      )}
    </div>
  );
};
