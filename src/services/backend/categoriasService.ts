import api from '../api';
import type { Categoria } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export const categoriasService = {
  getAll: async (): Promise<Categoria[]> => {
    const response = await api.get<ApiResponse<any[]>>('/categorias');
    const list = response.data || [];
    return list.map((c: any) => ({
      idCategoria: c.idCategoria || c.id || c.Id,
      idEmpresa: c.idEmpresa || c.tenantId || 1,
      nombre: c.nombre || c.Nombre,
      color: c.color || c.colorHex || c.ColorHex || '#3b82f6',
      icono: c.icono || c.Icono || 'package',
      activo: c.activo !== undefined ? c.activo : c.Activo !== undefined ? c.Activo : true,
    }));
  },

  getById: async (id: number): Promise<Categoria> => {
    const response = await api.get<ApiResponse<any>>(`/categorias/${id}`);
    const c = response.data;
    return {
      idCategoria: c.idCategoria || c.id || c.Id,
      idEmpresa: c.idEmpresa || c.tenantId || 1,
      nombre: c.nombre || c.Nombre,
      color: c.color || c.colorHex || c.ColorHex || '#3b82f6',
      icono: c.icono || c.Icono || 'package',
      activo: c.activo !== undefined ? c.activo : c.Activo !== undefined ? c.Activo : true,
    };
  },

  create: async (data: { nombre: string; colorHex?: string; icono?: string }): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/categorias', {
      nombre: data.nombre.trim(),
      colorHex: data.colorHex || '#3b82f6',
      icono: data.icono || 'package',
    });
    return response.data;
  },

  update: async (
    id: number,
    data: { nombre: string; colorHex?: string; icono?: string; activo?: boolean }
  ): Promise<void> => {
    await api.put<ApiResponse<void>>(`/categorias/${id}`, {
      nombre: data.nombre.trim(),
      colorHex: data.colorHex || '#3b82f6',
      icono: data.icono || 'package',
      activo: data.activo !== undefined ? data.activo : true,
    });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/categorias/${id}`);
  },
};

export default categoriasService;
