// Tipos y Modelos de Dominio Almain POS

export interface UsuarioSession {
  idUsuario: number;
  tenantId?: number | null;
  username: string;
  nombreCompleto: string;
  rol: string;
  debeCambiarPassword?: boolean;
  tenantNombreComercial?: string;
  monedaSimbolo?: string;
  monedaCodigo?: string;
  // Compatibilidad legacy
  nombre?: string;
  nombreEmpresa?: string;
  nombreSucursal?: string;
  idEmpresa?: number;
  idSucursal?: number;
}

export interface LoginResponse {
  token: string;
  idUsuario: number;
  tenantId?: number | null;
  username: string;
  nombreCompleto: string;
  rol: string;
  debeCambiarPassword?: boolean;
  tenantNombreComercial?: string;
  monedaSimbolo?: string;
  monedaCodigo?: string;
}

export interface Categoria {
  idCategoria: number;
  idEmpresa: number;
  nombre: string;
  icono?: string;
  color?: string;
  orden?: number;
  activo: boolean;
}

export interface Producto {
  idProducto: number;
  idEmpresa: number;
  idCategoria: number;
  nombreCategoria?: string;
  codigoBarras?: string;
  codigoInterno?: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: string; // UNIDAD, KG, LITRO, METRO
  precioVenta: number;
  precioCosto?: number;
  stockActual: number;
  stockMinimo?: number;
  permiteDecimales: boolean;
  imagenUrl?: string;
  activo: boolean;
}

export interface MetodoPago {
  id?: number;
  idMetodoPago: number;
  codigo: string; // EFECTIVO, YAPE, PLIN, TARJETA, FIADO, TRANSFERENCIA, BILLETERA
  codigoMetodo?: string;
  nombre: string;
  nombreMostrado?: string;
  icono?: string;
  requiereReferencia?: boolean;
  requiereComprobanteRef?: boolean;
  imagenQRUrl?: string | null;
  numeroTitular?: string | null;
  nombreTitular?: string | null;
  ordenVisual?: number;
  activo: boolean;
}

export interface Cliente {
  idCliente: number;
  idEmpresa: number;
  nombreCompleto: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  telefono?: string;
  direccion?: string;
  limiteCredito: number;
  saldoDeudor: number;
  activo: boolean;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
}

export interface TurnoCaja {
  idTurnoCaja: number;
  idCaja: number;
  idUsuario: number;
  idSucursal: number;
  nombreCaja?: string;
  nombreUsuario?: string;
  montoApertura: number;
  fechaApertura: string;
  montoCierre?: number;
  montoSistemaEfectivo?: number;
  diferencia?: number;
  fechaCierre?: string;
  estado: string; // ABIERTO, CERRADO
  observaciones?: string;
}

export interface MovimientoCaja {
  idMovimientoCaja?: number;
  idTurnoCaja: number;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  fecha?: string;
  idUsuario?: number;
}

export interface DetalleVentaItem {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  nombreProducto?: string;
}

export interface PagoVentaItem {
  idMetodoPago: number;
  monto: number;
  referenciaOperacion?: string;
}

export interface RegistrarVentaPayload {
  idEmpresa: number;
  idSucursal: number;
  idTurnoCaja: number;
  idUsuario: number;
  idCliente?: number | null;
  tipoComprobante: string; // NOTA_VENTA, BOLETA, FACTURA
  serie?: string;
  numero?: string;
  subtotal: number;
  impuesto: number;
  total: number;
  vuelto: number;
  detalles: DetalleVentaItem[];
  pagos: PagoVentaItem[];
}

export interface VentaHistorialItem {
  id?: number;
  idVenta: number;
  codigoVenta: string;
  numeroComprobante?: string;
  fechaVenta: string;
  clienteNombre?: string;
  tipoComprobante?: string;
  comprobanteTipoNombre?: string;
  tipoVentaNombre?: string;
  estadoVentaNombre?: string;
  cajeroNombre?: string;
  subtotal?: number;
  descuento?: number;
  totalVenta?: number;
  total: number;
  montoEfectivoRecibido?: number;
  vueltoEntregado?: number;
  estado?: string;
  metodosPagoResumen?: string;
  itemsCantidad?: number;
}

export interface CuentaPorCobrar {
  idCuentaPorCobrar: number;
  idVenta: number;
  idCliente: number;
  nombreCliente?: string;
  montoTotal: number;
  montoPagado: number;
  montoPendiente: number;
  estado: string; // PENDIENTE, PARCIAL, CANCELADO
  fechaEmision: string;
  fechaVencimiento?: string;
}
