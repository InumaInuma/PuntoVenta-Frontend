import api from '../api';
import type { RegistrarVentaPayload, VentaHistorialItem } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface RegistrarVentaResponse {
  idVenta: number;
  codigoVenta: string;
  total: number;
}

export const ventasService = {
  registrar: async (payload: RegistrarVentaPayload): Promise<RegistrarVentaResponse> => {
    const response = await api.post<ApiResponse<RegistrarVentaResponse>>('/ventas/registrar', payload);
    return response.data;
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
};

export default ventasService;
