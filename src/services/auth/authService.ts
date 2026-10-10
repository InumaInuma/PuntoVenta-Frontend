import api from '../api';
import { AuthStorage } from '../storage';
import type { LoginData, LoginRequest, LoginResponse, UserProfile } from './authTypes';

export const AuthService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    if (!response.isSuccess) {
      throw new Error(response.message || 'Error al iniciar sesión');
    }
    const data: LoginData = response.data;

    const role = data.rol || (data as any)?.perfiles?.[0]?.nombre;
    const userProfile: UserProfile = {
      ...data,
      nombreEmpresa: data.tenantNombreComercial || (role === 'SuperAdmin' ? 'Super Admin Platform' : 'Almain POS'),
      nombre: data.nombreCompleto,
      idEmpresa: data.tenantId ?? 1,
      idSucursal: 1,
      nombreSucursal: 'Sucursal Principal',
    };
    delete (userProfile as any).token; // No guardamos el token en localStorage por seguridad

    // Guardar token en storage para cabecera Bearer y perfil
    if (data.token) {
      AuthStorage.setToken(data.token);
    }
    AuthStorage.setUserProfile(userProfile);
    if (role) AuthStorage.setRole(role);

    return response;
  },

  estaAutenticado: () => AuthStorage.hasSession(),

  getRole: () => AuthStorage.getRole(),
  setRole: (role: string) => AuthStorage.setRole(role),

  getUserProfile: () => AuthStorage.getUserProfile(),

  logout: () => {
    AuthStorage.clearAuth();
    window.location.href = '/login';
  },
};

export default AuthService;

