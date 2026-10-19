// Tipos de Autenticación y Respuestas Base (Estándar People)

export interface ApiResponse<T = unknown> {
  isSuccess: boolean;
  message: string;
  data: T;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginData {
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
  zonaHorariaWindows?: string;
  zonaHorariaIana?: string;
  estadoSuscripcion?: string;
  fechaVencimientoSuscripcion?: string;
}

export interface UserProfile extends Omit<LoginData, 'token'> {
  nombreEmpresa?: string;
  nombre?: string;
  idEmpresa?: number;
  idSucursal?: number;
  nombreSucursal?: string;
}

export type LoginResponse = ApiResponse<LoginData>;

export interface RegisterTenantRequest {
  idPais?: number;
  idTipoDocumento?: number;
  nombreComercial: string;
  razonSocial?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefonoWhatsApp: string;
  correoContacto?: string;
  direccion?: string;
  idPlanSaaS: number;
  diasDuracionPlan?: number;
  montoPagado?: number;
  metodoPago?: string;
  numeroOperacion?: string;
  nombreCompletoUsuario: string;
  username: string;
  passwordProvisorio: string;
}

export interface RegisterTenantResponseData {
  tenantId: number;
  usuarioId: number;
  nombreComercial: string;
  username: string;
  mensaje: string;
}

export type RegisterTenantResponse = ApiResponse<RegisterTenantResponseData>;

export interface EstadoTenant {
  id: number;
  codigo: string;
  nombre: string;
  colorHex: string;
  activo?: boolean;
}

export interface TenantListItem {
  id: number;
  nombreComercial: string;
  razonSocial: string;
  tipoDocumento: string;
  ruc: string;
  telefono: string;
  correo: string;
  direccion: string;
  idEstadoTenant: number;
  estadoCodigo: string;
  estadoNombre: string;
  estadoColorHex?: string;
  planNombre: string;
  precioMensual: number;
  fechaInicio?: string;
  fechaVencimiento?: string;
  diasRestantes: number;
  totalVentasMes: number;
}

export type ListarTenantsResponse = ApiResponse<TenantListItem[]>;
export type ListarEstadosTenantResponse = ApiResponse<EstadoTenant[]>;


