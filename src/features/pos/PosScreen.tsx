import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { productosService } from '@/services/backend/productosService';
import { categoriasService } from '@/services/backend/categoriasService';
import type { Categoria, Producto } from '@/types';
import { InlineBarcodeScanner } from './InlineBarcodeScanner';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { Modal } from '@/components/ui/Modal';
import {
  ShoppingBag,
  Zap,
  Plus,
  Minus,
  Trash2,
  Barcode,
  AlertCircle,
  ArrowRight,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PosScreen: React.FC = () => {
  const { turnoActivo } = useAuth();
  const { items, addItem, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [, setCategorias] = useState<Categoria[]>([]);

  // Modales
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isVentaLibreOpen, setIsVentaLibreOpen] = useState(false);
  const [isManualCodeOpen, setIsManualCodeOpen] = useState(false);

  const [ventaLibreConcepto, setVentaLibreConcepto] = useState('');
  const [ventaLibreMonto, setVentaLibreMonto] = useState('');
  const [manualCodeInput, setManualCodeInput] = useState('');

  const [receiptData, setReceiptData] = useState<{
    idVenta: number;
    codigoVenta: string;
    total: number;
    vuelto: number;
    metodoPago: string;
    cliente?: string;
  } | null>(null);

  const [lastScannedFeedback, setLastScannedFeedback] = useState<string | null>(null);

  // Cargar catálogo de productos para búsqueda rápida local
  const loadCatalog = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productosService.getAll(),
        categoriasService.getAll(),
      ]);
      setProductos(prods || []);
      setCategorias(cats || []);
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Manejo de código de barras escaneado por cámara, pistola física o manual
  const handleBarcodeScanned = useCallback(
    async (code: string) => {
      if (!code || !code.trim()) return;
      const cleanCode = code.trim();

      try {
        // 1. Buscar en memoria local primero
        const localFound = productos.find(
          (p) => p.codigoBarras === cleanCode || p.codigoInterno === cleanCode
        );
        if (localFound) {
          addItem(localFound, 1);
          const msg = `+1 ${localFound.nombre} (S/ ${localFound.precioVenta.toFixed(2)})`;
          setLastScannedFeedback(msg);
          toast.success(msg, { id: 'scan-feedback', duration: 2000 });
          return;
        }

        // 2. Si no está en memoria local, consultar backend
        const prod = await productosService.getByCodigo(cleanCode);
        if (prod && prod.idProducto) {
          addItem(prod, 1);
          const msg = `+1 ${prod.nombre} (S/ ${prod.precioVenta.toFixed(2)})`;
          setLastScannedFeedback(msg);
          toast.success(msg, { id: 'scan-feedback', duration: 2000 });
        } else {
          const notFoundMsg = `Código: ${cleanCode} (No encontrado)`;
          setLastScannedFeedback(notFoundMsg);
          toast.error(notFoundMsg, { id: 'scan-feedback', duration: 3500 });
        }
      } catch {
        const notFoundMsg = `Código: ${cleanCode} (No encontrado)`;
        setLastScannedFeedback(notFoundMsg);
        toast.error(notFoundMsg, { id: 'scan-feedback', duration: 3500 });
      }
    },
    [productos, addItem]
  );

  // Soporte global para lector de pistola física USB / Bluetooth
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 160) {
        keyBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (keyBuffer.trim().length >= 3) {
          e.preventDefault();
          handleBarcodeScanned(keyBuffer.trim());
          keyBuffer = '';
        }
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleBarcodeScanned]);

  // Agregar ítem de Venta Libre
  const handleAddVentaLibre = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(ventaLibreMonto);
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    const itemLibre: Producto = {
      idProducto: -Date.now(),
      idEmpresa: 1,
      idCategoria: 1,
      nombre: ventaLibreConcepto.trim() || 'Venta Libre',
      precioVenta: monto,
      stockActual: 9999,
      unidadMedida: 'UND',
      permiteDecimales: false,
      activo: true,
    };

    addItem(itemLibre, 1);
    toast.success(`+1 ${itemLibre.nombre} (S/ ${monto.toFixed(2)})`);
    setVentaLibreConcepto('');
    setVentaLibreMonto('');
    setIsVentaLibreOpen(false);
  };

  // Enviar código manual (para laptops o pruebas sin cámara)
  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleBarcodeScanned(manualCodeInput.trim());
    setManualCodeInput('');
    setIsManualCodeOpen(false);
  };

  return (
    <div className="flex flex-col space-y-3 pb-24">
      {/* Alerta si el turno de caja no está abierto */}
      {!turnoActivo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2.5 text-amber-800 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Caja no aperturada:</span> Abre turno en Caja para cobrar.
          </div>
        </div>
      )}

      {/* 1. LECTOR DE CÓDIGO DE BARRAS EN VIVO (Cámara en tiempo real) */}
      <InlineBarcodeScanner
        onScan={handleBarcodeScanned}
        lastScannedMessage={lastScannedFeedback}
      />

      {/* 2. ENCABEZADO "Carrito actual" Y BOTONES DE ACCIÓN */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-slate-800 tracking-tight">
            Carrito actual
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-xs font-bold">
            {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botón rápido para digitar código manual (Ideal para desarrollo / laptop) */}
          <button
            type="button"
            onClick={() => setIsManualCodeOpen(true)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            title="Digitar código manual o probar"
          >
            <Barcode className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Botón "Venta Libre" (Estilo píldora verde idéntico a la imagen) */}
          <button
            type="button"
            onClick={() => setIsVentaLibreOpen(true)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 border border-emerald-300/80 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span>Venta Libre</span>
          </button>
        </div>
      </div>

      {/* 3. LISTADO DE PRODUCTOS ESCANEADOS O ESTADO VACÍO */}
      {items.length === 0 ? (
        /* Estado Vacío (100% fiel a la foto de referencia) */
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 flex flex-col items-center justify-center text-center shadow-xs my-1">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
            <ShoppingBag className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-base mb-1">
            Lista vacía
          </h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4 font-medium">
            Los productos escaneados con la cámara aparecerán en esta lista.
          </p>

          <button
            type="button"
            onClick={() => setIsVentaLibreOpen(true)}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>⚡ Venta Libre</span>
          </button>
        </div>
      ) : (
        /* Lista interactiva de Productos Escaneados en el Carrito */
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Productos a cobrar
            </span>
            <button
              type="button"
              onClick={clearCart}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
            >
              Vaciar lista
            </button>
          </div>

          <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-0.5">
            {items.map((item) => (
              <div
                key={item.producto.idProducto}
                className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-150"
              >
                {/* Información del producto */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-800 text-sm truncate">
                    {item.producto.nombre}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-slate-500">
                      S/ {item.precioUnitario.toFixed(2)} c/u
                    </span>
                    {item.producto.codigoBarras && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md truncate max-w-[100px]">
                        {item.producto.codigoBarras}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stepper de cantidad + Subtotal */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.producto.idProducto, -1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 active:scale-95 text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                      title="Disminuir"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-slate-800">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.producto.idProducto, 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 active:scale-95 text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                      title="Aumentar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[55px]">
                    <span className="text-sm font-black text-slate-900 block">
                      S/ {item.subtotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.producto.idProducto)}
                    className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. BOTÓN "REVISAR ORDEN / COBRAR" (Como en la foto) */}
      <div className="pt-2">
        {items.length === 0 ? (
          <div className="w-full h-14 rounded-2xl bg-slate-200/90 text-slate-400 font-extrabold text-sm flex items-center justify-center gap-2 select-none shadow-xs">
            <ShoppingBag className="w-5 h-5 stroke-[2]" />
            <span>Revisar Orden</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full h-14 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-extrabold text-base flex items-center justify-between px-5 shadow-lg shadow-red-500/30 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              <span>Revisar Orden ({itemCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight">
                S/ {total.toFixed(2)}
              </span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </button>
        )}
      </div>

      {/* MODAL: Venta Libre (Concepto y Precio Manual) */}
      <Modal
        isOpen={isVentaLibreOpen}
        onClose={() => setIsVentaLibreOpen(false)}
        title="⚡ Venta Libre (Sin código)"
        position="bottom"
      >
        <form onSubmit={handleAddVentaLibre} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">
              Descripción o Producto
            </label>
            <input
              type="text"
              placeholder="Ej: Pan, Fruta, Recarga, Varios"
              value={ventaLibreConcepto}
              onChange={(e) => setVentaLibreConcepto(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none focus:border-emerald-500 font-semibold"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">
              Monto a Cobrar (S/)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-base">
                S/
              </span>
              <input
                type="number"
                step="0.10"
                min="0.10"
                placeholder="0.00"
                value={ventaLibreMonto}
                onChange={(e) => setVentaLibreMonto(e.target.value)}
                className="w-full h-13 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 text-xl font-black text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsVentaLibreOpen(false)}
              className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/30 cursor-pointer transition-all active:scale-95"
            >
              Agregar a la Venta
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Digitar Código Manual (Para laptop o códigos de demo) */}
      <Modal
        isOpen={isManualCodeOpen}
        onClose={() => setIsManualCodeOpen(false)}
        title="🔍 Digitar Código de Barras"
        position="bottom"
      >
        <form onSubmit={handleManualCodeSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">
              Código de Barras o Interno
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="Ej: 7750123456789"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 text-base font-bold text-slate-800 outline-none focus:border-red-500"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-black cursor-pointer"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Sugerencias rápidas de productos cargados */}
          {productos.length > 0 && (
            <div className="pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                Probar con productos registrados:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {productos.slice(0, 8).map((p) => (
                  <button
                    key={p.idProducto}
                    type="button"
                    onClick={() => {
                      addItem(p, 1);
                      toast.success(`+1 ${p.nombre}`);
                      setIsManualCodeOpen(false);
                    }}
                    className="text-left text-xs bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 px-2.5 py-1.5 rounded-xl font-semibold text-slate-700 truncate max-w-full cursor-pointer"
                  >
                    + {p.nombre} (S/ {p.precioVenta.toFixed(2)})
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* MODAL: Cobro y Pago Final */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSaleSuccess={(data) => {
          setReceiptData(data);
          loadCatalog();
        }}
      />

      {/* MODAL: Ticket Digital / WhatsApp */}
      {receiptData && (
        <ReceiptModal
          isOpen={!!receiptData}
          onClose={() => setReceiptData(null)}
          saleData={receiptData}
        />
      )}
    </div>
  );
};

export default PosScreen;
