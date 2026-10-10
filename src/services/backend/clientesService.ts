import api from '../api';
import type { Cliente } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface AbonarCuentaPayload {
  idEmpresa: number;
  idTurnoCaja: number;
  idCliente: number;
  idUsuario: number;
  montoAbono: number;
  idMetodoPago: number;
}

export const clientesService = {
  getAll: async (q?: string): Promise<Cliente[]> => {
    const url = `/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`;
    const response = await api.get<ApiResponse<Cliente[]>>(url);
    return response.data || [];
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get<ApiResponse<Cliente>>(`/clientes/${id}`);
    return response.data;
  },

  create: async (data: Partial<Cliente>): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/clientes', data);
    return response.data;
  },

  abonar: async (data: AbonarCuentaPayload): Promise<void> => {
    await api.post<ApiResponse<void>>('/clientes/cuentas-cobrar/abonar', data);
  },
};

export default clientesService;
