import api from '../api';
import type { MetodoPago } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface TenantConfig {
  idTenant: number;
  nombreComercial: string;
  razonSocial: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefonoWhatsApp: string;
  correoContacto: string;
  direccion: string;
  logoUrl?: string;
  textoCabeceraTicket?: string;
  textoPieTicket?: string;
  anchoTicketMm: number;
  imprimeTicketAutomatico: boolean;
}

export const configuracionService = {
  getConfiguracion: async (): Promise<TenantConfig> => {
    const response = await api.get<ApiResponse<TenantConfig>>('/configuracion');
    return response.data;
  },

  updateConfiguracion: async (data: Partial<TenantConfig>): Promise<void> => {
    await api.put<ApiResponse<void>>('/configuracion', data);
  },

  getMetodosPago: async (): Promise<MetodoPago[]> => {
    const response = await api.get<ApiResponse<MetodoPago[]>>('/configuracion/metodos-pago');
    return response.data || [];
  },

  updateMetodoPago: async (id: number, data: Partial<MetodoPago>): Promise<void> => {
    await api.put<ApiResponse<void>>(`/configuracion/metodos-pago/${id}`, data);
  },
};

export default configuracionService;
