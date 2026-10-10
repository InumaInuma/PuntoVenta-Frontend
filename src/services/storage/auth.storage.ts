import type { UsuarioSession } from '@/types';

const TOKEN_KEY = 'almain_pos_token';
const USER_KEY = 'almain_pos_user';

export const authStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Error guardando token en storage:', e);
    }
  },

  removeToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Error eliminando token:', e);
    }
  },

  getUser: (): UsuarioSession | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser: (user: UsuarioSession): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error guardando usuario en storage:', e);
    }
  },

  removeUser: (): void => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error eliminando usuario:', e);
    }
  },

  clearAuth: (): void => {
    authStorage.removeToken();
    authStorage.removeUser();
  },
};
