import api from '../api';
import type { RegistrarVentaPayload, VentaHistorialItem } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface RegistrarVentaResponse {
  idVenta: number;
  codigoVenta: string;
  total: number;
}

export interface PagedVentasResponse {
  items: VentaHistorialItem[];
  totalRegistros: number;
  montoTotal?: number;
  numeroPagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface ResumenVentasMes {
  anio: number;
  mes: number;
  mesNombre: string;
  totalVendidoMes: number;
  cantidadVentasMes: number;
  ticketPromedio: number;
  promedioDiarioVenta: number;
  diaRecordVenta: number;
  montoDiaRecord: number;
}

export interface DiaVentaCartesiano {
  dia: number;
  fecha: string;
  diaSemana: string;
  totalVendido: number;
  cantidadVentas: number;
  totalEfectivo: number;
  totalYape: number;
  totalPlin: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalFiado: number;
}

export interface ReporteVentasMensual {
  resumen: ResumenVentasMes;
  serieDiaria: DiaVentaCartesiano[];
}

export const ventasService = {
  registrar: async (payload: RegistrarVentaPayload | any): Promise<RegistrarVentaResponse> => {
    const isFiado =
      payload.isFiado ||
      payload.metodoPago === 'FIADO' ||
      (payload.pagos?.length === 0 && payload.idCliente);

    const isNotaVenta =
      payload.tipoComprobante === 'NOTA_VENTA' ||
      payload.tipoComprobante === 'TICK' ||
      !payload.tipoComprobante;
    const isBoleta =
      payload.tipoComprobante === 'BOLETA' || payload.tipoComprobante === 'BOL';

    const tipoComprobanteId = isNotaVenta ? 1 : isBoleta ? 2 : 3;
    const serieDefecto = isNotaVenta ? 'TK01' : isBoleta ? 'B001' : 'F001';

    const requestBody = {
      idTurnoCaja: payload.idTurnoCaja,
      idCliente: payload.idCliente || null,
      clienteNombre: payload.clienteNombre || null,
      clienteDocumento: payload.clienteDocumento || null,
      idComprobanteTipo: payload.idComprobanteTipo ?? tipoComprobanteId,
      tipoComprobante: payload.tipoComprobante,
      serie: payload.serie || serieDefecto,
      idTipoVenta: isFiado ? 2 : payload.idTipoVenta || 1,
      subtotal: payload.subtotal,
      descuento: payload.descuento || 0,
      totalVenta: payload.total ?? payload.totalVenta,
      total: payload.total ?? payload.totalVenta,
      montoFiado: isFiado ? payload.total ?? payload.totalVenta : payload.montoFiado || 0,
      montoEfectivoRecibido: payload.montoEfectivoRecibido ?? null,
      vueltoEntregado: payload.vuelto ?? payload.vueltoEntregado ?? null,
      items: (payload.detalles || payload.items || []).map((d: any) => ({
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        descuento: d.descuento || 0,
        subtotal: d.subtotal,
      })),
      formasPago: isFiado
        ? []
        : (payload.pagos || payload.formasPago || []).map((p: any) => ({
            idMetodoPagoConfig: p.idMetodoPago ?? p.idMetodoPagoConfig ?? 1,
            monto: p.monto,
            referenciaTransaccion: p.referenciaOperacion ?? p.referenciaTransaccion ?? null,
          })),
    };

    try {
      const response = await api.post<ApiResponse<any>>('/ventas', requestBody);
      const data = response.data || response;
      return {
        idVenta: data.ventaId ?? data.idVenta,
        codigoVenta: data.numeroComprobante ?? data.codigoVenta,
        total: payload.total,
      };
    } catch {
      const response = await api.post<ApiResponse<any>>('/ventas/registrar', requestBody);
      const data = response.data || response;
      return {
        idVenta: data.ventaId ?? data.idVenta,
        codigoVenta: data.numeroComprobante ?? data.codigoVenta,
        total: payload.total,
      };
    }
  },

  getHistorial: async (
    pagina: number = 1,
    tamanoPagina: number = 15,
    fechaDesde?: string,
    fechaHasta?: string,
    q?: string,
    idTurnoCaja?: number
  ): Promise<PagedVentasResponse> => {
    const params = new URLSearchParams();
    params.append('pagina', pagina.toString());
    params.append('tamanoPagina', tamanoPagina.toString());
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (q && q.trim()) params.append('q', q.trim());
    if (idTurnoCaja) params.append('idTurnoCaja', idTurnoCaja.toString());

    const url = `/ventas/historial?${params.toString()}`;
    const response = await api.get<ApiResponse<any>>(url);
    const data = response.data || {};

    const rawList = Array.isArray(data) ? data : (data.items || []);
    const items = rawList.map((item: any) => {
      const parsedTotal = Number(item.totalVenta ?? item.total ?? 0);
      return {
        idVenta: Number(item.id ?? item.idVenta ?? 0),
        id: Number(item.id ?? item.idVenta ?? 0),
        codigoVenta: String(item.numeroComprobante ?? item.codigoVenta ?? `V-${item.id ?? 0}`),
        numeroComprobante: String(item.numeroComprobante ?? item.codigoVenta ?? `V-${item.id ?? 0}`),
        fechaVenta: item.fechaVenta || new Date().toISOString(),
        clienteNombre: item.clienteNombre || 'Cliente General',
        tipoComprobante: item.comprobanteTipoNombre || item.tipoComprobante || 'NOTA VENTA',
        comprobanteTipoNombre: item.comprobanteTipoNombre || item.tipoComprobante || 'NOTA VENTA',
        tipoVentaNombre: item.tipoVentaNombre || 'Contado',
        estadoVentaNombre: item.estadoVentaNombre || 'Completada',
        estado: item.estadoVentaNombre || item.estado || 'COMPLETADA',
        subtotal: Number(item.subtotal ?? parsedTotal),
        descuento: Number(item.descuento ?? 0),
        totalVenta: parsedTotal,
        total: parsedTotal,
        montoEfectivoRecibido: item.montoEfectivoRecibido != null ? Number(item.montoEfectivoRecibido) : undefined,
        vueltoEntregado: item.vueltoEntregado != null ? Number(item.vueltoEntregado) : undefined,
        cajeroNombre: item.cajeroNombre || 'Cajero',
        metodosPagoResumen: item.metodosPagoResumen || item.tipoVentaNombre || 'EFECTIVO',
      };
    });

    const totalRegistros = data.totalRegistros ?? items.length;
    const totalPaginas = data.totalPaginas ?? Math.ceil(totalRegistros / tamanoPagina) ?? 1;
    const montoTotal = Number(data.montoTotal ?? 0);

    return {
      items,
      totalRegistros,
      montoTotal,
      numeroPagina: data.numeroPagina ?? pagina,
      tamanoPagina: data.tamanoPagina ?? tamanoPagina,
      totalPaginas: Math.max(1, totalPaginas),
    };
  },

  getById: async (id: number): Promise<unknown> => {
    const response = await api.get<ApiResponse<unknown>>(`/ventas/${id}`);
    return response.data;
  },

  getTicket: async (id: number): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/ventas/${id}/ticket`);
    return response.data;
  },

  /**
   * Obtiene el reporte del mes en formato plano cartesiano (serie diaria con curva y volumen)
   */
  getReporteMensual: async (params?: { anio?: number; mes?: number }): Promise<ReporteVentasMensual | null> => {
    try {
      const response = await api.get<ApiResponse<ReporteVentasMensual>>('/ventas/reporte-mensual', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte mensual:', error);
      return null;
    }
  },
};

export default ventasService;
