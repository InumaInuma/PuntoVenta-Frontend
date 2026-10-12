import api from '../api';
import type { TurnoCaja, MovimientoCaja } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface AbrirTurnoPayload {
  idCaja?: number;
  idUsuario?: number;
  montoApertura: number;
  observaciones?: string;
}

export interface CerrarTurnoPayload {
  montoCierre: number;
  montoCierreReal?: number;
  observaciones?: string;
}

export interface MovimientoCajaPayload {
  idTurnoCaja: number;
  idTipoMovimientoCaja?: number; // 1: Egreso, 2: Ingreso
  idCategoriaMovimientoCaja?: number;
  tipo?: 'INGRESO' | 'EGRESO';
  monto: number;
  motivo?: string;
  concepto?: string;
  numeroComprobanteGasto?: string;
}

// Mapeador defensivo de TurnoCajaActivoDto (Backend) a TurnoCaja (Frontend)
const mapTurno = (raw: any): TurnoCaja | null => {
  if (!raw) return null;
  return {
    idTurnoCaja: raw.idTurnoCaja ?? raw.id ?? 0,
    idCaja: raw.idCaja ?? 1,
    idUsuario: raw.idUsuario ?? 1,
    idSucursal: raw.idSucursal ?? 1,
    nombreCaja: raw.cajaNombre || raw.nombreCaja || 'Caja Principal 01',
    nombreUsuario: raw.cajeroNombre || raw.nombreUsuario || 'Cajero',
    montoApertura: Number(raw.montoApertura ?? 0),
    fechaApertura: raw.fechaApertura || new Date().toISOString(),
    montoCierre: raw.montoCierre ? Number(raw.montoCierre) : undefined,
    montoSistemaEfectivo: raw.montoSistemaEfectivo ? Number(raw.montoSistemaEfectivo) : Number(raw.montoApertura ?? 0),
    diferencia: raw.diferencia ? Number(raw.diferencia) : undefined,
    fechaCierre: raw.fechaCierre,
    estado: raw.estadoTurnoCodigo || raw.estado || 'ABIERTO',
    observaciones: raw.observaciones,
  };
};

export const cajasService = {
  /**
   * Obtiene la lista de cajas físicas registradas para el comercio del usuario
   */
  getCajas: async (): Promise<Array<{ id: number; nombre: string; ubicacion?: string; activo: boolean }>> => {
    try {
      const response = await api.get<ApiResponse<any>>('/cajas');
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Consulta el turno actualmente activo para la caja del negocio autenticado
   */
  getTurnoActivo: async (idCaja?: number): Promise<TurnoCaja | null> => {
    try {
      const url = idCaja ? `/cajas/${idCaja}/turno-activo` : '/cajas/turnos/activo';
      const response = await api.get<ApiResponse<any>>(url);
      if (response && response.data) {
        return mapTurno(response.data);
      }
      return null;
    } catch {
      try {
        const response = await api.get<ApiResponse<any>>(`/cajas/${idCaja || 1}/turno-activo`);
        if (response && response.data) {
          return mapTurno(response.data);
        }
      } catch {
        /* ignore */
      }
      return null;
    }
  },

  /**
   * Apertura un nuevo turno de caja con el fondo inicial
   */
  abrirTurno: async (data: AbrirTurnoPayload): Promise<number> => {
    const idCaja = data.idCaja;
    const payload = {
      idCaja: idCaja || 1,
      montoApertura: data.montoApertura,
      observaciones: data.observaciones || 'Apertura de turno en gaveta',
    };

    try {
      if (idCaja) {
        const response = await api.post<ApiResponse<number>>(`/cajas/${idCaja}/apertura`, payload);
        return response.data;
      }
      const response = await api.post<ApiResponse<number>>('/cajas/turnos/abrir', payload);
      return response.data;
    } catch {
      const response = await api.post<ApiResponse<number>>(`/cajas/${idCaja || 1}/apertura`, payload);
      return response.data;
    }
  },

  /**
   * Cierra el turno de caja con arqueo físico de efectivo
   */
  cerrarTurno: async (idTurno: number, data: CerrarTurnoPayload): Promise<void> => {
    const payload = {
      montoCierreReal: data.montoCierreReal ?? data.montoCierre,
      montoCierre: data.montoCierre,
      observaciones: data.observaciones,
    };

    try {
      await api.post<ApiResponse<any>>(`/cajas/turnos/${idTurno}/cierre`, payload);
    } catch {
      await api.post<ApiResponse<any>>(`/cajas/turnos/${idTurno}/cerrar`, payload);
    }
  },

  /**
   * Registra un egreso operativo o ingreso extra en la gaveta
   */
  registrarMovimiento: async (data: MovimientoCaja | MovimientoCajaPayload): Promise<number> => {
    const isEgreso = ('tipo' in data && data.tipo === 'EGRESO') || ('idTipoMovimientoCaja' in data && data.idTipoMovimientoCaja === 1);
    const motivo = ('concepto' in data && data.concepto) ? data.concepto : ('motivo' in data ? data.motivo : 'Movimiento de caja');

    const payload = {
      idTurnoCaja: data.idTurnoCaja,
      idTipoMovimientoCaja: isEgreso ? 1 : 2,
      idCategoriaMovimientoCaja: 1,
      monto: data.monto,
      motivo,
      concepto: motivo,
    };

    try {
      const response = await api.post<ApiResponse<number>>(`/cajas/turnos/${data.idTurnoCaja}/movimientos`, payload);
      return response.data;
    } catch {
      const response = await api.post<ApiResponse<number>>('/cajas/movimientos', payload);
      return response.data;
    }
  },
};

export default cajasService;
