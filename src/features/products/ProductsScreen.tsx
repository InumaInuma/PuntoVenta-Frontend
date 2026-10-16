import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productosService } from '@/services/backend/productosService';
import { categoriasService } from '@/services/backend/categoriasService';
import type { Producto, Categoria } from '@/types';
import { Search, Sparkles, Boxes } from 'lucide-react';
import { CategoryCarousel } from '@/features/pos/CategoryCarousel';
import {
  ProductsHeader,
  ProductCard,
  ProductPagination,
  DesktopCartPanel,
} from './components';
import { useCart } from '@/context/CartContext';
import { ROUTES } from '@/config/routes';
import toast from 'react-hot-toast';

export const ProductsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, updateQuantity, items } = useCart();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Estados del Catálogo y Categorías
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Paginación del Servidor
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina] = useState(18);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const loadData = async (
    pag: number = pagina,
    catId: number | null = selectedCategoria,
    query: string = search
  ) => {
    setIsLoading(true);
    try {
      const [paged, cats] = await Promise.all([
        productosService.getPaged(
          catId !== null ? catId : undefined,
          query.trim() ? query.trim() : undefined,
          pag,
          tamanoPagina
        ),
        categorias.length === 0 ? categoriasService.getAll() : Promise.resolve(categorias),
      ]);

      setProductos(paged.items || []);
      setTotalRegistros(paged.totalRegistros || 0);
      setTotalPaginas(paged.totalPaginas || 1);
      setPagina(paged.numeroPagina || pag);

      if (cats && cats.length > 0) {
        setCategorias(cats);
      }
    } catch (err) {
      console.error('Error cargando catálogo:', err);
      toast.error('No se pudo cargar el catálogo de productos');
    } finally {
      setIsLoading(false);
    }
  };

  const isInitialSearch = useRef(true);

  useEffect(() => {
    loadData(1, null, '');
  }, []);

  // Búsqueda en servidor con debounce (solo cuando el usuario escribe)
  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPagina(1);
      loadData(1, selectedCategoria, search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Selección de categoría
  const handleSelectCategoria = (catId: number | null) => {
    setSelectedCategoria(catId);
    setPagina(1);
    loadData(1, catId, search);
  };

  // Agregar al carrito
  const handleAddToCart = (prod: Producto) => {
    addItem(prod, 1);
    toast.success(`+1 ${prod.nombre}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* 1. Catálogo Principal (Izquierda en Desktop / Ancho completo en Móvil) */}
      <div className="flex-1 min-w-0 w-full space-y-3 pb-24 lg:pb-6">
        {/* Cabecera & Acciones Principales */}
        <ProductsHeader
          totalRegistros={totalRegistros}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          mode="sale"
          title="Catálogo"
          subtitle={`${totalRegistros} productos • Toca para vender`}
        />

        {/* Buscador conectado al servidor */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-white rounded-2xl pl-11 pr-4 text-sm border border-slate-200/90 shadow-xs outline-none focus:border-red-500 font-medium"
          />
        </div>

        {/* Carrusel Deslizable de Categorías */}
        <div className="relative">
          <CategoryCarousel
            categorias={categorias}
            totalProductos={totalRegistros}
            selectedCategoria={selectedCategoria}
            onSelectCategoria={handleSelectCategoria}
          />
        </div>

        {/* Listado de Productos */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-bold">Cargando catálogo...</span>
          </div>
        ) : productos.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No se encontraron productos</p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.INVENTARIO)}
              className="mt-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 cursor-pointer hover:bg-emerald-100 flex items-center gap-1.5 mx-auto"
            >
              <Boxes className="w-4 h-4" />
              <span>Gestionar productos en Inventario</span>
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
                {productos.map((prod) => {
                  const inCart = items.find((i) => i.producto.idProducto === prod.idProducto);
                  return (
                    <ProductCard
                      key={prod.idProducto}
                      producto={prod}
                      inCartQuantity={inCart?.cantidad}
                      onAddToCart={handleAddToCart}
                      onDecrement={(p) => updateQuantity(p.idProducto, -1)}
                      viewMode="grid"
                      mode="sale"
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {productos.map((prod) => {
                  const inCart = items.find((i) => i.producto.idProducto === prod.idProducto);
                  return (
                    <ProductCard
                      key={prod.idProducto}
                      producto={prod}
                      inCartQuantity={inCart?.cantidad}
                      onAddToCart={handleAddToCart}
                      onDecrement={(p) => updateQuantity(p.idProducto, -1)}
                      viewMode="list"
                      mode="sale"
                    />
                  );
                })}
              </div>
            )}

            {/* Controles de Paginación */}
            <div className="pt-2">
              <ProductPagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                totalRegistros={totalRegistros}
                isLoading={isLoading}
                onPrevPage={() => {
                  const prev = Math.max(1, pagina - 1);
                  setPagina(prev);
                  loadData(prev, selectedCategoria, search);
                }}
                onNextPage={() => {
                  const next = Math.min(totalPaginas, pagina + 1);
                  setPagina(next);
                  loadData(next, selectedCategoria, search);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* 2. Carrito en Vivo en Columna Fija (Exclusivo para PC y Tablets Grandes >= 1024px) */}
      <div className="hidden lg:block shrink-0">
        <DesktopCartPanel />
      </div>
    </div>
  );
};

export default ProductsScreen;
