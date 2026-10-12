import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Cliente } from '@/types';
import type { CuentaPorCobrar } from '@/services/backend/clientesService';
import { ventasService } from '@/services/backend/ventasService';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export interface AbonoSubmitData {
  cliente: Cliente;
  idCuenta: number;
  monto: number;
  metodoPago: number;
  esPagoTotalGeneral?: boolean;
}

interface CustomerAbonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  deudasPendientes: CuentaPorCobrar[];
  isLoadingDeudas: boolean;
  onSubmit: (data: AbonoSubmitData) => void;
  isSubmitting?: boolean;
}

export const CustomerAbonoModal: React.FC<CustomerAbonoModalProps> = ({
  isOpen,
  onClose,
  cliente,
  deudasPendientes,
  isLoadingDeudas,
  onSubmit,
  isSubmitting = false,
}) => {
  const [selectedDeudaId, setSelectedDeudaId] = useState<number | null>(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<number>(1); // 1 = Efectivo
  const [esPagoTotalGeneral, setEsPagoTotalGeneral] = useState(false);

  // Detalle de productos por ticket
  const [ticketDetails, setTicketDetails] = useState<Record<number, any[]>>({});
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [loadingTicketId, setLoadingTicketId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !cliente) return;
    setEsPagoTotalGeneral(false);
    setExpandedTicketId(null);

    if (deudasPendientes.length > 0) {
      setSelectedDeudaId(deudasPendientes[0].id);
      setMontoAbono(deudasPendientes[0].saldoPendiente.toFixed(2));
    } else {
      setSelectedDeudaId(null);
      setMontoAbono((cliente.saldoDeudor ?? 0).toFixed(2));
    }
  }, [isOpen, cliente, deudasPendientes]);

  const selectedDeuda = deudasPendientes.find((d) => d.id === selectedDeudaId);

  // Ver productos del ticket fiado
  const handleToggleDetalle = async (idVenta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedTicketId === idVenta) {
      setExpandedTicketId(null);
      return;
    }

    setExpandedTicketId(idVenta);
    if (!ticketDetails[idVenta]) {
      setLoadingTicketId(idVenta);
      try {
        const ticketData = await ventasService.getTicket(idVenta);
        setTicketDetails((prev) => ({
          ...prev,
          [idVenta]: ticketData?.detalle || [],
        }));
      } catch (err) {
        console.error('Error al cargar detalle de venta fiada:', err);
      } finally {
        setLoadingTicketId(null);
      }
    }
  };

  const handleSelectTicket = (deuda: CuentaPorCobrar) => {
    setSelectedDeudaId(deuda.id);
    setEsPagoTotalGeneral(false);
    setMontoAbono(deuda.saldoPendiente.toFixed(2));
  };

  const handleSetPagarTotalGeneral = () => {
    if (!cliente) return;
    setEsPagoTotalGeneral(true);
    setMontoAbono((cliente.saldoDeudor ?? 0).toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    const monto = parseFloat(montoAbono);
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto de abono válido.');
      return;
    }

    if (!esPagoTotalGeneral && selectedDeuda && monto > selectedDeuda.saldoPendiente + 0.01) {
      toast.error(
        `El abono supera el saldo de este ticket (S/ ${selectedDeuda.saldoPendiente.toFixed(2)}). Selecciona "Pagar Deuda Total" si deseas amortizar todos los fiados.`
      );
      return;
    }

    if (!selectedDeudaId && deudasPendientes.length > 0) {
      toast.error('Selecciona la cuenta/ticket a abonar.');
      return;
    }

    const idCuenta = selectedDeudaId || (deudasPendientes[0]?.id ?? 1);

    onSubmit({
      cliente,
      idCuenta,
      monto,
      metodoPago: metodoPagoAbono,
      esPagoTotalGeneral,
    });
  };

  if (!cliente) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cuentas y Fiados: ${cliente.nombreCompleto}`}
      position="bottom"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tarjeta de Saldo Deudor */}
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl p-4 border border-rose-200 text-center">
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">
            Deuda Total Acumulada del Casero
          </span>
          <p className="text-3xl font-black text-rose-600 font-mono mt-1">
            S/ {(cliente.saldoDeudor ?? 0).toFixed(2)}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500 font-medium">
            <span>Límite fiado: <strong className="text-slate-700">S/ {(cliente.limiteCredito ?? 0).toFixed(2)}</strong></span>
            <span>Tickets pendientes: <strong className="text-slate-700">{deudasPendientes.length}</strong></span>
          </div>
        </div>

        {/* Cuentas / Tickets Pendientes con Detalle de Productos */}
        {isLoadingDeudas ? (
          <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
            Cargando tickets y productos sacados fiado...
          </div>
        ) : deudasPendientes.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Tickets Fiados Pendientes ({deudasPendientes.length}):
              </label>
              <button
                type="button"
                onClick={handleSetPagarTotalGeneral}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  esPagoTotalGeneral
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {esPagoTotalGeneral ? '✓ Pagando Toda la Deuda' : 'Pagar Deuda Total'}
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
              {deudasPendientes.map((d) => {
                const isSelected = !esPagoTotalGeneral && selectedDeudaId === d.id;
                const isExpanded = expandedTicketId === d.idVenta;
                const items = ticketDetails[d.idVenta] || [];
                const isLoadingItems = loadingTicketId === d.idVenta;

                return (
                  <div
                    key={d.id}
                    className={`rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div
                      onClick={() => handleSelectTicket(d)}
                      className="p-3 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-800">
                            Ticket {d.numeroComprobante || `#${d.idVenta}`}
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded font-mono">
                            {new Date(d.fechaEmision).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>Total Venta: S/ {d.montoTotal.toFixed(2)}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono font-bold text-rose-600">
                            Debe: S/ {d.saldoPendiente.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Botón para desglosar productos sacados */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleDetalle(d.idVenta, e)}
                          title="Ver productos que sacó fiado"
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3 text-amber-600" />
                          <span>{isExpanded ? 'Ocultar' : 'Ver productos'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Desglose de productos que sacó fiado en este ticket */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-200/60 bg-white/80 rounded-b-2xl">
                        <span className="text-[10px] font-black uppercase text-amber-800 block mb-1">
                          Productos que se llevó en este fiado:
                        </span>
                        {isLoadingItems ? (
                          <div className="text-[11px] text-slate-400 py-1 animate-pulse">
                            Cargando productos del ticket...
                          </div>
                        ) : items.length > 0 ? (
                          <div className="space-y-1">
                            {items.map((prod: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100 last:border-0"
                              >
                                <span className="text-slate-700 truncate pr-2">
                                  <strong className="text-slate-900 font-mono">{prod.cantidad}x</strong> {prod.productoNombre}
                                </span>
                                <span className="font-mono font-bold text-slate-800 shrink-0">
                                  S/ {Number(prod.subtotal).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic py-1">
                            No se encontraron detalles de productos para esta venta.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-800 font-medium">
            ¡Este casero no tiene deudas pendientes! Está al día.
          </div>
        )}

        {/* Monto de Abono */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
              {esPagoTotalGeneral
                ? 'Monto a Pagar (Deuda Total)'
                : `Monto a Abonar (${selectedDeuda?.numeroComprobante || 'Ticket Seleccionado'})`}
            </label>
            {selectedDeuda && !esPagoTotalGeneral && (
              <button
                type="button"
                onClick={() => setMontoAbono(selectedDeuda.saldoPendiente.toFixed(2))}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Pagar Total de este Ticket (S/ {selectedDeuda.saldoPendiente.toFixed(2)})
              </button>
            )}
          </div>
          <input
            type="number"
            step="0.10"
            value={montoAbono}
            onChange={(e) => setMontoAbono(e.target.value)}
            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-center text-slate-900 font-mono outline-none focus:border-emerald-500 focus:bg-white mt-1 shadow-inner"
            required
            autoFocus
          />

          {/* Accesos rápidos de monto */}
          <div className="flex gap-2 mt-2">
            {[5, 10, 20, 50].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setMontoAbono(quick.toFixed(2))}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 font-mono cursor-pointer transition-colors"
              >
                S/ {quick}
              </button>
            ))}
          </div>
        </div>

        {/* Método de Pago del Abono */}
        <div>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wide block mb-1">
            Medio de Pago del Abono
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
            {[
              { id: 1, label: 'Efectivo' },
              { id: 2, label: 'Yape / Plin' },
              { id: 3, label: 'Transferencia' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetodoPagoAbono(m.id)}
                className={`py-2.5 rounded-xl border transition-all cursor-pointer ${
                  metodoPagoAbono === m.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-black'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
        >
          {esPagoTotalGeneral
            ? `PAGAR TOTAL S/ ${Number(montoAbono || 0).toFixed(2)} A CAJA`
            : `REGISTRAR ABONO S/ ${Number(montoAbono || 0).toFixed(2)} A CAJA`}
        </Button>
      </form>
    </Modal>
  );
};

