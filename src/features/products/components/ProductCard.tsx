import React, { useState } from 'react';
import type { Producto } from '@/types';
import { Plus, Minus, Pencil, Trash2, Barcode } from 'lucide-react';

export const BoxFallbackIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Tapa con bordes redondeados y relieve */}
    <rect
      x="4"
      y="5"
      width="20"
      height="5.5"
      rx="1.5"
      fill="#3D987A"
      stroke="#276953"
      strokeWidth="1.5"
    />
    {/* Cuerpo de la caja / contenedor */}
    <path
      d="M5.5 10.5V20.5C5.5 21.6 6.4 22.5 7.5 22.5H20.5C21.6 22.5 22.5 21.6 22.5 20.5V10.5"
      fill="#4FA98C"
      stroke="#276953"
      strokeWidth="1.5"
    />
    {/* Ranura / Asa central */}
    <rect
      x="10.5"
      y="14.5"
      width="7"
      height="2"
      rx="1"
      fill="#FFFFFF"
      opacity="0.95"
    />
  </svg>
);

interface ProductCardProps {
  producto: Producto;
  inCartQuantity?: number;
  onEdit?: (producto: Producto) => void;
  onAddToCart?: (producto: Producto) => void;
  onDecrement?: (producto: Producto) => void;
  onDelete?: (producto: Producto) => void;
  onPrintBarcode?: (producto: Producto) => void;
  viewMode?: 'grid' | 'list';
  mode?: 'sale' | 'manage';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  inCartQuantity = 0,
  onEdit,
  onAddToCart,
  onDecrement,
  onDelete,
  onPrintBarcode,
  viewMode = 'grid',
  mode = 'sale',
}) => {
  const [imgError, setImgError] = useState(false);
  const stockBajo = producto.stockActual <= (producto.stockMinimo || 5);
  const isInCart = inCartQuantity > 0;
  const unitLabel =
    producto.unidadMedida === 'UNIDAD' || producto.unidadMedida === 'UND'
      ? 'uds'
      : producto.unidadMedida.toLowerCase();

  const handleCardClick = () => {
    if (mode === 'manage') {
      onEdit?.(producto);
    } else {
      onAddToCart?.(producto);
    }
  };

  // =========================================================================
  // MODO CUADRÍCULA (GRID) - 3 Columnas móvil
  // =========================================================================
  if (viewMode === 'grid') {
    return (
      <div
        className={`bg-white rounded-2xl p-2 sm:p-2.5 border shadow-2xs flex flex-col justify-between transition-all select-none group relative overflow-hidden ${
          isInCart && mode === 'sale'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
        }`}
      >
        {/* Parte Superior: Foto o Ícono con Badge de Stock */}
        <div
          onClick={handleCardClick}
          className="cursor-pointer active:scale-[0.98] transition-transform"
          title={mode === 'manage' ? 'Toca para editar producto' : 'Toca para agregar al carrito'}
        >
          <div className="relative w-full aspect-square rounded-xl bg-[#f2f4f6] flex items-center justify-center overflow-hidden mb-1.5 border border-slate-100/80">
            {/* Badge de Stock en esquina superior izquierda */}
            <span
              className={`absolute top-1 left-1 z-10 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-xs ${
                producto.stockActual <= 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-700/75 backdrop-blur-xs text-white'
              }`}
            >
              {producto.stockActual <= 0 ? '0 uds' : `${producto.stockActual} ${unitLabel}`}
            </span>

            {/* Imagen o Ícono de caja verde idéntico a la referencia */}
            {producto.imagenUrl && !imgError ? (
              <img
                src={producto.imagenUrl}
                alt={producto.nombre}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center">
                <BoxFallbackIcon className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-xs" />
              </div>
            )}
          </div>

          {/* Nombre del Producto */}
          <h4 className="font-bold text-[11px] sm:text-xs text-slate-800 line-clamp-2 leading-tight min-h-[2rem]">
            {producto.nombre}
          </h4>
        </div>

        {/* ========================================================= */}
        {/* PARTE INFERIOR: SEGÚN MODO (VENTA O GESTIÓN INVENTARIO) */}
        {/* ========================================================= */}
        {mode === 'sale' ? (
          /* MODO CATÁLOGO DE VENTA */
          <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-slate-100">
            <span className="font-black text-xs sm:text-[13px] text-slate-900 leading-none truncate">
              S/{producto.precioVenta.toFixed(2)}
            </span>

            {isInCart ? (
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecrement?.(producto);
                  }}
                  className="w-5.5 h-6 sm:w-6 sm:h-6.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                  title="Disminuir"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="text-[11px] font-black text-slate-800 px-1 py-0.5 bg-white rounded-md min-w-[18px] text-center border border-slate-200 shadow-2xs">
                  {inCartQuantity}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart?.(producto);
                  }}
                  className="w-5.5 h-6 sm:w-6 sm:h-6.5 rounded-md bg-[#3D987A] hover:bg-[#328469] text-white flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                  title="Aumentar"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(producto);
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#3D987A] hover:bg-[#328469] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90 shrink-0"
                title="Agregar al carrito"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              </button>
            )}
          </div>
        ) : (
          /* MODO INVENTARIO (GESTIÓN: EDITAR / ELIMINAR / CÓDIGO) */
          <div className="mt-1.5 pt-1.5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-900 mb-1">
              <span>S/{producto.precioVenta.toFixed(2)}</span>
              {producto.precioCosto && producto.precioCosto > 0 && (
                <span className="text-[10px] text-slate-400 font-semibold">
                  Costo: S/{producto.precioCosto.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-1">
              {producto.codigoBarras && onPrintBarcode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrintBarcode(producto);
                  }}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Imprimir código de barras"
                >
                  <Barcode className="w-3.5 h-3.5" />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(producto);
                  }}
                  className="p-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors cursor-pointer"
                  title="Editar producto"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(producto);
                  }}
                  className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // MODO LISTA (Horizontal)
  // =========================================================================
  return (
    <div
      className={`bg-white rounded-2xl p-3 border shadow-xs flex items-center justify-between gap-3 transition-all select-none ${
        isInCart && mode === 'sale'
          ? 'border-emerald-500 ring-2 ring-emerald-500/15'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div
        onClick={handleCardClick}
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer active:scale-[0.99] transition-transform"
        title={mode === 'manage' ? 'Toca para editar producto' : 'Toca para agregar al carrito'}
      >
        <div className="w-12 h-12 rounded-xl bg-[#f2f4f6] flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/70">
          {producto.imagenUrl && !imgError ? (
            <img
              src={producto.imagenUrl}
              alt={producto.nombre}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain p-1"
              loading="lazy"
            />
          ) : (
            <BoxFallbackIcon className="w-7 h-7" />
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

      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right">
          <p className="text-sm font-black text-slate-900 leading-tight">
            S/ {producto.precioVenta.toFixed(2)}
          </p>
          <span
            className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-0.5 ${
              stockBajo
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {producto.stockActual} {unitLabel}
          </span>
        </div>

        {mode === 'sale' ? (
          /* ACCIONES VENTA */
          isInCart ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDecrement?.(producto)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="text-xs font-black text-slate-800 px-1.5 py-0.5 bg-white rounded-md min-w-[20px] text-center border border-slate-200">
                {inCartQuantity}
              </span>
              <button
                type="button"
                onClick={() => onAddToCart?.(producto)}
                className="w-7 h-7 rounded-lg bg-[#3D987A] hover:bg-[#328469] text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart?.(producto)}
              className="w-8 h-8 rounded-xl bg-[#3D987A] hover:bg-[#328469] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title="Agregar al carrito"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          )
        ) : (
          /* ACCIONES GESTIÓN */
          <div className="flex items-center gap-1">
            {producto.codigoBarras && onPrintBarcode && (
              <button
                type="button"
                onClick={() => onPrintBarcode(producto)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Imprimir código"
              >
                <Barcode className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(producto)}
                className="w-8 h-8 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Editar producto"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(producto)}
                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Eliminar producto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
