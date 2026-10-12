import React from 'react';
import type { Producto } from '@/types';
import { Package, Scale, Plus } from 'lucide-react';

interface ProductCardProps {
  producto: Producto;
  inCartQuantity?: number;
  onEdit: (producto: Producto) => void;
  onAddToCart: (producto: Producto) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  inCartQuantity,
  onEdit,
  onAddToCart,
}) => {
  const stockBajo = producto.stockActual <= (producto.stockMinimo || 5);
  const isInCart = Boolean(inCartQuantity && inCartQuantity > 0);

  return (
    <div
      className={`bg-white rounded-2xl p-3.5 border shadow-xs flex items-center justify-between gap-3 transition-all ${
        isInCart
          ? 'border-red-400 ring-2 ring-red-500/10'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Tocar la tarjeta abre edición del producto */}
      <div
        onClick={() => onEdit(producto)}
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
        title="Toca para editar producto"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
          {producto.permiteDecimales ? (
            <Scale className="w-5 h-5 text-indigo-500" />
          ) : (
            <Package className="w-5 h-5 text-slate-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-sm text-slate-800 truncate">
            {producto.nombre}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[120px]">
              {producto.codigoBarras || 'Sin código'}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
              {producto.unidadMedida}
            </span>
          </div>
        </div>
      </div>

      {/* Precios y botón de agregar al carrito */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          onClick={() => onEdit(producto)}
          className="text-right cursor-pointer select-none"
          title="Toca para editar producto"
        >
          <p className="text-base font-black text-slate-900 leading-tight">
            S/ {producto.precioVenta.toFixed(2)}
          </p>
          <span
            className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-0.5 ${
              stockBajo
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            Stock: {producto.stockActual}
          </span>
        </div>

        {/* Botón rápido para agregar al carrito de Venta */}
        <button
          type="button"
          onClick={() => onAddToCart(producto)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 ${
            isInCart
              ? 'bg-red-500 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Agregar a la venta"
        >
          {isInCart ? (
            <span className="font-black text-xs">{inCartQuantity}</span>
          ) : (
            <Plus className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  );
};
