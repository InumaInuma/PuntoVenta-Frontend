import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cotizacionesService, type CotizacionHistorialItem } from '@/services/backend/cotizacionesService';
import { signalRService } from '@/services/signalrService';
import { useCart } from '@/context/CartContext';
import { ReceiptModal } from '@/features/pos/ReceiptModal';
import { ROUTES } from '@/config/routes';
import {
  FileText,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ShoppingCart,
  RefreshCw,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const QuotesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();

  const [cotizaciones, setCotizaciones] = useState<CotizacionHistorialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtros
  const [selectedEstado, setSelectedEstado] = useState<number | undefined>(undefined); // undefined: Todos, 1: Pendiente, 2: Convertida, 3: Vencida
  const [searchTerm, setSearchTerm] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [montoTotal, setMontoTotal] = useState(0);

  // Modal de Ticket
  const [selectedReceipt, setSelectedReceipt] = useState<{
    idVenta: number;
    codigoVenta: string;
    total: number;
    vuelto: number;
    metodoPago: string;
    cliente?: string;
    clienteDocumento?: string;
    tipoComprobante?: string;
    items?: any[];
    subtotal?: number;
    descuento?: number;
    validezDias?: number;
  } | null>(null);

  const fetchCotizaciones = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await cotizacionesService.listar(
        pagina,
        15,
        selectedEstado,
        undefined,
        undefined,
        searchTerm
      );
      setCotizaciones(res.items);
      setTotalRegistros(res.totalRegistros);
      setTotalPaginas(res.totalPaginas);
      setMontoTotal(res.montoTotal || 0);
    } catch (err: any) {
      console.error('Error al listar cotizaciones:', err);
      toast.error('No se pudo cargar el listado de cotizaciones.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [pagina, selectedEstado, searchTerm]);

  useEffect(() => {
    fetchCotizaciones();
  }, [fetchCotizaciones]);

  // Sincronización en tiempo real via SignalR (Multi-tenant)
  useEffect(() => {
    const unsubCreada = signalRService.onCotizacionCreada((data) => {
      toast.success(
        `Nueva cotización emitida: ${data.codigoCotizacion} (${data.clienteNombre || 'Sin cliente'})`,
        { icon: '📄', duration: 4000 }
      );
      fetchCotizaciones();
    });

    const unsubConvertida = signalRService.onCotizacionConvertida(() => {
      toast.success('Una cotización fue convertida a venta en caja.', { icon: '🛒', duration: 4000 });
      fetchCotizaciones();
    });

    return () => {
      unsubCreada();
      unsubConvertida();
    };
  }, [fetchCotizaciones]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCotizaciones();
  };

  // Cargar productos de la cotización al carrito y redirigir al POS
  const handleCargarAlCarrito = async (cot: CotizacionHistorialItem) => {
    try {
      toast.loading('Cargando productos de la cotización...', { id: 'load-quote' });
      const fullQuote = await cotizacionesService.obtenerPorId(cot.id);

      if (!fullQuote.detalle || fullQuote.detalle.length === 0) {
        toast.error('La cotización no contiene productos.', { id: 'load-quote' });
        return;
      }

      // Limpiar carrito previo y cargar nuevos productos
      clearCart();

      fullQuote.detalle.forEach((det) => {
        addItem(
          {
            idProducto: det.idProducto,
            idEmpresa: 1,
            idCategoria: 1,
            nombre: det.productoNombre,
            codigoBarras: det.codigoBarras,
            unidadMedida: 'UNIDAD',
            precioVenta: det.precioUnitario,
            stockActual: det.stockActual,
            permiteDecimales: true,
            activo: true,
          },
          det.cantidad
        );
      });

      toast.success(
        `¡${fullQuote.detalle.length} producto(s) cargados al carrito desde ${cot.codigoCotizacion}!`,
        { id: 'load-quote' }
      );

      // Redirigir a POS
      navigate(ROUTES.POS);
    } catch (err: any) {
      console.error('Error al cargar cotización al carrito:', err);
      toast.error('Error al obtener el detalle de la cotización.', { id: 'load-quote' });
    }
  };

  // Abrir Ticket
  const handleVerTicket = async (cot: CotizacionHistorialItem) => {
    try {
      const fullQuote = await cotizacionesService.obtenerPorId(cot.id);
      setSelectedReceipt({
        idVenta: cot.id,
        codigoVenta: cot.codigoCotizacion,
        total: cot.totalCotizacion,
        vuelto: 0,
        metodoPago: 'COTIZACIÓN',
        cliente: cot.clienteNombre || 'Cliente General',
        clienteDocumento: cot.clienteDocumento || undefined,
        tipoComprobante: 'COTIZACION',
        subtotal: cot.subtotal,
        descuento: cot.descuento,
        validezDias: cot.validezDias,
        items: fullQuote.detalle.map((d) => ({
          cantidad: d.cantidad,
          productoNombre: d.productoNombre,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal,
        })),
      });
    } catch {
      setSelectedReceipt({
        idVenta: cot.id,
        codigoVenta: cot.codigoCotizacion,
        total: cot.totalCotizacion,
        vuelto: 0,
        metodoPago: 'COTIZACIÓN',
        cliente: cot.clienteNombre || 'Cliente General',
        clienteDocumento: cot.clienteDocumento || undefined,
        tipoComprobante: 'COTIZACION',
        subtotal: cot.subtotal,
        descuento: cot.descuento,
        validezDias: cot.validezDias,
        items: [],
      });
    }
  };

  const getEstadoBadge = (idEstado: number, nombre: string) => {
    switch (idEstado) {
      case 1: // PENDIENTE
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            {nombre || 'PENDIENTE'}
          </span>
        );
      case 2: // CONVERTIDA
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {nombre || 'CONVERTIDA A VENTA'}
          </span>
        );
      case 3: // VENCIDA
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            {nombre || 'VENCIDA'}
          </span>
        );
      case 4: // ANULADA
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-300">
            {nombre || 'ANULADA'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-8">
      {/* 1. Header con métricas */}
      <div className="bg-white rounded-3xl p-4 lg:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">
                Cotizaciones y Proformas
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Emite, consulta y convierte presupuestos en ventas al instante
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Presupuestado
            </span>
            <span className="text-base font-black text-blue-600">
              S/ {montoTotal.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl cursor-pointer transition-all active:scale-95"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs space-y-3">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código (COT01...), cliente o DNI..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagina(1);
            }}
            className="w-full h-10 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 text-xs font-bold text-slate-800 outline-none"
          />
        </div>

        {/* Chips de filtro por Estado Normalizado */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: undefined, label: 'Todas las Cotizaciones' },
            { id: 1, label: 'Pendientes', color: 'text-amber-700' },
            { id: 2, label: 'Convertidas a Venta', color: 'text-emerald-700' },
            { id: 3, label: 'Vencidas', color: 'text-rose-700' },
          ].map((item) => {
            const isSelected = selectedEstado === item.id;
            return (
              <button
                key={String(item.id)}
                type="button"
                onClick={() => {
                  setSelectedEstado(item.id);
                  setPagina(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Listado de Cotizaciones */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-500">Cargando cotizaciones...</span>
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-1">
              No hay cotizaciones registradas
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Puedes emitir una cotización desde el botón "Cobrar" en la pestaña "Cotización".
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.POS)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-600/20 cursor-pointer transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Ir al Punto de Venta</span>
            </button>
          </div>
        ) : (
          cotizaciones.map((cot) => (
            <div
              key={cot.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
            >
              {/* Info principal */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                    {cot.codigoCotizacion}
                  </span>
                  {getEstadoBadge(cot.idEstadoCotizacion, cot.estadoNombre)}
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(cot.fechaEmision).toLocaleDateString()} {new Date(cot.fechaEmision).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {cot.clienteNombre || 'Público General'}
                  </span>
                  {cot.clienteDocumento && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({cot.clienteDocumento})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Vence: {new Date(cot.fechaVencimiento).toLocaleDateString()} ({cot.validezDias}d)</span>
                  </span>
                  <span>•</span>
                  <span>Atendido por: <b className="text-slate-700">{cot.cajeroNombre}</b></span>
                </div>
              </div>

              {/* Total y Acciones */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Total
                  </span>
                  <span className="text-base font-black text-slate-900">
                    S/ {cot.totalCotizacion.toFixed(2)}
                  </span>
                  {cot.descuento > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      Dscto: -S/ {cot.descuento.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Ver ticket térmico */}
                  <button
                    type="button"
                    onClick={() => handleVerTicket(cot)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-all active:scale-95"
                    title="Ver Ticket / WhatsApp"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Cargar al carrito (Cobrar) */}
                  {cot.idEstadoCotizacion === 1 && (
                    <button
                      type="button"
                      onClick={() => handleCargarAlCarrito(cot)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Cargar a Venta</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200 shadow-xs text-xs font-bold text-slate-600">
          <span>
            Página {pagina} de {totalPaginas} ({totalRegistros} cotizaciones)
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl cursor-pointer"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de Ticket Térmico / WhatsApp */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
          saleData={selectedReceipt}
        />
      )}
    </div>
  );
};

export default QuotesScreen;
