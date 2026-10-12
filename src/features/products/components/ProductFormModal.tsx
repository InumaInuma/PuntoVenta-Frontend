import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Producto, Categoria } from '@/types';
import { Camera, Barcode, Printer, Trash2 } from 'lucide-react';
import { productosService } from '@/services/backend/productosService';
import toast from 'react-hot-toast';

export interface ProductFormData {
  idProducto?: number;
  nombre: string;
  idCategoria: number;
  codigoBarras: string;
  unidadMedida: string;
  precioVenta: number;
  precioCosto?: number;
  stockActual: number;
  permiteDecimales: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Producto | null;
  categorias: Categoria[];
  localProducts: Producto[];
  onOpenCategoryManager: () => void;
  onOpenBarcodeScanner: () => void;
  scannedBarcode?: string | null;
  onClearScannedBarcode?: () => void;
  onSubmit: (data: ProductFormData) => void;
  onPrintBarcode?: (product: Producto) => void;
  onDeleteProduct?: (product: Producto) => void;
  isSubmitting?: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  categorias,
  localProducts,
  onOpenCategoryManager,
  onOpenBarcodeScanner,
  scannedBarcode,
  onClearScannedBarcode,
  onSubmit,
  onPrintBarcode,
  onDeleteProduct,
  isSubmitting = false,
}) => {
  const [nombre, setNombre] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [idCategoria, setIdCategoria] = useState<number>(1);
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioCosto, setPrecioCosto] = useState('');
  const [stockActual, setStockActual] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('UNIDAD');
  const [permiteDecimales, setPermiteDecimales] = useState(false);
  const [serverDuplicate, setServerDuplicate] = useState<string | null>(null);

  // Sincronizar formulario al abrir o cambiar de producto en edición
  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setNombre(editingProduct.nombre);
      setCodigoBarras(editingProduct.codigoBarras || '');
      setIdCategoria(editingProduct.idCategoria || (categorias[0]?.idCategoria ?? 1));
      setPrecioVenta(editingProduct.precioVenta.toString());
      setPrecioCosto(editingProduct.precioCosto ? editingProduct.precioCosto.toString() : '');
      setStockActual(editingProduct.stockActual.toString());
      setUnidadMedida(editingProduct.unidadMedida || 'UNIDAD');
      setPermiteDecimales(editingProduct.permiteDecimales);
    } else {
      setNombre('');
      setCodigoBarras('');
      setIdCategoria(categorias[0]?.idCategoria ?? 1);
      setPrecioVenta('');
      setPrecioCosto('');
      setStockActual('');
      setUnidadMedida('UNIDAD');
      setPermiteDecimales(false);
    }
    setServerDuplicate(null);
  }, [isOpen, editingProduct, categorias]);

  // Si llega un código escaneado desde el modal de cámara
  useEffect(() => {
    if (scannedBarcode) {
      setCodigoBarras(scannedBarcode);
      onClearScannedBarcode?.();
    }
  }, [scannedBarcode, onClearScannedBarcode]);

  // Validación de código de barras duplicado: local inmediata + backend debounce
  useEffect(() => {
    const trimmed = codigoBarras.trim();
    if (!trimmed) {
      setServerDuplicate(null);
      return;
    }

    // 1. Verificación local rápida
    const localMatch = localProducts.find(
      (p) =>
        p.codigoBarras &&
        p.codigoBarras.trim().toLowerCase() === trimmed.toLowerCase() &&
        p.idProducto !== editingProduct?.idProducto
    );
    if (localMatch) {
      setServerDuplicate(localMatch.nombre);
      return;
    }

    // 2. Verificación debounce contra toda la base de datos
    const timer = setTimeout(async () => {
      try {
        const prod = await productosService.getByCodigo(trimmed);
        if (prod && prod.idProducto !== editingProduct?.idProducto) {
          setServerDuplicate(prod.nombre);
        } else {
          setServerDuplicate(null);
        }
      } catch {
        setServerDuplicate(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [codigoBarras, localProducts, editingProduct]);

  // Autogenerar código EAN-13 único desde el backend
  const handleGenerateBarcode = async () => {
    try {
      const code = await productosService.generarCodigo();
      setCodigoBarras(code);
      setServerDuplicate(null);
      toast.success('Código EAN-13 único generado');
    } catch {
      // Fallback local con cálculo de dígito verificador EAN-13
      const base = '775' + Math.floor(100000000 + Math.random() * 900000000).toString();
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const num = parseInt(base[i], 10);
        sum += i % 2 === 0 ? num : num * 3;
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      setCodigoBarras(`${base}${checkDigit}`);
      toast.success('Código EAN-13 generado');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !precioVenta) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    if (serverDuplicate) {
      toast.error(`El código ya pertenece a "${serverDuplicate}"`);
      return;
    }

    const parsedPrecio = parseFloat(precioVenta);
    if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
      toast.error('Ingresa un precio de venta válido');
      return;
    }

    onSubmit({
      idProducto: editingProduct?.idProducto,
      nombre: nombre.trim(),
      idCategoria,
      codigoBarras: codigoBarras.trim(),
      unidadMedida,
      precioVenta: parsedPrecio,
      precioCosto: precioCosto ? parseFloat(precioCosto) : undefined,
      stockActual: stockActual ? parseFloat(stockActual) : 0,
      permiteDecimales,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Editar Producto' : 'Registrar Producto'}
      position="bottom"
    >
      <form onSubmit={handleFormSubmit} className="space-y-3.5">
        {/* NOMBRE DEL PRODUCTO */}
        <div>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
            NOMBRE DEL PRODUCTO
          </label>
          <input
            type="text"
            placeholder="ej: Arroz Costeño 1kg"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-semibold mt-1 outline-none focus:border-red-500 focus:bg-white transition-all"
            required
            autoFocus
          />
        </div>

        {/* CATEGORÍA Y UNIDAD MEDIDA */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                CATEGORÍA
              </label>
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="text-[11px] font-black text-red-500 hover:text-red-600 cursor-pointer"
                title="Gestionar o crear categorías"
              >
                + Nueva
              </button>
            </div>
            <select
              value={idCategoria}
              onChange={(e) => setIdCategoria(Number(e.target.value))}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs mt-1 outline-none font-bold text-slate-800 focus:border-red-500 focus:bg-white transition-all"
            >
              {categorias.map((c) => (
                <option key={c.idCategoria} value={c.idCategoria}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
              UNIDAD MEDIDA
            </label>
            <select
              value={unidadMedida}
              onChange={(e) => {
                const val = e.target.value;
                setUnidadMedida(val);
                setPermiteDecimales(val === 'KG' || val === 'LITRO' || val === 'METRO');
              }}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs mt-1 outline-none font-bold text-slate-800 focus:border-red-500 focus:bg-white transition-all"
            >
              <option value="UNIDAD">Unidad</option>
              <option value="KG">Kilogramo (kg)</option>
              <option value="LITRO">Litro</option>
              <option value="METRO">Metro</option>
              <option value="PAQUETE">Paquete</option>
            </select>
          </div>
        </div>

        {/* CÓDIGO DE BARRAS */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
              CÓDIGO DE BARRAS
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenBarcodeScanner}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition-colors"
                title="Abrir cámara del celular/laptop para escanear"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Escanear</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                title="Autogenerar código EAN-13 único desde el servidor"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Autogenerar</span>
              </button>
            </div>
          </div>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="7750123456789 o escanear"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              className={`w-full h-12 bg-slate-50 border rounded-xl pl-3.5 pr-11 text-sm font-bold outline-none transition-all ${
                serverDuplicate
                  ? 'border-red-500 bg-red-50/40 text-red-950 focus:border-red-600'
                  : 'border-slate-200 focus:border-red-500 focus:bg-white'
              }`}
            />
            <button
              type="button"
              onClick={onOpenBarcodeScanner}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
              title="Escanear con cámara"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          {serverDuplicate && (
            <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1 animate-fadeIn">
              <span>⚠️ Ya asignado a: <b>{serverDuplicate}</b></span>
            </p>
          )}
        </div>

        {/* PRECIO VENTA Y PRECIO COSTO */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
              PRECIO VENTA (S/)
            </label>
            <input
              type="number"
              step="0.10"
              min="0.10"
              placeholder="0.00"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-base font-black text-slate-900 mt-1 outline-none focus:border-red-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
              PRECIO COSTO (S/)
            </label>
            <input
              type="number"
              step="0.10"
              placeholder="0.00"
              value={precioCosto}
              onChange={(e) => setPrecioCosto(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-base font-black text-slate-700 mt-1 outline-none focus:border-red-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* STOCK INICIAL */}
        <div>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
            STOCK INICIAL
          </label>
          <input
            type="number"
            step={permiteDecimales ? '0.1' : '1'}
            placeholder="0"
            value={stockActual}
            onChange={(e) => setStockActual(e.target.value)}
            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-base font-black text-slate-900 mt-1 outline-none focus:border-red-500 focus:bg-white transition-all"
          />
        </div>

        {/* BOTONES DE ACCIÓN: GUARDAR / EDITAR / ELIMINAR */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-13 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-black text-sm tracking-wider uppercase flex items-center justify-center shadow-lg shadow-red-500/30 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : editingProduct ? (
              'ACTUALIZAR PRODUCTO'
            ) : (
              'GUARDAR PRODUCTO'
            )}
          </button>

          {editingProduct && (
            <div className="flex items-center gap-2">
              {onPrintBarcode && (
                <button
                  type="button"
                  onClick={() => onPrintBarcode(editingProduct)}
                  className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimir Etiqueta</span>
                </button>
              )}

              {onDeleteProduct && (
                <button
                  type="button"
                  onClick={() => onDeleteProduct(editingProduct)}
                  className="flex-1 h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Producto</span>
                </button>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
