import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Share2, Printer, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    idVenta: number;
    codigoVenta: string;
    total: number;
    vuelto: number;
    metodoPago: string;
    cliente?: string;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  saleData,
}) => {
  const { user } = useAuth();

  if (!saleData) return null;

  const handleShareWhatsApp = () => {
    const texto = `¡Hola! Gracias por tu compra en *${user?.nombreEmpresa || 'Almain POS'}*.\n\n` +
      `🧾 *Comprobante:* ${saleData.codigoVenta}\n` +
      `💰 *Total:* S/ ${saleData.total.toFixed(2)}\n` +
      `💳 *Método de Pago:* ${saleData.metodoPago}\n` +
      (saleData.vuelto > 0 ? `💵 *Vuelto:* S/ ${saleData.vuelto.toFixed(2)}\n` : '') +
      `📅 *Fecha:* ${new Date().toLocaleString()}\n\n` +
      `¡Vuelve pronto!`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Venta Completada" position="center">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Ícono de Éxito */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <h4 className="text-lg font-black text-slate-800">
            ¡Cobro Exitoso!
          </h4>
          <p className="text-xs font-semibold text-slate-500">
            Código: <span className="text-slate-800 font-bold">{saleData.codigoVenta}</span>
          </p>
        </div>

        {/* Simulación de Ticket Térmico */}
        <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 text-left font-mono text-xs space-y-2 text-slate-700">
          <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300">
            <p className="text-sm font-black uppercase">{user?.nombreEmpresa || 'ALMAIN POS'}</p>
            <p className="text-[10px] text-slate-500">{user?.nombreSucursal || 'Sucursal Principal'}</p>
          </div>

          <div className="flex justify-between">
            <span>Método:</span>
            <span className="font-bold">{saleData.metodoPago}</span>
          </div>

          {saleData.cliente && (
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="font-bold truncate max-w-[150px]">{saleData.cliente}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-300">
            <span>TOTAL:</span>
            <span>S/ {saleData.total.toFixed(2)}</span>
          </div>

          {saleData.vuelto > 0 && (
            <div className="flex justify-between font-bold text-emerald-700">
              <span>Vuelto entregado:</span>
              <span>S/ {saleData.vuelto.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="w-full space-y-2">
          {/* Botón WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>ENVIAR TICKET POR WHATSAPP</span>
          </button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
            >
              Imprimir
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={onClose}
              icon={<Check className="w-4 h-4" />}
            >
              Listo
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
