import api from '../api';
import type { MetodoPago } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface PaisConfig {
  id: number;
  codigoIso: string;
  nombre: string;
  monedaNombre: string;
  monedaSimbolo: string;
  monedaCodigo: string;
  zonaHorariaWindows: string;
  zonaHorariaIana: string;
  codigoTelefonico: string;
}

export interface TenantConfig {
  idTenant: number;
  idPais?: number;
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
  paisNombre?: string;
  codigoIso?: string;
  monedaNombre?: string;
  monedaSimbolo?: string;
  monedaCodigo?: string;
  zonaHorariaWindows?: string;
  zonaHorariaIana?: string;
  codigoTelefonico?: string;
}

export const configuracionService = {
  getConfiguracion: async (): Promise<TenantConfig> => {
    const response = await api.get<ApiResponse<TenantConfig>>('/configuracion');
    return response.data;
  },

  updateConfiguracion: async (data: Partial<TenantConfig>): Promise<void> => {
    await api.put<ApiResponse<void>>('/configuracion', data);
  },

  getPaises: async (): Promise<PaisConfig[]> => {
    const response = await api.get<ApiResponse<PaisConfig[]>>('/configuracion/paises');
    return response.data || [];
  },

  getMetodosPago: async (): Promise<MetodoPago[]> => {
    const response = await api.get<ApiResponse<MetodoPago[]>>('/configuracion/metodos-pago');
    return response.data || [];
  },

  createMetodoPago: async (data: {
    codigoMetodo: string;
    nombreMostrado: string;
    activo?: boolean;
    requiereComprobanteRef?: boolean;
    imagenQRUrl?: string | null;
    numeroTitular?: string | null;
    nombreTitular?: string | null;
    ordenVisual?: number;
  }): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>('/configuracion/metodos-pago', data);
    return response.data;
  },

  updateMetodoPago: async (id: number, data: Partial<MetodoPago>): Promise<void> => {
    await api.put<ApiResponse<void>>(`/configuracion/metodos-pago/${id}`, data);
  },

  deleteMetodoPago: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/configuracion/metodos-pago/${id}`);
  },

  subirImagen: async (
    file: File, 
    carpeta: 'config' | 'metodos-pago' = 'config'
  ): Promise<{ rutaRelativa: string; urlPublica: string }> => {
    const formData = new FormData();
    formData.append('archivo', file);
    const response = await api.post<ApiResponse<{ rutaRelativa: string; urlPublica: string }>>(
      `/configuracion/subir-imagen?carpeta=${carpeta}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

export default configuracionService;
