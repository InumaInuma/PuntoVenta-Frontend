import api from '../api';
import type { Categoria } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export const categoriasService = {
  getAll: async (): Promise<Categoria[]> => {
    const response = await api.get<ApiResponse<Categoria[]>>('/categorias');
    return response.data || [];
  },

  getById: async (id: number): Promise<Categoria> => {
    const response = await api.get<ApiResponse<Categoria>>(`/categorias/${id}`);
    return response.data;
  },

  create: async (data: Partial<Categoria>): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/categorias', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Categoria>): Promise<void> => {
    await api.put<ApiResponse<void>>(`/categorias/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/categorias/${id}`);
  },
};

export default categoriasService;
