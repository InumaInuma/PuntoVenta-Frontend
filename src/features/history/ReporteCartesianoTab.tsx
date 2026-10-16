import React, { useState, useEffect, useMemo } from 'react';
import {
  ventasService,
  type ReporteVentasMensual,
  type DiaVentaCartesiano,
} from '@/services/backend/ventasService';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Award,
  Layers,
  BarChart2,
  Table,
} from 'lucide-react';

interface ReporteCartesianoTabProps {
  monedaSimbolo?: string;
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const ReporteCartesianoTab: React.FC<ReporteCartesianoTabProps> = ({
  monedaSimbolo = 'S/',
}) => {
  const currentDate = new Date();
  const [selectedAnio, setSelectedAnio] = useState<number>(currentDate.getFullYear());
  const [selectedMes, setSelectedMes] = useState<number>(currentDate.getMonth() + 1);

  const [reporte, setReporte] = useState<ReporteVentasMensual | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hoveredDia, setHoveredDia] = useState<DiaVentaCartesiano | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [mostrarTabla, setMostrarTabla] = useState<boolean>(false);

  const cargarReporte = async (anio = selectedAnio, mes = selectedMes) => {
    setIsLoading(true);
    setHoveredDia(null);
    try {
      const data = await ventasService.getReporteMensual({ anio, mes });
      setReporte(data);
    } catch (err) {
      console.error('Error al cargar reporte mensual cartesiano:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarReporte(selectedAnio, selectedMes);
  }, [selectedAnio, selectedMes]);

  const handleMesAnterior = () => {
    if (selectedMes === 1) {
      setSelectedMes(12);
      setSelectedAnio((prev) => prev - 1);
    } else {
      setSelectedMes((prev) => prev - 1);
    }
  };

  const handleMesSiguiente = () => {
    if (selectedMes === 12) {
      setSelectedMes(1);
      setSelectedAnio((prev) => prev + 1);
    } else {
      setSelectedMes((prev) => prev + 1);
    }
  };

  // Cálculos para el plano cartesiano SVG
  const serie = reporte?.serieDiaria || [];
  const resumen = reporte?.resumen;

  const chartMetrics = useMemo(() => {
    if (!serie.length) return null;

    const maxVenta = Math.max(...serie.map((d) => Number(d.totalVendido) || 0), 10);
    const maxCantidad = Math.max(...serie.map((d) => d.cantidadVentas || 0), 5);

    // Dimensiones SVG
    const width = 900;
    const height = 420;
    const paddingLeft = 55;
    const paddingRight = 45;
    const paddingTop = 30;

    // Alturas de las dos zonas cartesianas:
    // Zona Superior (65%): Curva continua de Facturación en Soles
    // Zona Inferior (35%): Histograma de Volumen de Transacciones (como en la foto 2)
    const upperChartHeight = 220;
    const lowerChartHeight = 110;
    const middleGap = 35;
    const lowerChartTop = paddingTop + upperChartHeight + middleGap;

    const plotWidth = width - paddingLeft - paddingRight;

    // Escala del Eje X: mapear día 1..totalDias a coordenadas x
    const totalDias = serie.length;
    const getX = (diaIndex: number) => {
      if (totalDias <= 1) return paddingLeft + plotWidth / 2;
      return paddingLeft + (diaIndex / (totalDias - 1)) * plotWidth;
    };

    // Escala del Eje Y Superior (Montos)
    const roundedMaxY = Math.ceil(maxVenta * 1.15);
    const getYUpper = (val: number) => {
      const clamped = Math.max(0, Math.min(val, roundedMaxY));
      return paddingTop + upperChartHeight - (clamped / roundedMaxY) * upperChartHeight;
    };

    // Escala del Eje Y Inferior (Histograma de Cantidad de Ventas)
    const getYLower = (cant: number) => {
      const clamped = Math.max(0, Math.min(cant, maxCantidad));
      return lowerChartTop + lowerChartHeight - (clamped / maxCantidad) * lowerChartHeight;
    };

    // Puntos para la curva de ventas
    const pointsUpper = serie.map((item, idx) => ({
      x: getX(idx),
      y: getYUpper(Number(item.totalVendido) || 0),
      data: item,
    }));

    // Generar path SVG suave (curva spline)
    let pathD = '';
    if (pointsUpper.length > 0) {
      pathD = `M ${pointsUpper[0].x} ${pointsUpper[0].y}`;
      for (let i = 0; i < pointsUpper.length - 1; i++) {
        const p0 = pointsUpper[i];
        const p1 = pointsUpper[i + 1];
        const midX = (p0.x + p1.x) / 2;
        pathD += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
      }
    }

    // Área bajo la curva para gradiente sutil
    const areaD =
      pathD +
      ` L ${pointsUpper[pointsUpper.length - 1]?.x || 0} ${paddingTop + upperChartHeight}` +
      ` L ${pointsUpper[0]?.x || 0} ${paddingTop + upperChartHeight} Z`;

    // Líneas de cuadrícula horizontal para el plano cartesiano superior
    const gridUpper = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
      const val = roundedMaxY * pct;
      const y = paddingTop + upperChartHeight - pct * upperChartHeight;
      return { val, y };
    });

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      upperChartHeight,
      lowerChartTop,
      lowerChartHeight,
      plotWidth,
      roundedMaxY,
      maxCantidad,
      pointsUpper,
      pathD,
      areaD,
      gridUpper,
      getX,
      getYUpper,
      getYLower,
    };
  }, [serie]);

  return (
    <div className="space-y-4">
      {/* 1. Barra de Control de Fecha y Navegación de Mes */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleMesAnterior}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/80 text-slate-700 transition-all cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
            <Calendar className="w-4 h-4 text-amber-600" />
            <select
              value={selectedMes}
              onChange={(e) => setSelectedMes(Number(e.target.value))}
              className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
            >
              {MESES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedAnio}
              onChange={(e) => setSelectedAnio(Number(e.target.value))}
              className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleMesSiguiente}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/80 text-slate-700 transition-all cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setMostrarTabla(!mostrarTabla)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              mostrarTabla
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{mostrarTabla ? 'Ver solo Gráfico' : 'Ver Tabla de Días'}</span>
          </button>

          <button
            onClick={() => cargarReporte()}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Consultando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas de KPIs del Mes */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Total Facturado en el Mes */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Vendido en {resumen?.mesNombre || 'el Mes'}
          </span>
          <p className="mt-1 text-base sm:text-xl font-black text-slate-900">
            {monedaSimbolo} {Number(resumen?.totalVendidoMes ?? 0).toFixed(2)}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            Mes Completo
          </span>
        </div>

        {/* Total de Transacciones */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Transacciones
          </span>
          <p className="mt-1 text-base sm:text-xl font-black text-slate-900">
            {resumen?.cantidadVentasMes ?? 0} ventas
          </p>
          <span className="text-[10px] text-sky-600 font-bold flex items-center gap-1 mt-0.5">
            <ShoppingBag className="w-3 h-3" />
            Volumen Total
          </span>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Ticket Promedio
          </span>
          <p className="mt-1 text-base sm:text-xl font-black text-slate-900">
            {monedaSimbolo} {Number(resumen?.ticketPromedio ?? 0).toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
            Por comprobante
          </span>
        </div>

        {/* Promedio Diario */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Promedio Diario
          </span>
          <p className="mt-1 text-base sm:text-xl font-black text-slate-900">
            {monedaSimbolo} {Number(resumen?.promedioDiarioVenta ?? 0).toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
            Por día de mes
          </span>
        </div>

        {/* Día Récord de Ventas */}
        <div className="col-span-2 sm:col-span-1 bg-amber-50/60 rounded-2xl p-3 border border-amber-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            Día Récord
          </span>
          <p className="mt-1 text-base sm:text-xl font-black text-amber-900">
            Día {resumen?.diaRecordVenta ?? 1}
          </p>
          <span className="text-[10px] text-amber-800 font-bold mt-0.5 block">
            {monedaSimbolo} {Number(resumen?.montoDiaRecord ?? 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* 3. Plano Cartesiano Interactivo (Visualización estilo gráfico bursátil / financiero como foto 2) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-500" />
              <span>Plano Cartesiano de Ventas: {resumen?.mesNombre} {resumen?.anio}</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">
              Curva continua de facturación diaria con fluctuación y barras de volumen de transacciones debajo
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 rounded-full inline-block" />
              Facturación (Eje Superior)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-xs inline-block" />
              Volumen de Ventas (Eje Inferior)
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-80 flex flex-col items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-500 animate-spin mb-2" />
            <p className="text-xs font-bold text-slate-500">Construyendo plano cartesiano...</p>
          </div>
        ) : !chartMetrics ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-400">
            <Layers className="w-10 h-10 mb-2 stroke-[1.5]" />
            <p className="text-xs font-bold">No hay datos registrados para este mes</p>
          </div>
        ) : (
          <div className="relative mt-2 overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartMetrics.width} ${chartMetrics.height}`}
              className="w-full h-auto min-w-[700px] select-none"
              style={{ maxHeight: '460px' }}
              onMouseLeave={() => {
                setHoveredDia(null);
                setHoverPos(null);
              }}
            >
              <defs>
                {/* Gradiente bajo la curva */}
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>

                {/* Sombra suave de la línea de tendencia */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* LÍNEAS DE CUADRÍCULA HORIZONTAL (Eje Y Superior) */}
              {chartMetrics.gridUpper.map((g, idx) => (
                <g key={`grid-u-${idx}`}>
                  <line
                    x1={chartMetrics.paddingLeft}
                    y1={g.y}
                    x2={chartMetrics.width - chartMetrics.paddingRight}
                    y2={g.y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? 'none' : '3 3'}
                  />
                  <text
                    x={chartMetrics.paddingLeft - 8}
                    y={g.y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="700"
                    fill="#94a3b8"
                  >
                    {monedaSimbolo} {g.val >= 1000 ? `${(g.val / 1000).toFixed(1)}k` : g.val.toFixed(0)}
                  </text>
                </g>
              ))}

              {/* SEPARADOR DE PLANO / LÍNEA MEDIANA */}
              <line
                x1={chartMetrics.paddingLeft}
                y1={chartMetrics.lowerChartTop - 12}
                x2={chartMetrics.width - chartMetrics.paddingRight}
                y2={chartMetrics.lowerChartTop - 12}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              <text
                x={chartMetrics.paddingLeft}
                y={chartMetrics.lowerChartTop - 18}
                fontSize="9"
                fontWeight="800"
                fill="#64748b"
                letterSpacing="0.05em"
              >
                HISTOGRAMA DE VOLUMEN (CANTIDAD DE VENTAS POR DÍA)
              </text>

              {/* ÁREA BAJO LA CURVA */}
              <path d={chartMetrics.areaD} fill="url(#curveGradient)" />

              {/* LÍNEA DE TENDENCIA / CURVA DE FACTURACIÓN (Eje Superior) */}
              <path
                d={chartMetrics.pathD}
                fill="none"
                stroke="#ea580c"
                strokeWidth="2.5"
                filter="url(#glow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* MINI VELAS O TICKS DE FLUCTUACIÓN (como en la foto 2) */}
              {chartMetrics.pointsUpper.map((pt, idx) => {
                const monto = Number(pt.data.totalVendido) || 0;
                if (monto <= 0) return null;
                const tickHeight = Math.max(6, Math.min(24, monto * 0.4));
                return (
                  <g key={`tick-${idx}`}>
                    <line
                      x1={pt.x}
                      y1={pt.y - tickHeight / 2}
                      x2={pt.x}
                      y2={pt.y + tickHeight / 2}
                      stroke="#334155"
                      strokeWidth="1.5"
                      opacity="0.75"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="3.5"
                      fill="#ea580c"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* HISTOGRAMA DE BARRAS DE VOLUMEN (Eje Inferior como en la foto 2) */}
              {serie.map((item, idx) => {
                const x = chartMetrics.getX(idx);
                const cant = item.cantidadVentas || 0;
                const barWidth = Math.max(
                  4,
                  Math.min(14, (chartMetrics.plotWidth / serie.length) * 0.6)
                );
                const barHeight =
                  cant > 0
                    ? Math.max(
                        6,
                        ((cant / chartMetrics.maxCantidad) * chartMetrics.lowerChartHeight)
                      )
                    : 2;
                const barY =
                  chartMetrics.lowerChartTop + chartMetrics.lowerChartHeight - barHeight;

                return (
                  <g key={`bar-${idx}`}>
                    <rect
                      x={x - barWidth / 2}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx="1.5"
                      fill={cant > 0 ? '#f59e0b' : '#e2e8f0'}
                      opacity={cant > 0 ? 0.9 : 0.4}
                    />
                  </g>
                );
              })}

              {/* LÍNEA BASE DEL HISTOGRAMA */}
              <line
                x1={chartMetrics.paddingLeft}
                y1={chartMetrics.lowerChartTop + chartMetrics.lowerChartHeight}
                x2={chartMetrics.width - chartMetrics.paddingRight}
                y2={chartMetrics.lowerChartTop + chartMetrics.lowerChartHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
              />

              {/* ETIQUETAS DEL EJE X (Días 1, 5, 10, 15, 20, 25, fin de mes) */}
              {serie.map((item, idx) => {
                const dia = item.dia;
                const shouldShow =
                  dia === 1 ||
                  dia === 5 ||
                  dia === 10 ||
                  dia === 15 ||
                  dia === 20 ||
                  dia === 25 ||
                  dia === serie.length;

                if (!shouldShow) return null;
                const x = chartMetrics.getX(idx);
                const y = chartMetrics.lowerChartTop + chartMetrics.lowerChartHeight + 16;

                return (
                  <g key={`label-x-${dia}`}>
                    <line
                      x1={x}
                      y1={chartMetrics.lowerChartTop + chartMetrics.lowerChartHeight}
                      x2={x}
                      y2={chartMetrics.lowerChartTop + chartMetrics.lowerChartHeight + 4}
                      stroke="#64748b"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#64748b"
                    >
                      Día {dia}
                    </text>
                  </g>
                );
              })}

              {/* OVERLAY INTERACTIVO: DETECCIÓN DE HOVER EN CADA DÍA */}
              {serie.map((item, idx) => {
                const x = chartMetrics.getX(idx);
                const slotWidth = chartMetrics.plotWidth / serie.length;

                return (
                  <rect
                    key={`slot-${idx}`}
                    x={x - slotWidth / 2}
                    y={chartMetrics.paddingTop}
                    width={slotWidth}
                    height={chartMetrics.height - chartMetrics.paddingTop}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      setHoveredDia(item);
                      setHoverPos({
                        x,
                        y: chartMetrics.getYUpper(Number(item.totalVendido) || 0),
                      });
                    }}
                  />
                );
              })}

              {/* LÍNEA GUÍA VERTICAL AL HACER HOVER */}
              {hoverPos && hoveredDia && (
                <g pointerEvents="none">
                  <line
                    x1={hoverPos.x}
                    y1={chartMetrics.paddingTop}
                    x2={hoverPos.x}
                    y2={chartMetrics.lowerChartTop + chartMetrics.lowerChartHeight}
                    stroke="#f97316"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={hoverPos.x}
                    cy={hoverPos.y}
                    r="5"
                    fill="#ea580c"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* TOOLTIP FLOTANTE INTERACTIVO */}
            {hoveredDia && hoverPos && (
              <div
                className="absolute z-20 pointer-events-none p-3 bg-slate-900/95 text-white rounded-xl shadow-xl border border-slate-700 text-xs transition-all backdrop-blur-xs min-w-[200px]"
                style={{
                  left: Math.min(
                    Math.max(10, (hoverPos.x / chartMetrics.width) * 100),
                    75
                  ) + '%',
                  top: '15px',
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-1.5">
                  <span className="font-black text-amber-400">
                    Día {hoveredDia.dia} ({hoveredDia.diaSemana})
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(hoveredDia.fecha).toLocaleDateString('es-PE')}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Vendido:</span>
                    <strong className="text-emerald-400 font-black">
                      {monedaSimbolo} {Number(hoveredDia.totalVendido).toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Comprobantes:</span>
                    <strong className="text-sky-300 font-bold">
                      {hoveredDia.cantidadVentas} {hoveredDia.cantidadVentas === 1 ? 'venta' : 'ventas'}
                    </strong>
                  </div>

                  {Number(hoveredDia.totalVendido) > 0 && (
                    <div className="pt-1.5 mt-1 border-t border-slate-800 text-[10px] space-y-0.5 text-slate-300">
                      {Number(hoveredDia.totalEfectivo) > 0 && (
                        <div className="flex justify-between">
                          <span>Efectivo:</span>
                          <span>{monedaSimbolo} {Number(hoveredDia.totalEfectivo).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(hoveredDia.totalYape) > 0 && (
                        <div className="flex justify-between">
                          <span>Yape:</span>
                          <span>{monedaSimbolo} {Number(hoveredDia.totalYape).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(hoveredDia.totalPlin) > 0 && (
                        <div className="flex justify-between">
                          <span>Plin:</span>
                          <span>{monedaSimbolo} {Number(hoveredDia.totalPlin).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(hoveredDia.totalTarjeta) > 0 && (
                        <div className="flex justify-between">
                          <span>Tarjeta:</span>
                          <span>{monedaSimbolo} {Number(hoveredDia.totalTarjeta).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(hoveredDia.totalTransferencia) > 0 && (
                        <div className="flex justify-between">
                          <span>Transferencia:</span>
                          <span>{monedaSimbolo} {Number(hoveredDia.totalTransferencia).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(hoveredDia.totalFiado) > 0 && (
                        <div className="flex justify-between text-amber-300">
                          <span>Fiado:</span>
                          <span>{monedaSimbolo} {Number(hoveredDia.totalFiado).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Tabla de Días del Mes (Desplegable) */}
      {mostrarTabla && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200/80">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Desglose Diario de {resumen?.mesNombre} {resumen?.anio}
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Día</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Día Semana</th>
                  <th className="py-2.5 px-3 text-right">Total Facturado</th>
                  <th className="py-2.5 px-3 text-center">Transacciones</th>
                  <th className="py-2.5 px-3 text-right">Efectivo</th>
                  <th className="py-2.5 px-3 text-right">Yape</th>
                  <th className="py-2.5 px-3 text-right">Plin</th>
                  <th className="py-2.5 px-3 text-right">Tarjeta</th>
                  <th className="py-2.5 px-3 text-right">Transferencia</th>
                  <th className="py-2.5 px-3 text-right">Fiado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serie.map((item) => {
                  const tieneVenta = Number(item.totalVendido) > 0;
                  return (
                    <tr
                      key={item.dia}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        tieneVenta ? 'bg-amber-50/20 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-slate-800">
                        Día {item.dia}
                      </td>
                      <td className="py-2 px-3">
                        {new Date(item.fecha).toLocaleDateString('es-PE')}
                      </td>
                      <td className="py-2 px-3">{item.diaSemana}</td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">
                        {monedaSimbolo} {Number(item.totalVendido).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.cantidadVentas > 0
                              ? 'bg-sky-100 text-sky-700'
                              : 'text-slate-300'
                          }`}
                        >
                          {item.cantidadVentas}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{monedaSimbolo} {Number(item.totalEfectivo).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{monedaSimbolo} {Number(item.totalYape).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{monedaSimbolo} {Number(item.totalPlin).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{monedaSimbolo} {Number(item.totalTarjeta).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{monedaSimbolo} {Number(item.totalTransferencia).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-amber-600">{monedaSimbolo} {Number(item.totalFiado).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
