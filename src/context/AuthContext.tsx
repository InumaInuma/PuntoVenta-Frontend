import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UsuarioSession, TurnoCaja } from '@/types';
import { AuthStorage } from '@/services/storage';
import { cajasService } from '@/services/backend/cajasService';

interface AuthContextType {
  user: UsuarioSession | null;
  token: string | null;
  turnoActivo: TurnoCaja | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UsuarioSession) => void;
  logout: () => void;
  verificarTurnoActivo: () => Promise<TurnoCaja | null>;
  setTurnoActivo: (turno: TurnoCaja | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UsuarioSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [turnoActivo, setTurnoActivo] = useState<TurnoCaja | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar sesión desde storage
  useEffect(() => {
    const savedToken = AuthStorage.getToken();
    const savedUser = AuthStorage.getUserProfile();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    } else {
      AuthStorage.clearAuth();
    }
    setIsLoading(false);
  }, []);

  const verificarTurnoActivo = useCallback(async (): Promise<TurnoCaja | null> => {
    const isSuperAdmin = (user?.rol || '').toUpperCase() === 'SUPERADMIN';
    if (!user || isSuperAdmin || !user.tenantId) {
      setTurnoActivo(null);
      return null;
    }

    try {
      const turno = await cajasService.getTurnoActivo();
      setTurnoActivo(turno);
      return turno;
    } catch {
      setTurnoActivo(null);
      return null;
    }
  }, [user]);

  // Verificar turno cuando el usuario pertenezca a un comercio y no sea SuperAdmin
  useEffect(() => {
    const isSuperAdmin = (user?.rol || '').toUpperCase() === 'SUPERADMIN';
    if (user && token && !isSuperAdmin && user.tenantId) {
      verificarTurnoActivo();
    }
  }, [user, token, verificarTurnoActivo]);

  const login = (newToken: string, newUser: UsuarioSession) => {
    setToken(newToken);
    setUser(newUser);
    AuthStorage.setToken(newToken);
    AuthStorage.setUserProfile(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setTurnoActivo(null);
    AuthStorage.clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        turnoActivo,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        verificarTurnoActivo,
        setTurnoActivo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
