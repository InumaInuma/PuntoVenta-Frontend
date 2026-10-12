import api from '../api';
import type { Producto } from '@/types';
import type { ApiResponse } from '../auth/authTypes';

export interface PagedProductosResponse {
  items: Producto[];
  totalRegistros: number;
  numeroPagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  tienePaginaSiguiente: boolean;
  tienePaginaAnterior: boolean;
}

export const productosService = {
  getPaged: async (
    idCategoria?: number,
    q?: string,
    pagina: number = 1,
    tamanoPagina: number = 10
  ): Promise<PagedProductosResponse> => {
    const params = new URLSearchParams();
    if (idCategoria) params.append('idCategoria', idCategoria.toString());
    if (q) params.append('q', q);
    params.append('pagina', pagina.toString());
    params.append('tamanoPagina', tamanoPagina.toString());

    const url = `/productos?${params.toString()}`;
    const response = await api.get<ApiResponse<any>>(url);
    const data = response.data || {};
    const rawItems = Array.isArray(data) ? data : data.items || [];

    const items: Producto[] = rawItems.map((p: any) => ({
      idProducto: p.idProducto || p.id || p.Id,
      idEmpresa: p.idEmpresa || p.tenantId || 1,
      idCategoria: p.idCategoria || p.IdCategoria,
      nombreCategoria: p.nombreCategoria || p.categoriaNombre || p.CategoriaNombre,
      codigoBarras: p.codigoBarras || p.CodigoBarras || '',
      nombre: p.nombre || p.Nombre,
      descripcion: p.descripcion || p.Descripcion,
      unidadMedida: p.unidadMedida || p.unidadMedidaCodigo || p.UnidadMedidaCodigo || 'UND',
      precioVenta: p.precioVenta || p.PrecioVenta || 0,
      precioCosto: p.precioCosto || p.PrecioCosto || 0,
      stockActual: p.stockActual !== undefined ? p.stockActual : (p.StockActual !== undefined ? p.StockActual : 0),
      stockMinimo: p.stockMinimo !== undefined ? p.stockMinimo : 1,
      permiteDecimales: !!(p.permiteDecimales || p.PermiteDecimales),
      activo: p.activo !== undefined ? p.activo : (p.Activo !== undefined ? p.Activo : true),
    }));

    return {
      items,
      totalRegistros: data.totalRegistros !== undefined ? data.totalRegistros : items.length,
      numeroPagina: data.numeroPagina || pagina,
      tamanoPagina: data.tamanoPagina || tamanoPagina,
      totalPaginas: data.totalPaginas !== undefined ? data.totalPaginas : Math.ceil(items.length / tamanoPagina),
      tienePaginaSiguiente: !!data.tienePaginaSiguiente,
      tienePaginaAnterior: !!data.tienePaginaAnterior,
    };
  },

  getAll: async (idCategoria?: number, q?: string): Promise<Producto[]> => {
    const paged = await productosService.getPaged(idCategoria, q, 1, 100);
    return paged.items;
  },

  getByCodigo: async (codigoBarras: string): Promise<Producto> => {
    const response = await api.get<ApiResponse<any>>(`/productos/barcode/${encodeURIComponent(codigoBarras)}`);
    const p = response.data;
    if (!p) return null as any;
    return {
      idProducto: p.idProducto || p.id || p.Id,
      idEmpresa: p.idEmpresa || p.tenantId || 1,
      idCategoria: p.idCategoria || p.IdCategoria,
      nombreCategoria: p.nombreCategoria || p.categoriaNombre || p.CategoriaNombre,
      codigoBarras: p.codigoBarras || p.CodigoBarras || '',
      nombre: p.nombre || p.Nombre,
      descripcion: p.descripcion || p.Descripcion,
      unidadMedida: p.unidadMedida || p.unidadMedidaCodigo || p.UnidadMedidaCodigo || 'UND',
      precioVenta: p.precioVenta || p.PrecioVenta || 0,
      precioCosto: p.precioCosto || p.PrecioCosto || 0,
      stockActual: p.stockActual !== undefined ? p.stockActual : (p.StockActual !== undefined ? p.StockActual : 0),
      stockMinimo: p.stockMinimo !== undefined ? p.stockMinimo : 1,
      permiteDecimales: !!(p.permiteDecimales || p.PermiteDecimales),
      activo: p.activo !== undefined ? p.activo : (p.Activo !== undefined ? p.Activo : true),
    };
  },

  generarCodigo: async (): Promise<string> => {
    const response = await api.get<ApiResponse<string>>('/productos/generar-codigo');
    return response.data;
  },

  getById: async (id: number): Promise<Producto> => {
    const response = await api.get<ApiResponse<any>>(`/productos/${id}`);
    const p = response.data;
    return {
      idProducto: p.idProducto || p.id || p.Id,
      idEmpresa: p.idEmpresa || p.tenantId || 1,
      idCategoria: p.idCategoria || p.IdCategoria,
      nombreCategoria: p.nombreCategoria || p.categoriaNombre || p.CategoriaNombre,
      codigoBarras: p.codigoBarras || p.CodigoBarras || '',
      nombre: p.nombre || p.Nombre,
      descripcion: p.descripcion || p.Descripcion,
      unidadMedida: p.unidadMedida || p.unidadMedidaCodigo || p.UnidadMedidaCodigo || 'UND',
      precioVenta: p.precioVenta || p.PrecioVenta || 0,
      precioCosto: p.precioCosto || p.PrecioCosto || 0,
      stockActual: p.stockActual !== undefined ? p.stockActual : (p.StockActual !== undefined ? p.StockActual : 0),
      stockMinimo: p.stockMinimo !== undefined ? p.stockMinimo : 1,
      permiteDecimales: !!(p.permiteDecimales || p.PermiteDecimales),
      activo: p.activo !== undefined ? p.activo : (p.Activo !== undefined ? p.Activo : true),
    };
  },

  create: async (data: Partial<Producto>): Promise<number> => {
    const payload = {
      idCategoria: data.idCategoria,
      idUnidadMedida:
        data.unidadMedida === 'KG'
          ? 2
          : data.unidadMedida === 'LITRO'
          ? 3
          : data.unidadMedida === 'METRO'
          ? 4
          : 1,
      codigoBarras: data.codigoBarras || '',
      nombre: data.nombre?.trim(),
      descripcion: data.descripcion || '',
      precioVenta: data.precioVenta,
      precioCosto: data.precioCosto || 0,
      stockInicial: data.stockActual || 0,
      stockMinimo: data.stockMinimo || 1,
      permiteDecimales: !!data.permiteDecimales,
      generaCodigoPropio: false,
    };
    const response = await api.post<ApiResponse<number>>('/productos', payload);
    return response.data;
  },

  update: async (id: number, data: Partial<Producto>): Promise<void> => {
    const payload = {
      idCategoria: data.idCategoria,
      idUnidadMedida:
        data.unidadMedida === 'KG'
          ? 2
          : data.unidadMedida === 'LITRO'
          ? 3
          : data.unidadMedida === 'METRO'
          ? 4
          : 1,
      codigoBarras: data.codigoBarras || '',
      nombre: data.nombre?.trim(),
      descripcion: data.descripcion || '',
      precioVenta: data.precioVenta,
      precioCosto: data.precioCosto || 0,
      stockMinimo: data.stockMinimo || 1,
      permiteDecimales: !!data.permiteDecimales,
      activo: data.activo !== undefined ? data.activo : true,
    };
    await api.put<ApiResponse<void>>(`/productos/${id}`, payload);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/productos/${id}`);
  },
};

export default productosService;
