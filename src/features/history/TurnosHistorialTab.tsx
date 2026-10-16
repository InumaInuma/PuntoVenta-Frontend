import React, { useState, useEffect } from 'react';
import { cajasService, type TurnoCajaHistorial } from '@/services/backend/cajasService';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  CreditCard,
  Smartphone,
  Landmark,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface TurnosHistorialTabProps {
  monedaSimbolo?: string;
}

export const TurnosHistorialTab: React.FC<TurnosHistorialTabProps> = ({
  monedaSimbolo = 'S/',
}) => {
  const [turnos, setTurnos] = useState<TurnoCajaHistorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('mes');

  const cargarTurnos = async (periodo = filtroPeriodo) => {
    setIsLoading(true);
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      let desde: string | undefined;
      let hasta: string | undefined;

      if (periodo === 'hoy') {
        const todayStr = toDate(now);
        desde = `${todayStr}T00:00:00`;
        hasta = `${todayStr}T23:59:59`;
      } else if (periodo === 'semana') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        desde = `${toDate(weekAgo)}T00:00:00`;
        hasta = `${toDate(now)}T23:59:59`;
      } else if (periodo === 'mes') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        desde = `${toDate(firstDay)}T00:00:00`;
        hasta = `${toDate(lastDay)}T23:59:59`;
      }

      const data = await cajasService.getHistorialTurnos({
        fechaDesde: desde,
        fechaHasta: hasta,
        top: 100,
      });
      setTurnos(data);
    } catch (err) {
      console.error('Error al cargar historial de turnos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarTurnos();
  }, [filtroPeriodo]);

  // Totales acumulados
  const totalRecaudado = turnos.reduce((acc, t) => acc + (Number(t.totalVentasGeneral) || 0), 0);
  const totalEfectivo = turnos.reduce((acc, t) => acc + (Number(t.totalVentasEfectivo) || 0), 0);
  const totalBilleteras = turnos.reduce(
    (acc, t) => acc + (Number(t.totalVentasYape) || 0) + (Number(t.totalVentasPlin) || 0),
    0
  );
  const totalBancario = turnos.reduce(
    (acc, t) => acc + (Number(t.totalVentasTarjeta) || 0) + (Number(t.totalVentasTransferencia) || 0),
    0
  );

  const formatFecha = (iso?: string) => {
    if (!iso) return 'En curso...';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const calcularDuracion = (inicioIso: string, finIso?: string) => {
    try {
      const inicio = new Date(inicioIso).getTime();
      const fin = finIso ? new Date(finIso).getTime() : Date.now();
      const diffMs = Math.max(0, fin - inicio);
      const horas = Math.floor(diffMs / (1000 * 60 * 60));
      const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${horas}h ${minutos}m`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Barra de Filtros y Actualizar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto w-full sm:w-auto">
          {(
            [
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Esta Semana' },
              { id: 'mes', label: 'Este Mes' },
              { id: 'todos', label: 'Todos los Turnos' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroPeriodo(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroPeriodo === tab.id
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => cargarTurnos()}
          disabled={isLoading}
          className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Consultando...' : 'Actualizar Cuadres'}</span>
        </button>
      </div>

      {/* 2. Tarjetas de Resumen Global de los Turnos Seleccionados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total General de Ventas */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ventas Totales
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="mt-2 text-base sm:text-2xl font-black text-slate-800">
            {monedaSimbolo} {totalRecaudado.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold">
            {turnos.length} {turnos.length === 1 ? 'turno auditado' : 'turnos auditados'}
          </span>
        </div>

        {/* Efectivo en Mano */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              En Efectivo
            </span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="mt-2 text-base sm:text-2xl font-black text-teal-700">
            {monedaSimbolo} {totalEfectivo.toFixed(2)}
          </p>
          <span className="text-[10px] text-teal-600 font-semibold">
            Cobrado en caja física
          </span>
        </div>

        {/* Billeteras Digitales (Yape + Plin) */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Yape / Plin
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="mt-2 text-base sm:text-2xl font-black text-purple-700">
            {monedaSimbolo} {totalBilleteras.toFixed(2)}
          </p>
          <span className="text-[10px] text-purple-600 font-semibold">
            Billeteras QR sin contacto
          </span>
        </div>

        {/* Tarjetas y Transferencias */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Bancos / Tarjetas
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="mt-2 text-base sm:text-2xl font-black text-blue-700">
            {monedaSimbolo} {totalBancario.toFixed(2)}
          </p>
          <span className="text-[10px] text-blue-600 font-semibold">
            POS y transferencias
          </span>
        </div>
      </div>

      {/* 3. Listado Detallado de Turnos (Inicio a Cierre) */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90">
          <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">Calculando arqueos de turnos...</p>
        </div>
      ) : turnos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">No se encontraron turnos en este período</p>
          <p className="text-xs text-slate-400 mt-1">
            Los turnos de caja aparecerán aquí al aperturarse y cerrarse.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {turnos.map((t) => {
            const isAbierto = t.estadoTurnoCodigo === 'ABIERTO';
            const diferencia = Number(t.diferencia ?? 0);
            const isCuadrado = Math.abs(diferencia) < 0.01;
            const isSobrante = diferencia > 0.01;
            const isFaltante = diferencia < -0.01;

            return (
              <div
                key={t.idTurnoCaja}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Cabecera del Turno */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700">
                      <Landmark className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-800">
                          {t.cajaNombre}
                        </h4>
                        <span className="text-[11px] font-bold text-slate-400">
                          #Turno {t.idTurnoCaja}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isAbierto
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isAbierto ? '● Turno Activo' : 'Cerrado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {t.cajeroNombre}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Duración: {calcularDuracion(t.fechaApertura, t.fechaCierre)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arqueo Status Badge */}
                  {!isAbierto && (
                    <div className="flex items-center gap-2">
                      {isCuadrado && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Caja Cuadrada Perfecta
                        </span>
                      )}
                      {isSobrante && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                          Sobrante: +{monedaSimbolo} {diferencia.toFixed(2)}
                        </span>
                      )}
                      {isFaltante && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Faltante: {monedaSimbolo} {diferencia.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Cuerpo del Turno con desglose */}
                <div className="p-4 space-y-4">
                  {/* Cronología de Horarios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/60 rounded-xl text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Inicio de Caja (Apertura)
                      </span>
                      <span className="font-bold text-slate-700">
                        {formatFecha(t.fechaApertura)}
                      </span>
                      <span className="block text-[11px] text-slate-500 font-semibold mt-0.5">
                        Monto Base / Fondo: <strong className="text-slate-800">{monedaSimbolo} {Number(t.montoApertura).toFixed(2)}</strong>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Cierre de Caja (Arqueo)
                      </span>
                      <span className="font-bold text-slate-700">
                        {formatFecha(t.fechaCierre)}
                      </span>
                      {!isAbierto && (
                        <span className="block text-[11px] text-slate-500 font-semibold mt-0.5">
                          Efectivo Físico Contado: <strong className="text-slate-800">{monedaSimbolo} {Number(t.montoCierreReal ?? 0).toFixed(2)}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desglose por Método de Pago */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span>Desglose de Cobros en el Turno</span>
                      <span className="text-slate-600 font-bold">
                        {t.cantidadVentas} {t.cantidadVentas === 1 ? 'venta realizada' : 'ventas realizadas'}
                      </span>
                    </h5>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {/* Efectivo */}
                      <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                          💵 Efectivo
                        </span>
                        <span className="text-sm font-black text-teal-800 block mt-0.5">
                          {monedaSimbolo} {Number(t.totalVentasEfectivo).toFixed(2)}
                        </span>
                      </div>

                      {/* Yape */}
                      <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                          📱 Yape
                        </span>
                        <span className="text-sm font-black text-purple-800 block mt-0.5">
                          {monedaSimbolo} {Number(t.totalVentasYape).toFixed(2)}
                        </span>
                      </div>

                      {/* Plin */}
                      <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                          🟣 Plin
                        </span>
                        <span className="text-sm font-black text-sky-800 block mt-0.5">
                          {monedaSimbolo} {Number(t.totalVentasPlin).toFixed(2)}
                        </span>
                      </div>

                      {/* Tarjetas */}
                      <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                          💳 Tarjetas
                        </span>
                        <span className="text-sm font-black text-indigo-800 block mt-0.5">
                          {monedaSimbolo} {Number(t.totalVentasTarjeta).toFixed(2)}
                        </span>
                      </div>

                      {/* Transferencias */}
                      <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                          🏦 Transferencias
                        </span>
                        <span className="text-sm font-black text-blue-800 block mt-0.5">
                          {monedaSimbolo} {Number(t.totalVentasTransferencia).toFixed(2)}
                        </span>
                      </div>

                      {/* Fiado / Crédito */}
                      <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                          ⏳ Fiado / Crédito
                        </span>
                        <span className="text-sm font-black text-amber-800 block mt-0.5">
                          {monedaSimbolo} {Number(t.totalVentasFiado).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Movimientos adicionales y Cuadratura */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-semibold">
                      {Number(t.totalAbonosFiadoEfectivo) > 0 && (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                          + Cobros de Fiados: {monedaSimbolo} {Number(t.totalAbonosFiadoEfectivo).toFixed(2)}
                        </span>
                      )}
                      {Number(t.totalIngresosExtra) > 0 && (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                          + Ingresos Extra: {monedaSimbolo} {Number(t.totalIngresosExtra).toFixed(2)}
                        </span>
                      )}
                      {Number(t.totalEgresosGastos) > 0 && (
                        <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                          - Gastos/Egresos: {monedaSimbolo} {Number(t.totalEgresosGastos).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-start md:justify-end gap-3 text-right">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Total Ventas del Turno
                        </span>
                        <span className="text-base font-black text-slate-900">
                          {monedaSimbolo} {Number(t.totalVentasGeneral).toFixed(2)}
                        </span>
                      </div>
                      {!isAbierto && (
                        <div className="pl-3 border-l border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Efectivo Esperado
                          </span>
                          <span className="text-base font-black text-slate-900">
                            {monedaSimbolo} {Number(t.montoCierreEsperado ?? 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observaciones si las hay */}
                  {t.observaciones && (
                    <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/70 text-xs text-amber-900 font-medium">
                      <strong>Nota de Cierre:</strong> {t.observaciones}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
