import api from '../api';
import type { Cliente } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface CuentaPorCobrar {
  id: number;
  idCliente: number;
  idVenta: number;
  numeroComprobante: string;
  idEstadoCuentaPorCobrar: number;
  estadoCuentaCodigo: string;
  estadoCuentaNombre: string;
  montoTotal: number;
  saldoPendiente: number;
  fechaEmision: string;
  fechaVencimiento?: string;
}

export interface RegistrarAbonoPayload {
  idTurnoCaja: number;
  idMetodoPagoConfig?: number;
  montoAbonado: number;
  referenciaTransaccion?: string;
  observaciones?: string;
}

export interface ResultadoAbonoResponse {
  idAbono: number;
  saldoRestanteCliente: number;
}

export const clientesService = {
  getAll: async (q?: string): Promise<Cliente[]> => {
    const url = `/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`;
    const response = await api.get<ApiResponse<any[]>>(url);
    const raw = response.data || [];
    return raw.map((c: any) => ({
      idCliente: c.id || c.idCliente || c.Id || 0,
      idEmpresa: c.tenantId || c.idEmpresa || 1,
      nombreCompleto: c.nombreCompleto || c.NombreCompleto || '',
      numeroDocumento: c.numeroDocumento || c.NumeroDocumento || '',
      tipoDocumento: c.tipoDocumento || c.TipoDocumento || 'DNI',
      telefono: c.telefono || c.Telefono || '',
      direccion: c.direccion || c.Direccion || '',
      limiteCredito: Number(c.limiteCredito ?? c.LimiteCredito ?? 0),
      saldoDeudor: Number(c.saldoDeudorActual ?? c.SaldoDeudorActual ?? c.saldoDeudor ?? 0),
      activo: c.activo !== undefined ? c.activo : true,
    }));
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get<ApiResponse<any>>(`/clientes/${id}`);
    const c = response.data || {};
    return {
      idCliente: c.id || c.idCliente || c.Id || 0,
      idEmpresa: c.tenantId || c.idEmpresa || 1,
      nombreCompleto: c.nombreCompleto || '',
      numeroDocumento: c.numeroDocumento || '',
      tipoDocumento: c.tipoDocumento || 'DNI',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
      limiteCredito: Number(c.limiteCredito ?? 0),
      saldoDeudor: Number(c.saldoDeudorActual ?? c.saldoDeudor ?? 0),
      activo: c.activo !== undefined ? c.activo : true,
    };
  },

  create: async (data: {
    nombreCompleto: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
    telefono?: string;
    direccion?: string;
    limiteCredito?: number;
  }): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/clientes', data);
    return response.data;
  },

  update: async (
    id: number,
    data: {
      nombreCompleto: string;
      tipoDocumento?: string;
      numeroDocumento?: string;
      telefono?: string;
      direccion?: string;
      limiteCredito: number;
      activo?: boolean;
    }
  ): Promise<boolean> => {
    const response = await api.put<ApiResponse<boolean>>(`/clientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<boolean> => {
    const response = await api.delete<ApiResponse<boolean>>(`/clientes/${id}`);
    return response.data;
  },

  getDeudas: async (idCliente: number): Promise<CuentaPorCobrar[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/clientes/${idCliente}/deudas`);
    const raw = response.data || [];
    return raw.map((d: any) => ({
      id: d.id || d.Id,
      idCliente: d.idCliente || d.IdCliente,
      idVenta: d.idVenta || d.IdVenta,
      numeroComprobante: d.numeroComprobante || d.NumeroComprobante || '',
      idEstadoCuentaPorCobrar: d.idEstadoCuentaPorCobrar || d.IdEstadoCuentaPorCobrar || 1,
      estadoCuentaCodigo: d.estadoCuentaCodigo || d.EstadoCuentaCodigo || '',
      estadoCuentaNombre: d.estadoCuentaNombre || d.EstadoCuentaNombre || 'Pendiente',
      montoTotal: Number(d.montoTotal ?? d.MontoTotal ?? 0),
      saldoPendiente: Number(d.saldoPendiente ?? d.SaldoPendiente ?? 0),
      fechaEmision: d.fechaEmision || d.FechaEmision || '',
      fechaVencimiento: d.fechaVencimiento || d.FechaVencimiento,
    }));
  },

  abonarCuenta: async (
    idCuenta: number,
    data: RegistrarAbonoPayload
  ): Promise<ResultadoAbonoResponse> => {
    const response = await api.post<ApiResponse<ResultadoAbonoResponse>>(
      `/clientes/cuentas/${idCuenta}/abonos`,
      {
        idTurnoCaja: data.idTurnoCaja,
        idMetodoPagoConfig: data.idMetodoPagoConfig || 1,
        montoAbonado: data.montoAbonado,
        referenciaTransaccion: data.referenciaTransaccion || null,
        observaciones: data.observaciones || 'Abono registrado en punto de venta',
      }
    );
    return response.data;
  },
};

export default clientesService;
