import React from 'react';
import { useCart } from '@/context/CartContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartSheetModal: React.FC<CartSheetModalProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const { items, total, subtotal, impuesto, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resumen de la Venta" position="bottom">
      <div className="flex flex-col max-h-[75dvh]">
        {items.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
            <ShoppingBag className="w-14 h-14 stroke-[1.5] text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">El carrito está vacío</p>
            <p className="text-xs text-slate-400 mt-0.5">Toca o escanea productos del catálogo</p>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="overflow-y-auto no-scrollbar space-y-2.5 max-h-[45dvh] pr-0.5">
              {items.map((it) => (
                <div
                  key={it.producto.idProducto}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {it.producto.nombre}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      S/ {it.precioUnitario.toFixed(2)} x {it.cantidad} {it.producto.unidadMedida}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(it.producto.idProducto, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="w-12 text-center text-xs font-black text-slate-800">
                      {it.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(it.producto.idProducto, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">
                      S/ {it.subtotal.toFixed(2)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(it.producto.idProducto)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-bold inline-flex items-center gap-0.5 mt-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal (Base Imponible)</span>
                <span className="font-semibold text-slate-800">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>I.G.V. (18%)</span>
                <span className="font-semibold text-slate-800">S/ {impuesto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
                <span className="text-sm font-extrabold">TOTAL A PAGAR</span>
                <span className="text-2xl font-black text-red-600">
                  S/ {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={clearCart}
                className="w-1/3"
              >
                VACIAR
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="flex-1"
                icon={<ArrowRight className="w-5 h-5 stroke-[2.5]" />}
              >
                IR A COBRAR
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
