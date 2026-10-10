import api from '../api';
import type { TurnoCaja, MovimientoCaja } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface AbrirTurnoPayload {
  idCaja: number;
  idUsuario: number;
  montoApertura: number;
}

export interface CerrarTurnoPayload {
  montoCierre: number;
  observaciones?: string;
}

export const cajasService = {
  getTurnoActivo: async (): Promise<TurnoCaja | null> => {
    try {
      const response = await api.get<ApiResponse<TurnoCaja>>('/cajas/turnos/activo');
      return response.data || null;
    } catch {
      return null;
    }
  },

  abrirTurno: async (data: AbrirTurnoPayload): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/cajas/turnos/abrir', data);
    return response.data;
  },

  cerrarTurno: async (idTurno: number, data: CerrarTurnoPayload): Promise<void> => {
    await api.post<ApiResponse<void>>(`/cajas/turnos/${idTurno}/cerrar`, data);
  },

  registrarMovimiento: async (data: MovimientoCaja): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/cajas/movimientos', data);
    return response.data;
  },
};

export default cajasService;
