import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ventasService } from '@/services/backend/ventasService';
import { configuracionService } from '@/services/backend/configuracionService';
import { signalRService } from '@/services/signalrService';
import type { VentaHistorialItem } from '@/types';
import { ReceiptModal } from '@/features/pos/ReceiptModal';
import { TurnosHistorialTab } from './TurnosHistorialTab';
import { ReporteCartesianoTab } from './ReporteCartesianoTab';
import {
  Receipt,
  Sparkles,
  Calendar,
  ChevronRight,
  Search,
  DollarSign,
  ShoppingBag,
  Eye,
  ChevronLeft,
  CalendarRange,
  Landmark,
  LineChart,
} from 'lucide-react';

type PresetRange = 'today' | 'week' | 'month' | 'all' | 'custom';
type ActiveMainTab = 'ventas' | 'turnos' | 'cartesiano';

export const SalesHistoryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveMainTab>('ventas');
  const [monedaSimbolo, setMonedaSimbolo] = useState<string>('S/');
  const [ventas, setVentas] = useState<VentaHistorialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar símbolo de moneda configurado
  useEffect(() => {
    configuracionService.getConfiguracion().then((cfg) => {
      if (cfg?.monedaSimbolo) {
        setMonedaSimbolo(cfg.monedaSimbolo);
      }
    }).catch(() => {});
  }, []);

  // Estados de Filtros y Búsqueda
  const [preset, setPreset] = useState<PresetRange>('today');
  const [search, setSearch] = useState('');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Estados de Paginación en Servidor
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina] = useState(15);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [montoTotalPeriodo, setMontoTotalPeriodo] = useState(0);

  // Modal de Ticket Térmico
  const [selectedSale, setSelectedSale] = useState<{
    idVenta: number;
    codigoVenta: string;
    total: number;
    vuelto: number;
    metodoPago: string;
    cliente?: string;
    clienteDocumento?: string;
    tipoComprobante?: string;
  } | null>(null);

  // Helper para calcular fechas ISO locales
  const getDateRange = useCallback(
    (
      mode: PresetRange,
      customS = customStart,
      customE = customEnd
    ): { desde?: string; hasta?: string } => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const toDateString = (d: Date) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      if (mode === 'today') {
        const todayStr = toDateString(now);
        return {
          desde: `${todayStr}T00:00:00`,
          hasta: `${todayStr}T23:59:59`,
        };
      }
      if (mode === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          desde: `${toDateString(weekAgo)}T00:00:00`,
          hasta: `${toDateString(now)}T23:59:59`,
        };
      }
      if (mode === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          desde: `${toDateString(firstDay)}T00:00:00`,
          hasta: `${toDateString(lastDay)}T23:59:59`,
        };
      }
      if (mode === 'custom') {
        return {
          desde: customS ? `${customS}T00:00:00` : undefined,
          hasta: customE ? `${customE}T23:59:59` : undefined,
        };
      }
      // 'all'
      return { desde: undefined, hasta: undefined };
    },
    [customStart, customEnd]
  );

  // Carga paginada desde el Stored Procedure
  const loadHistory = useCallback(
    async (
      page: number = pagina,
      currentPreset: PresetRange = preset,
      query: string = search,
      customS: string = customStart,
      customE: string = customEnd
    ) => {
      setIsLoading(true);
      try {
        const { desde, hasta } = getDateRange(currentPreset, customS, customE);
        const res = await ventasService.getHistorial(
          page,
          tamanoPagina,
          desde,
          hasta,
          query.trim() || undefined
        );

        setVentas(res.items || []);
        setTotalRegistros(res.totalRegistros || 0);
        setTotalPaginas(res.totalPaginas || 1);
        setMontoTotalPeriodo(res.montoTotal || 0);
        setPagina(res.numeroPagina || page);
      } catch (err) {
        console.error('Error cargando historial de ventas:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [pagina, preset, search, customStart, customEnd, tamanoPagina, getDateRange]
  );

  // Carga inicial (Solo corre 1 vez en montaje)
  useEffect(() => {
    loadHistory(1, 'today', '');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda en servidor con debounce (evita llamada redundante en montaje inicial)
  const isInitialSearch = useRef(true);
  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPagina(1);
      loadHistory(1, preset, search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronización en tiempo real via SignalR (Multi-tenant)
  useEffect(() => {
    const unsubVenta = signalRService.onVentaRegistrada((data) => {
      toast.success(
        `Nueva venta registrada: ${data.numeroComprobante} (${monedaSimbolo} ${data.totalVenta.toFixed(2)})`,
        { icon: '💰', duration: 4000 }
      );
      loadHistory();
    });

    const unsubAnulada = signalRService.onVentaAnulada((data) => {
      toast.error(
        `Venta anulada: ${data.motivoAnulacion || 'Sin motivo'}`,
        { icon: '⚠️', duration: 4000 }
      );
      loadHistory();
    });

    return () => {
      unsubVenta();
      unsubAnulada();
    };
  }, [loadHistory, monedaSimbolo]);

  // Cambio de preset
  const handleSelectPreset = (newPreset: PresetRange) => {
    setPreset(newPreset);
    setPagina(1);
    if (newPreset !== 'custom') {
      loadHistory(1, newPreset, search);
    }
  };

  // Aplicar rango personalizado
  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    loadHistory(1, 'custom', search, customStart, customEnd);
  };

  // Formato seguro de fecha/hora
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleOpenSale = (v: VentaHistorialItem) => {
    const totalVal = Number(v.total ?? v.totalVenta ?? 0);
    const vueltoVal = Number(v.vueltoEntregado ?? 0);
    setSelectedSale({
      idVenta: v.idVenta || v.id || 0,
      codigoVenta: v.codigoVenta || v.numeroComprobante || 'VENTA',
      total: totalVal,
      vuelto: vueltoVal,
      metodoPago: v.metodosPagoResumen || v.tipoVentaNombre || 'EFECTIVO',
      cliente: v.clienteNombre || 'Cliente General',
      tipoComprobante: v.comprobanteTipoNombre || v.tipoComprobante || 'NOTA VENTA',
    });
  };

  // Suma de la página actual
  const pageTotal = ventas.reduce(
    (sum, v) => sum + (Number(v.total ?? v.totalVenta ?? 0) || 0),
    0
  );

  // Título dinámico para la métrica según el filtro seleccionado
  const getFilterTitle = () => {
    switch (preset) {
      case 'today':
        return 'Ventas Hoy';
      case 'week':
        return 'Ventas Esta Semana';
      case 'month':
        return 'Ventas Este Mes';
      case 'custom':
        return 'Ventas Período';
      case 'all':
      default:
        return 'Total Histórico';
    }
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-8 max-w-5xl mx-auto w-full">
      {/* 1. Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-red-500" />
            <span>Historial y Reportes de Ventas</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {activeTab === 'ventas' && `${totalRegistros} ${totalRegistros === 1 ? 'comprobante registrado' : 'comprobantes registrados'} en el período`}
            {activeTab === 'turnos' && 'Auditoría de cuadre por turnos de inicio a cierre con desglose de pagos'}
            {activeTab === 'cartesiano' && 'Plano cartesiano con curva de facturación diaria e histograma de volumen'}
          </p>
        </div>

        {activeTab === 'ventas' && (
          <button
            type="button"
            onClick={() => loadHistory(pagina, preset, search)}
            disabled={isLoading}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Consultando...' : 'Actualizar'}</span>
          </button>
        )}
      </div>

      {/* Selector de Pestañas Principales */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ventas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ventas'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <Receipt className="w-4 h-4 text-red-500" />
          <span>Comprobantes y Ventas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('turnos')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'turnos'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <Landmark className="w-4 h-4 text-emerald-600" />
          <span>Cuadre por Turno (Inicio a Cierre)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cartesiano')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cartesiano'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <LineChart className="w-4 h-4 text-amber-500" />
          <span>Reporte Mensual (Plano Cartesiano)</span>
        </button>
      </div>

      {activeTab === 'turnos' && (
        <TurnosHistorialTab monedaSimbolo={monedaSimbolo} />
      )}

      {activeTab === 'cartesiano' && (
        <ReporteCartesianoTab monedaSimbolo={monedaSimbolo} />
      )}

      {activeTab === 'ventas' && (
        <>
      {/* 2. Tarjetas de Métricas de la Página / Filtro */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Total Facturado en el Período / Filtro Seleccionado */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {getFilterTitle()}
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-2xl font-black text-slate-800">
              {monedaSimbolo} {montoTotalPeriodo.toFixed(2)}
            </span>
            {totalPaginas > 1 && (
              <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                Pág. actual: {monedaSimbolo} {pageTotal.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Total de Ventas / Comprobantes en el Período */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Comprobantes
            </span>
            <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-2xl font-black text-slate-800">
              {totalRegistros} {totalRegistros === 1 ? 'venta' : 'ventas'}
            </span>
          </div>
        </div>

        {/* Paginación Activa */}
        <div className="hidden sm:flex bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Páginas
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-2xl font-black text-slate-800">
              {pagina} / {totalPaginas}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Barra de Presets Rápidos de Fecha */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl">
        <button
          type="button"
          onClick={() => handleSelectPreset('today')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            preset === 'today'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => handleSelectPreset('week')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            preset === 'week'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Esta Semana
        </button>
        <button
          type="button"
          onClick={() => handleSelectPreset('month')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            preset === 'month'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Este Mes
        </button>
        <button
          type="button"
          onClick={() => handleSelectPreset('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            preset === 'all'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todo el Historial
        </button>
        <button
          type="button"
          onClick={() => handleSelectPreset('custom')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            preset === 'custom'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          <span>Por Fechas</span>
        </button>
      </div>

      {/* Selector Personalizado de Fechas (Aparece si preset === 'custom') */}
      {preset === 'custom' && (
        <form
          onSubmit={handleApplyCustomDates}
          className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center gap-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-500 shrink-0">Desde:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-red-500 w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-500 shrink-0">Hasta:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-red-500 w-full sm:w-auto"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            Filtrar fechas
          </button>
        </form>
      )}

      {/* 4. Buscador Conectado al SP */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por código de comprobante, cliente o cajero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 bg-white rounded-2xl pl-10 pr-4 text-xs font-semibold border border-slate-200/90 shadow-xs outline-none focus:border-red-500 transition-all"
        />
      </div>

      {/* 5. Listado / Tabla de Ventas Paginada */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-bold">Consultando base de datos...</span>
        </div>
      ) : ventas.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No se encontraron ventas</p>
          <p className="text-xs text-slate-400 mt-1">
            {search || preset !== 'all'
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Las ventas realizadas aparecerán listadas aquí.'}
          </p>
        </div>
      ) : (
        <>
          {/* VISTA MÓVIL (Tarjetas compactas < lg) */}
          <div className="space-y-2.5 lg:hidden">
            {ventas.map((v) => {
              const totalVal = Number(v.total ?? v.totalVenta ?? 0);
              const comprobante = v.comprobanteTipoNombre || v.tipoComprobante || 'NOTA VENTA';
              const codigo = v.codigoVenta || v.numeroComprobante || `V-${v.idVenta || v.id}`;

              return (
                <div
                  key={v.idVenta || v.id}
                  onClick={() => handleOpenSale(v)}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Receipt className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-800 truncate">
                          {codigo}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {comprobante.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                        {v.clienteNombre || 'Cliente General'}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(v.fechaVenta)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p className="text-base font-black text-slate-900">
                        {monedaSimbolo} {totalVal.toFixed(2)}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        {v.metodosPagoResumen || v.tipoVentaNombre || 'Efectivo'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISTA ESCRITORIO (Tabla elegante >= lg) */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Cajero</th>
                  <th className="py-3 px-4">Tipo / Pago</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {ventas.map((v) => {
                  const totalVal = Number(v.total ?? v.totalVenta ?? 0);
                  const comprobante = v.comprobanteTipoNombre || v.tipoComprobante || 'NOTA VENTA';
                  const codigo = v.codigoVenta || v.numeroComprobante || `V-${v.idVenta || v.id}`;

                  return (
                    <tr
                      key={v.idVenta || v.id}
                      onClick={() => handleOpenSale(v)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-black text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{codigo}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {comprobante.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {formatDate(v.fechaVenta)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {v.clienteNombre || 'Cliente General'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {v.cajeroNombre || 'Cajero'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-200/60">
                          {v.metodosPagoResumen || v.tipoVentaNombre || 'EFECTIVO'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        {monedaSimbolo} {totalVal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSale(v);
                          }}
                          className="p-1.5 text-slate-400 group-hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Ver e imprimir ticket"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 6. Barra de Paginación en Servidor */}
          {totalPaginas > 1 && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
              <span className="text-xs font-bold text-slate-500">
                Página {pagina} de {totalPaginas} ({totalRegistros} ventas)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const prev = Math.max(1, pagina - 1);
                    setPagina(prev);
                    loadHistory(prev, preset, search);
                  }}
                  disabled={pagina <= 1 || isLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(totalPaginas, pagina + 1);
                    setPagina(next);
                    loadHistory(next, preset, search);
                  }}
                  disabled={pagina >= totalPaginas || isLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </>
      )}

      {/* Modal para ver ticket térmico y reenviar WhatsApp */}
      <ReceiptModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        saleData={selectedSale}
      />
    </div>
  );
};

export default SalesHistoryScreen;
