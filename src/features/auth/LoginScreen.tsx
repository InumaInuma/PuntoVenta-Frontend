import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/services/auth/authService';
import { PosStorage } from '@/services/storage';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Store, User, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar último usuario recordado en este smartphone/dispositivo
  useEffect(() => {
    const last = PosStorage.getLastCashier();
    if (last?.login) {
      setUsuario(last.login);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      toast.error('Ingresa tu usuario y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.login({
        usernameOrEmail: usuario.trim(),
        password: password.trim(),
      });

      const data = response.data;
      PosStorage.setLastCashier({ login: usuario.trim() });

      // Actualizar estado del contexto
      login(data.token, {
        idUsuario: data.idUsuario,
        tenantId: data.tenantId,
        username: data.username,
        nombreCompleto: data.nombreCompleto,
        rol: data.rol,
        debeCambiarPassword: data.debeCambiarPassword,
        tenantNombreComercial: data.tenantNombreComercial || (data.rol === 'SuperAdmin' ? 'Super Admin Platform' : 'Almain POS'),
        monedaSimbolo: data.monedaSimbolo || 'S/',
        monedaCodigo: data.monedaCodigo || 'PEN',
        nombre: data.nombreCompleto,
        nombreEmpresa: data.tenantNombreComercial || (data.rol === 'SuperAdmin' ? 'Super Admin Platform' : 'Almain POS'),
        idEmpresa: data.tenantId ?? 1,
        idSucursal: 1,
      });

      toast.success(`¡Bienvenido, ${data.nombreCompleto}!`);

      const isSuperAdmin = (data.rol || '').toUpperCase() === 'SUPERADMIN';
      if (isSuperAdmin) {
        navigate(ROUTES.ADMIN);
      } else {
        navigate(ROUTES.POS);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Botones de autocompletado rápido para pruebas
  const handleFillCredentials = (userToFill: string, passToFill: string) => {
    setUsuario(userToFill);
    setPassword(passToFill);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 bg-slate-100 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-500 text-white shadow-xl shadow-red-500/35 mb-3">
            <Store className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Almain POS
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Punto de Venta Móvil & Control de Negocio
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-slate-200/60 border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario o Correo"
              type="text"
              placeholder="ej: donpepe, cajero1 o admin"
              icon={<User className="w-5 h-5 text-slate-400" />}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5 text-slate-400" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-2"
            >
              INGRESAR A LA PLATAFORMA
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">
              Accesos Rápidos de Prueba
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleFillCredentials('donpepe', 'Admin123*')}
                className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 p-2 rounded-xl transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Dueño (Don Pepe)
              </button>
              <button
                type="button"
                onClick={() => handleFillCredentials('superadmin', 'Admin123*')}
                className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 p-2 rounded-xl transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Super Admin
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] font-semibold text-slate-400 mt-6">
          Almain Retail SaaS • Multi-tenant Automático
        </p>
      </div>
    </div>
  );
};
