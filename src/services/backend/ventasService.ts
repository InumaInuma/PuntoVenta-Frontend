import api from '../api';
import type { RegistrarVentaPayload, VentaHistorialItem } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface RegistrarVentaResponse {
  idVenta: number;
  codigoVenta: string;
  total: number;
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

  getHistorial: async (fechaInicio?: string, fechaFin?: string): Promise<VentaHistorialItem[]> => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    const url = `/ventas/historial${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<ApiResponse<VentaHistorialItem[]>>(url);
    return response.data || [];
  },

  getById: async (id: number): Promise<unknown> => {
    const response = await api.get<ApiResponse<unknown>>(`/ventas/${id}`);
    return response.data;
  },

  getTicket: async (id: number): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/ventas/${id}/ticket`);
    return response.data;
  },
};

export default ventasService;
