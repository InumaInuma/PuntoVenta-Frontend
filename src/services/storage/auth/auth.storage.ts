import type { UserProfile } from '@/services/auth/authTypes';

const TOKEN_KEY = 'almain_pos_token';
const USER_KEY = 'almain_pos_user';
const ROLE_KEY = 'almain_pos_role';

export const AuthStorage = {
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

  getUserProfile: (): UserProfile | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUserProfile: (profile: UserProfile): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Error guardando perfil en storage:', e);
    }
  },

  removeUserProfile: (): void => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error eliminando perfil:', e);
    }
  },

  getRole: (): string | null => {
    try {
      return localStorage.getItem(ROLE_KEY);
    } catch {
      return null;
    }
  },

  setRole: (role: string): void => {
    try {
      localStorage.setItem(ROLE_KEY, role);
    } catch (e) {
      console.error('Error guardando rol:', e);
    }
  },

  hasSession: (): boolean => {
    return !!AuthStorage.getToken() && !!AuthStorage.getUserProfile();
  },

  clearAuth: (): void => {
    AuthStorage.removeToken();
    AuthStorage.removeUserProfile();
    localStorage.removeItem(ROLE_KEY);
  },
};
