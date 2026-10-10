import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { configuracionService } from '@/services/backend/configuracionService';
import { clientesService } from '@/services/backend/clientesService';
import { ventasService } from '@/services/backend/ventasService';
import type { Cliente, MetodoPago, RegistrarVentaPayload } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { NumericKeypad } from '@/components/ui/NumericKeypad';
import { Banknote, QrCode, CreditCard, UserCheck, ShieldCheck } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: (saleData: {
    idVenta: number;
    codigoVenta: string;
    total: number;
    vuelto: number;
    metodoPago: string;
    cliente?: string;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSaleSuccess,
}) => {
  const { user, turnoActivo } = useAuth();
  const { items, total, subtotal, impuesto, clearCart } = useCart();
  const { playSuccess } = useSound();
  const { triggerSuccess } = useHaptics();

  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'FIADO'>('EFECTIVO');
  const [tipoComprobante, setTipoComprobante] = useState<'NOTA_VENTA' | 'BOLETA' | 'FACTURA'>('NOTA_VENTA');
  const [efectivoRecibido, setEfectivoRecibido] = useState<string>('');
  const [referenciaOperacion, setReferenciaOperacion] = useState<string>('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [metodosPagoDisponibles, setMetodosPagoDisponibles] = useState<MetodoPago[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar métodos de pago y clientes
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [metodos, clientesList] = await Promise.all([
          configuracionService.getMetodosPago(),
          clientesService.getAll(),
        ]);
        setMetodosPagoDisponibles(metodos || []);
        setClientes(clientesList || []);
      } catch (err) {
        console.error('Error cargando catálogos de cobro:', err);
      }
    };

    loadData();
    setEfectivoRecibido(total.toFixed(2));
    setReferenciaOperacion('');
    setClienteSeleccionado(null);
  }, [isOpen, total]);

  const recibidoNum = parseFloat(efectivoRecibido) || 0;
  const vuelto = metodoSeleccionado === 'EFECTIVO' ? Math.max(0, recibidoNum - total) : 0;
  const faltaPagar = metodoSeleccionado === 'EFECTIVO' ? Math.max(0, total - recibidoNum) : 0;

  const handleProcesarVenta = async () => {
    if (!turnoActivo) {
      toast.error('Debes tener una caja/turno abierto para cobrar.');
      return;
    }

    if (items.length === 0) {
      toast.error('El carrito no tiene productos.');
      return;
    }

    if (metodoSeleccionado === 'EFECTIVO' && recibidoNum < total) {
      toast.error(`El monto recibido es menor al total (Faltan S/ ${faltaPagar.toFixed(2)})`);
      return;
    }

    if (metodoSeleccionado === 'FIADO' && !clienteSeleccionado) {
      toast.error('Selecciona un cliente para registrar el fiado.');
      return;
    }

    // Buscar idMetodoPago
    const metodoObj = metodosPagoDisponibles.find(
      (m) => m.codigo.toUpperCase() === metodoSeleccionado
    ) || metodosPagoDisponibles[0];

    const idMetodo = metodoObj ? metodoObj.idMetodoPago : 1;

    setIsSubmitting(true);
    try {
      const payload: RegistrarVentaPayload = {
        idEmpresa: user?.idEmpresa || 1,
        idSucursal: user?.idSucursal || 1,
        idTurnoCaja: turnoActivo.idTurnoCaja,
        idUsuario: user?.idUsuario || 1,
        idCliente: clienteSeleccionado ? clienteSeleccionado.idCliente : null,
        tipoComprobante,
        subtotal,
        impuesto,
        total,
        vuelto: Number(vuelto.toFixed(2)),
        detalles: items.map((it) => ({
          idProducto: it.producto.idProducto,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          subtotal: it.subtotal,
        })),
        pagos: [
          {
            idMetodoPago: idMetodo,
            monto: total,
            referenciaOperacion: referenciaOperacion || undefined,
          },
        ],
      };

      const res = await ventasService.registrar(payload);

      playSuccess();
      triggerSuccess();
      toast.success('¡Venta registrada con éxito!');
      clearCart();
      onClose();

      onSaleSuccess({
        idVenta: res.idVenta,
        codigoVenta: res.codigoVenta || `VNT-${res.idVenta}`,
        total,
        vuelto: Number(vuelto.toFixed(2)),
        metodoPago: metodoSeleccionado,
        cliente: clienteSeleccionado?.nombreCompleto,
      });
    } catch {
      // apiClient interceptor displays error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cobrar Venta" position="bottom">
      <div className="flex flex-col space-y-4">
        {/* Cabecera de Monto Total */}
        <div className="bg-slate-900 text-white rounded-3xl p-4 text-center shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Total a Cobrar
          </span>
          <div className="text-3xl font-black text-amber-400 mt-0.5">
            S/ {total.toFixed(2)}
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {(['NOTA_VENTA', 'BOLETA', 'FACTURA'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoComprobante(tipo)}
                className={`text-[10px] font-black px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                  tipoComprobante === tipo
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tipo.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Métodos de Pago (Píldoras móviles) */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
            { id: 'YAPE', label: 'Yape / Plin', icon: QrCode },
            { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
            { id: 'FIADO', label: 'Fiado', icon: UserCheck },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = metodoSeleccionado === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetodoSeleccionado(m.id as typeof metodoSeleccionado)}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/25'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                <span className="text-[10px] font-bold">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Flujo 1: EFECTIVO (Teclado táctil en pantalla y cálculo de vuelto) */}
        {metodoSeleccionado === 'EFECTIVO' && (
          <div className="space-y-3">
            {/* Resumen de efectivo y vuelto */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Recibido</span>
                <p className="text-lg font-black text-slate-800">
                  S/ {recibidoNum ? recibidoNum.toFixed(2) : '0.00'}
                </p>
              </div>
              <div className={`border rounded-2xl p-2.5 text-center ${
                vuelto > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-bold uppercase">
                  {faltaPagar > 0 ? 'Faltan' : 'Vuelto'}
                </span>
                <p className={`text-lg font-black ${faltaPagar > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  S/ {faltaPagar > 0 ? faltaPagar.toFixed(2) : vuelto.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Teclado táctil en pantalla */}
            <NumericKeypad
              value={efectivoRecibido}
              onChange={setEfectivoRecibido}
              onConfirm={handleProcesarVenta}
              confirmLabel={isSubmitting ? 'PROCESANDO...' : `COBRAR S/ ${total.toFixed(2)}`}
              totalPagar={total}
            />
          </div>
        )}

        {/* Flujo 2: YAPE / PLIN (QR Corporativo de Cobro) */}
        {metodoSeleccionado === 'YAPE' && (
          <div className="bg-gradient-to-b from-purple-50 to-pink-50 border border-purple-200 rounded-3xl p-4 flex flex-col items-center text-center space-y-3">
            <div className="w-44 h-44 bg-white p-2.5 rounded-2xl shadow-md border border-purple-200 flex items-center justify-center">
              {/* QR Simulado o real */}
              <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white p-3">
                <QrCode className="w-16 h-16 text-purple-400 mb-1" />
                <span className="text-[10px] font-black tracking-wider text-purple-300">
                  ESCANEA CON YAPE / PLIN
                </span>
                <span className="text-xs font-black text-amber-300 mt-1">
                  S/ {total.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-xs font-bold text-purple-900">
              Muestra este código al cliente para cobrar de inmediato
            </p>

            <div className="w-full text-left">
              <label className="text-[10px] font-bold text-purple-800 uppercase px-1">
                Número de Operación / Referencia (Opcional)
              </label>
              <input
                type="text"
                placeholder="Últimos 4 dígitos o código de operación"
                value={referenciaOperacion}
                onChange={(e) => setReferenciaOperacion(e.target.value)}
                className="w-full h-11 bg-white border border-purple-300 rounded-2xl px-3 text-xs mt-1 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleProcesarVenta}
              disabled={isSubmitting}
              className="w-full h-13 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              CONFIRMAR PAGO YAPE/PLIN
            </button>
          </div>
        )}

        {/* Flujo 3: TARJETA (POS Físico) */}
        {metodoSeleccionado === 'TARJETA' && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600 text-center">
              Pasa la tarjeta en el terminal inalámbrico por S/ {total.toFixed(2)}
            </p>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase px-1">
                N° de Operación / Lote Terminal
              </label>
              <input
                type="text"
                placeholder="ej: 004821"
                value={referenciaOperacion}
                onChange={(e) => setReferenciaOperacion(e.target.value)}
                className="w-full h-11 bg-white border border-slate-200 rounded-2xl px-3 text-xs mt-1 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleProcesarVenta}
              disabled={isSubmitting}
              className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              CONFIRMAR PAGO CON TARJETA
            </button>
          </div>
        )}

        {/* Flujo 4: FIADO CASERO (Cuenta por Cobrar) */}
        {metodoSeleccionado === 'FIADO' && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-900">
              Registrar deuda a cuenta del cliente casero
            </p>

            <div>
              <label className="text-[10px] font-bold text-amber-800 uppercase px-1">
                Selecciona al Cliente
              </label>
              <select
                className="w-full h-12 bg-white border border-amber-300 rounded-2xl px-3 text-xs mt-1 font-semibold text-slate-800 outline-none"
                value={clienteSeleccionado?.idCliente || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const found = clientes.find((c) => c.idCliente === id) || null;
                  setClienteSeleccionado(found);
                }}
              >
                <option value="">-- Seleccionar Cliente Casero --</option>
                {clientes.map((c) => (
                  <option key={c.idCliente} value={c.idCliente}>
                    {c.nombreCompleto} (Deuda actual: S/ {c.saldoDeudor.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {clienteSeleccionado && (
              <div className="bg-white p-3 rounded-2xl border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Límite de Crédito:</span>
                  <span className="font-bold text-slate-800">
                    S/ {clienteSeleccionado.limiteCredito.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deuda previa:</span>
                  <span className="font-bold text-rose-600">
                    S/ {clienteSeleccionado.saldoDeudor.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 font-extrabold">
                  <span className="text-slate-700">Nueva deuda total:</span>
                  <span className="text-rose-700">
                    S/ {(clienteSeleccionado.saldoDeudor + total).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleProcesarVenta}
              disabled={isSubmitting || !clienteSeleccionado}
              className="w-full h-13 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-5 h-5" />
              REGISTRAR FIADO CASERO
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
