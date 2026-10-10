import React, { useState, useEffect, useMemo } from 'react';
import { productosService } from '@/services/backend/productosService';
import { categoriasService } from '@/services/backend/categoriasService';
import type { Producto, Categoria } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Package, Sparkles, Scale } from 'lucide-react';
import { CategoryCarousel } from '@/features/pos/CategoryCarousel';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

export const ProductsScreen: React.FC = () => {
  const { addItem, items } = useCart();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Nuevo / Editar Producto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [idCategoria, setIdCategoria] = useState<number>(1);
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioCosto, setPrecioCosto] = useState('');
  const [stockActual, setStockActual] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('UNIDAD');
  const [permiteDecimales, setPermiteDecimales] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productosService.getAll(),
        categoriasService.getAll(),
      ]);
      setProductos(prods || []);
      setCategorias(cats || []);
      if (cats?.[0]) setIdCategoria(cats[0].idCategoria);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !precioVenta) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      await productosService.create({
        idEmpresa: 1,
        idCategoria,
        codigoBarras: codigoBarras.trim() || undefined,
        nombre: nombre.trim(),
        unidadMedida,
        precioVenta: parseFloat(precioVenta),
        precioCosto: precioCosto ? parseFloat(precioCosto) : undefined,
        stockActual: stockActual ? parseFloat(stockActual) : 0,
        permiteDecimales,
      });

      toast.success('Producto guardado correctamente');
      setIsModalOpen(false);
      // Limpiar formulario
      setNombre('');
      setCodigoBarras('');
      setPrecioVenta('');
      setStockActual('');
      loadData();
    } catch {
      // Interceptor handles error
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      const matchCat = selectedCategoria === null || p.idCategoria === selectedCategoria;
      const matchSearch =
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.codigoBarras?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productos, search, selectedCategoria]);

  return (
    <div className="space-y-3 pb-24">
      {/* Cabecera & Botón Nuevo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Catálogo & Stock</h2>
          <p className="text-xs font-semibold text-slate-500">
            {productos.length} productos registrados
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4 stroke-[3]" />}
        >
          NUEVO
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nombre o código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 bg-white rounded-2xl pl-11 pr-4 text-sm border border-slate-200/90 shadow-xs outline-none focus:border-red-500"
        />
      </div>

      {/* Carrusel Deslizable de Categorías */}
      <CategoryCarousel
        categorias={categorias}
        totalProductos={productos.length}
        selectedCategoria={selectedCategoria}
        onSelectCategoria={setSelectedCategoria}
      />

      {/* Lista de Productos en Tarjetas Móviles */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-bold">Cargando inventario...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No se encontraron productos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((prod) => {
            const stockBajo = prod.stockActual <= (prod.stockMinimo || 5);
            const inCart = items.find((i) => i.producto.idProducto === prod.idProducto);

            return (
              <div
                key={prod.idProducto}
                className={`bg-white rounded-2xl p-3.5 border shadow-xs flex items-center justify-between gap-3 transition-all ${
                  inCart ? 'border-red-400 ring-2 ring-red-500/10' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    {prod.permiteDecimales ? (
                      <Scale className="w-5 h-5 text-indigo-500" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">
                      {prod.nombre}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {prod.codigoBarras || 'Sin código'}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                        {prod.unidadMedida}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900">
                      S/ {prod.precioVenta.toFixed(2)}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-0.5 ${
                        stockBajo
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Stock: {prod.stockActual}
                    </span>
                  </div>

                  {/* Botón rápido para agregar al carrito de Venta */}
                  <button
                    type="button"
                    onClick={() => {
                      addItem(prod, 1);
                      toast.success(`+1 ${prod.nombre}`);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 ${
                      inCart
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Agregar a la venta"
                  >
                    {inCart ? (
                      <span className="font-black text-xs">{inCart.cantidad}</span>
                    ) : (
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Producto */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Producto">
        <form onSubmit={handleSaveProduct} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Nombre del Producto</label>
            <input
              type="text"
              placeholder="ej: Arroz Costeño 1kg"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Categoría</label>
              <select
                value={idCategoria}
                onChange={(e) => setIdCategoria(Number(e.target.value))}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-2 text-xs mt-1 outline-none font-semibold"
              >
                {categorias.map((c) => (
                  <option key={c.idCategoria} value={c.idCategoria}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Unidad Medida</label>
              <select
                value={unidadMedida}
                onChange={(e) => {
                  const val = e.target.value;
                  setUnidadMedida(val);
                  setPermiteDecimales(val === 'KG' || val === 'LITRO' || val === 'METRO');
                }}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-2 text-xs mt-1 outline-none font-semibold"
              >
                <option value="UNIDAD">Unidad</option>
                <option value="KG">Kilogramo (kg)</option>
                <option value="LITRO">Litro</option>
                <option value="METRO">Metro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Código de Barras</label>
            <input
              type="text"
              placeholder="7750123456789"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Precio Venta (S/)</label>
              <input
                type="number"
                step="0.10"
                placeholder="0.00"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold mt-1 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Precio Costo (S/)</label>
              <input
                type="number"
                step="0.10"
                placeholder="0.00"
                value={precioCosto}
                onChange={(e) => setPrecioCosto(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold mt-1 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Stock Inicial</label>
            <input
              type="number"
              step={permiteDecimales ? '0.1' : '1'}
              placeholder="0"
              value={stockActual}
              onChange={(e) => setStockActual(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold mt-1 outline-none"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              GUARDAR PRODUCTO
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
