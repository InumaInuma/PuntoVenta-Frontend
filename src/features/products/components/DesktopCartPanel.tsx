import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CheckoutModal } from '@/features/pos/CheckoutModal';
import { ReceiptModal, type ReceiptSaleData } from '@/features/pos/ReceiptModal';
import { BoxFallbackIcon } from './ProductCard';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DesktopCartPanel: React.FC = () => {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { turnoActivo } = useAuth();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptSaleData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleOpenCheckout = () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    if (!turnoActivo) {
      toast.error('Debes abrir un turno de caja antes de cobrar');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleSaleSuccess = (sale: ReceiptSaleData) => {
    setIsCheckoutOpen(false);
    setReceiptData(sale);
    setIsReceiptOpen(true);
  };

  return (
    <>
      <aside className="w-96 shrink-0 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-[calc(100vh-6rem)] sticky top-20 overflow-hidden">
        {/* 1. Header del Carrito */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-200/60 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 leading-tight">
                Venta en Curso
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'} añadidos
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              title="Vaciar carrito"
              className="px-2.5 py-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar</span>
            </button>
          )}
        </div>

        {/* 2. Alerta si no hay turno abierto */}
        {!turnoActivo && (
          <div className="mx-4 mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-[11px] font-bold text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Caja cerrada. Abre turno para cobrar.</span>
          </div>
        )}

        {/* 3. Lista de Productos en el Carrito */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-slate-600">Carrito vacío</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Haz clic en cualquier producto del catálogo para sumarlo a la venta.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const { producto, cantidad } = item;
              const subtotalItem = producto.precioVenta * cantidad;

              return (
                <div
                  key={producto.idProducto}
                  className="p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3 transition-all"
                >
                  {/* Thumbnail / Imagen */}
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {producto.imagenUrl ? (
                      <img
                        src={producto.imagenUrl}
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BoxFallbackIcon className="w-6 h-6" />
                    )}
                  </div>

                  {/* Nombre y Precio unitario */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {producto.nombre}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      S/ {producto.precioVenta.toFixed(2)}{' '}
                      <span className="text-[10px] text-slate-400 uppercase">
                        /{producto.unidadMedida || 'UND'}
                      </span>
                    </p>
                  </div>

                  {/* Controles de Cantidad */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(producto.idProducto, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>

                    <span className="text-xs font-black text-slate-800 w-5 text-center">
                      {cantidad}
                    </span>

                    <button
                      type="button"
                      onClick={() => updateQuantity(producto.idProducto, 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Subtotal del Item y botón quitar */}
                  <div className="text-right shrink-0 flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-800">
                      S/ {subtotalItem.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(producto.idProducto)}
                      title="Quitar producto"
                      className="text-slate-300 hover:text-red-500 p-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Resumen y Botón de Cobro */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Subtotal estimado</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200/60">
              <span>TOTAL A COBRAR</span>
              <span className="text-lg text-emerald-600">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCheckout}
            disabled={items.length === 0}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              items.length > 0
                ? 'bg-red-500 hover:bg-red-600 active:scale-98 shadow-red-500/30'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <span>COBRAR S/ {total.toFixed(2)}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </aside>

      {/* Modal de Pago / Checkout */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSaleSuccess={handleSaleSuccess}
        />
      )}

      {/* Modal de Ticket / Recibo Térmico */}
      {isReceiptOpen && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          saleData={receiptData}
        />
      )}
    </>
  );
};

export default DesktopCartPanel;
