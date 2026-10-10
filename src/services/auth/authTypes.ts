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
