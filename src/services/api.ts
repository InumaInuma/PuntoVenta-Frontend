import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { AuthStorage } from './storage';

interface CustomAxiosInstance extends AxiosInstance {
  get<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  post<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  put<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  patch<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  delete<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
}

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = isLocal
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5249/api')
  : (import.meta.env.VITE_API_URL || '/api');

// Base API
const api = axios.create({
  baseURL: API_URL,
  headers: {},
  withCredentials: true,
}) as CustomAxiosInstance;

// Interceptor para solicitudes
api.interceptors.request.use(
  (config) => {
    // Si hay token JWT en AuthStorage, lo enviamos en la cabecera Authorization
    const token = AuthStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Cabecera personalizada para prevenir CSRF
    if (config.headers) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar expiración de token (401)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      AuthStorage.clearAuth();
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      if (currentPath && currentPath !== '/login' && currentPath !== '/') {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      } else {
        window.location.href = '/login';
      }
    } else if (error.response?.status >= 500) {
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'UNKNOWN URL';

      let extraDetails = '';
      const responseData = error.response?.data;
      if (responseData) {
        if (typeof responseData === 'string') {
          extraDetails += `\n*Respuesta:* ${responseData.substring(0, 300)}`;
        } else if (responseData.message) {
          extraDetails += `\n*Mensaje:* ${responseData.message}`;
        } else {
          extraDetails += `\n*Detalles:* \`\`\`json\n${JSON.stringify(responseData, null, 2)}\n\`\`\``;
        }
      }

      const reqData = error.config?.data;
      if (reqData) {
        extraDetails += `\n*Payload:* \`\`\`json\n${typeof reqData === 'string' ? reqData : JSON.stringify(reqData, null, 2)}\n\`\`\``;
      }

      console.error(`FALLO EN BACKEND (API 500+) en ${method} ${url}`, extraDetails);
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
