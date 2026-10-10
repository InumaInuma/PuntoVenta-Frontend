import React, { useState, useEffect } from 'react';
import { ventasService } from '@/services/backend/ventasService';
import type { VentaHistorialItem } from '@/types';
import { ReceiptModal } from '@/features/pos/ReceiptModal';
import { Receipt, Sparkles, Calendar, ChevronRight } from 'lucide-react';

export const SalesHistoryScreen: React.FC = () => {
  const [ventas, setVentas] = useState<VentaHistorialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<{
    idVenta: number;
    codigoVenta: string;
    total: number;
    vuelto: number;
    metodoPago: string;
    cliente?: string;
  } | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await ventasService.getHistorial();
      setVentas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="space-y-3 pb-16">
      <div>
        <h2 className="text-xl font-black text-slate-800">Historial de Ventas</h2>
        <p className="text-xs font-semibold text-slate-500">
          Comprobantes y tickets emitidos
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-bold">Cargando ventas...</span>
        </div>
      ) : ventas.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No hay ventas registradas aún</p>
          <p className="text-xs text-slate-400 mt-1">
            Las ventas completadas aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {ventas.map((v) => (
            <div
              key={v.idVenta}
              onClick={() =>
                setSelectedSale({
                  idVenta: v.idVenta,
                  codigoVenta: v.codigoVenta,
                  total: v.total,
                  vuelto: 0,
                  metodoPago: v.metodosPagoResumen || 'EFECTIVO',
                  cliente: v.clienteNombre,
                })
              }
              className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-800 truncate">
                      {v.codigoVenta}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                      {v.tipoComprobante?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {v.clienteNombre || 'Cliente General'}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(v.fechaVenta).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <p className="text-base font-black text-slate-900">
                    S/ {v.total.toFixed(2)}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 block">
                    {v.metodosPagoResumen || 'Efectivo'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para ver ticket térmico y reenviar WhatsApp */}
      <ReceiptModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        saleData={selectedSale}
      />
    </div>
  );
};
