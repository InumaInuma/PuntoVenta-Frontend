import React, { useState, useEffect } from 'react';
import { productosService } from '@/services/backend/productosService';
import { categoriasService } from '@/services/backend/categoriasService';
import type { Producto, Categoria } from '@/types';
import { Search, Sparkles, Printer } from 'lucide-react';
import { CategoryCarousel } from '@/features/pos/CategoryCarousel';
import { CategoryManagerModal } from './CategoryManagerModal';
import { BarcodeScannerModal } from '@/features/pos/BarcodeScannerModal';
import { BarcodePrintModal, type BarcodePrintData } from './BarcodePrintModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SuccessModal } from '@/components/ui/SuccessModal';
import {
  ProductsHeader,
  ProductCard,
  ProductPagination,
  ProductFormModal,
  type ProductFormData,
} from './components';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

export const ProductsScreen: React.FC = () => {
  const { addItem, items } = useCart();

  // Estados del Catálogo y Categorías
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Paginación del Servidor
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina] = useState(10);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Modales
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  // Modal Impresión Código de Barras
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printBarcodeData, setPrintBarcodeData] = useState<BarcodePrintData | null>(null);

  // Modales Confirmación y Éxito de Guardado
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ProductFormData | null>(null);
  const [savedProductSummary, setSavedProductSummary] = useState<{
    nombre: string;
    codigoBarras: string;
    categoria: string;
    precioVenta: string;
    stock: string;
    isEditing: boolean;
  } | null>(null);

  // Modal Eliminación
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);

  // Cargar categorías y datos paginados desde el backend
  const refreshCategorias = async () => {
    try {
      const cats = await categoriasService.getAll();
      setCategorias(cats || []);
      return cats || [];
    } catch (err) {
      console.error('Error al recargar categorías:', err);
      return [];
    }
  };

  const loadData = async (
    pag: number = pagina,
    catId: number | null = selectedCategoria,
    query: string = search,
    forceRefreshCategories: boolean = false
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
        forceRefreshCategories || categorias.length === 0
          ? categoriasService.getAll()
          : Promise.resolve(categorias),
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

  useEffect(() => {
    loadData(1, null, '');
  }, []);

  // Búsqueda en servidor con debounce
  useEffect(() => {
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

  // Abrir formulario para crear o editar
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (prod: Producto) => {
    setEditingProduct(prod);
    setIsFormModalOpen(true);
  };

  // Manejador del submit del formulario (dispara modal de confirmación)
  const handleFormSubmit = (data: ProductFormData) => {
    setPendingFormData(data);
    setIsConfirmModalOpen(true);
  };

  // Confirmar y persistir creación / actualización en la base de datos
  const executeSaveProduct = async () => {
    if (!pendingFormData) return;
    setIsSubmitting(true);

    try {
      const catNombre =
        categorias.find((c) => c.idCategoria === pendingFormData.idCategoria)?.nombre || 'General';
      const summary = {
        nombre: pendingFormData.nombre,
        codigoBarras: pendingFormData.codigoBarras || '(Autogenerado)',
        categoria: catNombre,
        precioVenta: `S/ ${pendingFormData.precioVenta.toFixed(2)}`,
        stock: `${pendingFormData.stockActual || '0'} ${pendingFormData.unidadMedida}`,
        isEditing: Boolean(pendingFormData.idProducto),
      };

      if (pendingFormData.idProducto) {
        await productosService.update(pendingFormData.idProducto, {
          idCategoria: pendingFormData.idCategoria,
          codigoBarras: pendingFormData.codigoBarras || undefined,
          nombre: pendingFormData.nombre,
          unidadMedida: pendingFormData.unidadMedida,
          precioVenta: pendingFormData.precioVenta,
          precioCosto: pendingFormData.precioCosto,
          stockActual: pendingFormData.stockActual,
          permiteDecimales: pendingFormData.permiteDecimales,
          activo: true,
        });
      } else {
        await productosService.create({
          idCategoria: pendingFormData.idCategoria,
          codigoBarras: pendingFormData.codigoBarras || undefined,
          nombre: pendingFormData.nombre,
          unidadMedida: pendingFormData.unidadMedida,
          precioVenta: pendingFormData.precioVenta,
          precioCosto: pendingFormData.precioCosto,
          stockActual: pendingFormData.stockActual,
          permiteDecimales: pendingFormData.permiteDecimales,
        });
      }

      setIsConfirmModalOpen(false);
      setIsFormModalOpen(false);
      setSavedProductSummary(summary);
      setIsSuccessModalOpen(true);
      loadData();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { mensaje?: string } }; message?: string };
      const msg = errorObj?.response?.data?.mensaje || errorObj?.message || 'Error al guardar producto';
      toast.error(msg);
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminación de producto
  const executeDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await productosService.delete(productToDelete.idProducto);
      toast.success(`Producto "${productToDelete.nombre}" eliminado`);
      setProductToDelete(null);
      setIsFormModalOpen(false);
      loadData();
    } catch {
      toast.error('No se pudo eliminar el producto');
    }
  };

  // Imprimir código de barras con ticketera
  const handleOpenPrintBarcode = (prod: Producto) => {
    if (prod.codigoBarras) {
      setPrintBarcodeData({
        nombre: prod.nombre,
        codigoBarras: prod.codigoBarras,
        precioVenta: prod.precioVenta,
        categoria: prod.nombreCategoria,
      });
      setIsPrintModalOpen(true);
    } else {
      toast.error('El producto no tiene un código de barras asignado.');
    }
  };

  // Agregar al carrito
  const handleAddToCart = (prod: Producto) => {
    addItem(prod, 1);
    toast.success(`+1 ${prod.nombre}`);
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Cabecera & Acciones Principales */}
      <ProductsHeader
        totalRegistros={totalRegistros}
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        onOpenCreate={handleOpenCreate}
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
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-bold">Cargando catálogo...</span>
        </div>
      ) : productos.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No se encontraron productos</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 cursor-pointer hover:bg-red-100"
          >
            + Registrar primer producto
          </button>
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
                onEdit={handleOpenEdit}
                onAddToCart={handleAddToCart}
              />
            );
          })}

          {/* Controles de Paginación */}
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
      )}

      {/* MODAL: FORMULARIO DE PRODUCTO (CREAR / EDITAR) */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
        categorias={categorias}
        localProducts={productos}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
        scannedBarcode={scannedBarcode}
        onClearScannedBarcode={() => setScannedBarcode(null)}
        onSubmit={handleFormSubmit}
        onPrintBarcode={handleOpenPrintBarcode}
        onDeleteProduct={(prod) => setProductToDelete(prod)}
        isSubmitting={isSubmitting}
      />

      {/* MODAL: GESTIÓN DE CATEGORÍAS */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categorias={categorias}
        onCategoriesChanged={async () => {
          await refreshCategorias();
          loadData(1, selectedCategoria, search, true);
        }}
        onCategorySelected={async (newId) => {
          await refreshCategorias();
          setSelectedCategoria(newId);
          loadData(1, newId, search, true);
        }}
      />

      {/* MODAL: ESCÁNER DE CÓDIGO DE BARRAS POR CÁMARA */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScan={(code) => {
          setScannedBarcode(code);
          setIsBarcodeScannerOpen(false);
          toast.success(`Código escaneado: ${code}`);
        }}
      />

      {/* MODAL: CONFIRMACIÓN DE GUARDADO / ACTUALIZACIÓN */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeSaveProduct}
        title={pendingFormData?.idProducto ? '¿Actualizar Producto?' : '¿Confirmar Registro?'}
        description={
          pendingFormData?.idProducto
            ? 'Los cambios se aplicarán de inmediato en el catálogo de productos.'
            : 'Verifica los datos del producto antes de agregarlo al catálogo.'
        }
        confirmText={pendingFormData?.idProducto ? 'Sí, Actualizar' : 'Sí, Guardar'}
        cancelText="Volver a Revisar"
        variant="primary"
        isLoading={isSubmitting}
        details={
          pendingFormData
            ? [
                { label: 'Producto', value: pendingFormData.nombre },
                {
                  label: 'Categoría',
                  value:
                    categorias.find((c) => c.idCategoria === pendingFormData.idCategoria)?.nombre ||
                    'General',
                },
                {
                  label: 'Código de Barras',
                  value: pendingFormData.codigoBarras || '(Autogenerado)',
                },
                {
                  label: 'Precio de Venta',
                  value: `S/ ${pendingFormData.precioVenta.toFixed(2)}`,
                  highlight: true,
                },
                {
                  label: 'Stock Inicial',
                  value: `${pendingFormData.stockActual || '0'} ${pendingFormData.unidadMedida}`,
                },
              ]
            : undefined
        }
      />

      {/* MODAL: ÉXITO DE OPERACIÓN */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setSavedProductSummary(null);
        }}
        title={
          savedProductSummary?.isEditing
            ? '¡Producto Actualizado!'
            : '¡Producto Registrado con Éxito!'
        }
        message="El producto ha sido guardado exitosamente en la base de datos y ya está disponible para ventas."
        primaryActionText="Ver en Catálogo"
        onPrimaryAction={() => {
          setIsSuccessModalOpen(false);
          setSavedProductSummary(null);
        }}
        secondaryActionText={!savedProductSummary?.isEditing ? '+ Registrar Otro Producto' : undefined}
        onSecondaryAction={() => {
          setIsSuccessModalOpen(false);
          setSavedProductSummary(null);
          handleOpenCreate();
        }}
        extraActionText="Imprimir con Ticketera"
        extraActionIcon={<Printer className="w-4 h-4 text-slate-700" />}
        onExtraAction={() => {
          if (
            savedProductSummary &&
            savedProductSummary.codigoBarras &&
            savedProductSummary.codigoBarras !== '(Autogenerado)'
          ) {
            setPrintBarcodeData({
              nombre: savedProductSummary.nombre,
              codigoBarras: savedProductSummary.codigoBarras,
              precioVenta: savedProductSummary.precioVenta,
              categoria: savedProductSummary.categoria,
            });
            setIsPrintModalOpen(true);
          } else {
            toast.error('Código de barras no disponible para imprimir');
          }
        }}
        details={
          savedProductSummary
            ? [
                { label: 'Producto', value: savedProductSummary.nombre },
                { label: 'Categoría', value: savedProductSummary.categoria },
                { label: 'Código', value: savedProductSummary.codigoBarras },
                { label: 'Precio Venta', value: savedProductSummary.precioVenta, highlight: true },
                { label: 'Stock en Almacén', value: savedProductSummary.stock },
              ]
            : undefined
        }
      />

      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={executeDeleteProduct}
        title="¿Eliminar Producto?"
        description={`¿Estás seguro de que deseas eliminar "${productToDelete?.nombre}" del catálogo? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
        details={
          productToDelete
            ? [
                { label: 'Producto', value: productToDelete.nombre },
                { label: 'Código', value: productToDelete.codigoBarras || '(Sin código)' },
                { label: 'Precio', value: `S/ ${productToDelete.precioVenta.toFixed(2)}` },
              ]
            : undefined
        }
      />

      {/* MODAL: IMPRESIÓN DE CÓDIGO DE BARRAS EN TICKETERA */}
      <BarcodePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={printBarcodeData}
      />
    </div>
  );
};

export default ProductsScreen;
