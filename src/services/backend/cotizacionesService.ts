import api from '../api';
import type { ApiResponse } from '../auth/authTypes';

export interface ItemCotizacionPayload {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
}

export interface RegistrarCotizacionPayload {
  idCliente?: number | null;
  clienteNombre?: string | null;
  clienteDocumento?: string | null;
  subtotal: number;
  descuento?: number;
  total: number;
  validezDias?: number;
  observaciones?: string | null;
  items: ItemCotizacionPayload[];
}

export interface ResultadoCotizacion {
  idCotizacion: number;
  codigoCotizacion: string;
  total: number;
  validezDias: number;
  fechaEmision: string;
  fechaVencimiento: string;
  clienteNombre?: string | null;
  estadoCotizacionNombre: string;
}

export interface CotizacionHistorialItem {
  id: number;
  codigoCotizacion: string;
  idUsuario: number;
  cajeroNombre: string;
  idCliente?: number | null;
  clienteNombre?: string | null;
  clienteDocumento?: string | null;
  idEstadoCotizacion: number; // 1: PENDIENTE, 2: CONVERTIDA, 3: VENCIDA, 4: ANULADA
  estadoCodigo: string;
  estadoNombre: string;
  estadoColorHex: string;
  subtotal: number;
  descuento: number;
  totalCotizacion: number;
  validezDias: number;
  fechaEmision: string;
  fechaVencimiento: string;
  observaciones?: string | null;
  idVentaConvertida?: number | null;
}

export interface CotizacionDetalleItem {
  id: number;
  idProducto: number;
  productoNombre: string;
  codigoBarras?: string;
  stockActual: number;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface CotizacionCompleta {
  cabecera: CotizacionHistorialItem & {
    nombreComercial: string;
    razonSocial?: string;
    rucOIdentificacion?: string;
    direccionComercio?: string;
    telefonoComercio?: string;
    logoUrl?: string;
  };
  detalle: CotizacionDetalleItem[];
}

export interface PagedCotizacionesResponse {
  items: CotizacionHistorialItem[];
  totalRegistros: number;
  montoTotal?: number;
  numeroPagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export const cotizacionesService = {
  crear: async (payload: RegistrarCotizacionPayload): Promise<ResultadoCotizacion> => {
    const response = await api.post<ApiResponse<ResultadoCotizacion>>('/cotizaciones', payload);
    return response.data;
  },

  listar: async (
    pagina: number = 1,
    tamanoPagina: number = 15,
    idEstado?: number,
    fechaDesde?: string,
    fechaHasta?: string,
    q?: string
  ): Promise<PagedCotizacionesResponse> => {
    const params = new URLSearchParams();
    params.append('pagina', pagina.toString());
    params.append('tamanoPagina', tamanoPagina.toString());
    if (idEstado !== undefined && idEstado !== null) params.append('idEstado', idEstado.toString());
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (q && q.trim()) params.append('q', q.trim());

    const response = await api.get<ApiResponse<any>>(`/cotizaciones?${params.toString()}`);
    const data = response.data || {};
    const items = data.items || [];
    const totalRegistros = data.totalRegistros ?? items.length;
    const totalPaginas = data.totalPaginas ?? Math.ceil(totalRegistros / tamanoPagina) ?? 1;

    return {
      items,
      totalRegistros,
      montoTotal: Number(data.montoTotal ?? 0),
      numeroPagina: data.numeroPagina ?? pagina,
      tamanoPagina: data.tamanoPagina ?? tamanoPagina,
      totalPaginas: Math.max(1, totalPaginas),
    };
  },

  obtenerPorId: async (id: number): Promise<CotizacionCompleta> => {
    const response = await api.get<ApiResponse<CotizacionCompleta>>(`/cotizaciones/${id}`);
    return response.data;
  },

  convertirAVenta: async (idCotizacion: number, idVenta: number): Promise<boolean> => {
    const response = await api.put<ApiResponse<boolean>>(`/cotizaciones/${idCotizacion}/convertir`, {
      idVenta,
    });
    return response.data;
  },
};

export default cotizacionesService;
