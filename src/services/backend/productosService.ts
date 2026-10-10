import api from '../api';
import type { Producto } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export const productosService = {
  getAll: async (idCategoria?: number, q?: string): Promise<Producto[]> => {
    const params = new URLSearchParams();
    if (idCategoria) params.append('idCategoria', idCategoria.toString());
    if (q) params.append('q', q);

    const url = `/productos${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<ApiResponse<Producto[]>>(url);
    return response.data || [];
  },

  getByCodigo: async (codigoBarras: string): Promise<Producto> => {
    const response = await api.get<ApiResponse<Producto>>(`/productos/codigo/${encodeURIComponent(codigoBarras)}`);
    return response.data;
  },

  getById: async (id: number): Promise<Producto> => {
    const response = await api.get<ApiResponse<Producto>>(`/productos/${id}`);
    return response.data;
  },

  create: async (data: Partial<Producto>): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/productos', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Producto>): Promise<void> => {
    await api.put<ApiResponse<void>>(`/productos/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/productos/${id}`);
  },
};

export default productosService;
