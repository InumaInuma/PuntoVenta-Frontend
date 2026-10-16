import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/services/auth/authService';
import type { LoginData } from '@/services/auth/authTypes';
import { PosStorage } from '@/services/storage';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Store, User, Lock, KeyRound, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados para forzar cambio de contraseña en primer login
  const [isMustChangeModalOpen, setIsMustChangeModalOpen] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<LoginData | null>(null);
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Cargar último usuario recordado en este smartphone/dispositivo
  useEffect(() => {
    const last = PosStorage.getLastCashier();
    if (last?.login) {
      setUsuario(last.login);
    }
  }, []);

  const completeLogin = (data: LoginData) => {
    login(data.token, {
      idUsuario: data.idUsuario,
      tenantId: data.tenantId,
      username: data.username,
      nombreCompleto: data.nombreCompleto,
      rol: data.rol,
      debeCambiarPassword: false,
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
  };

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

      // Si el usuario es nuevo y el sistema requiere que establezca su nueva contraseña
      if (data.debeCambiarPassword) {
        setPendingLoginData(data);
        setIsMustChangeModalOpen(true);
        toast('Primer inicio detectado: debes definir tu nueva contraseña personal.', {
          icon: '🔒',
          duration: 4500,
        });
        return;
      }

      completeLogin(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarPasswordPrimerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPassword.trim() || !confirmarPassword.trim()) {
      toast.error('Completa ambos campos de contraseña');
      return;
    }

    if (nuevoPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (nuevoPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await AuthService.cambiarPassword({
        nuevoPassword: nuevoPassword.trim(),
        confirmarPassword: confirmarPassword.trim(),
      });

      toast.success('¡Contraseña configurada con éxito!');
      setIsMustChangeModalOpen(false);

      if (pendingLoginData) {
        completeLogin(pendingLoginData);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al establecer la contraseña';
      toast.error(errorMsg);
    } finally {
      setIsSubmittingPassword(false);
    }
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
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] font-semibold text-slate-400 mt-6">
          Almain Retail SaaS • Multi-tenant Automático
        </p>
      </div>

      {/* Modal Primer Login - Establecer Nueva Contraseña */}
      <Modal
        isOpen={isMustChangeModalOpen}
        onClose={() => {}} // Bloqueado para obligar a cambiarla
        title="Crear Nueva Contraseña"
        position="center"
        maxWidth="max-w-md"
      >
        <div className="p-1 space-y-4 text-slate-800">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Bienvenido, {pendingLoginData?.nombreCompleto || 'Usuario'}
              </h4>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                Por seguridad en tu primer acceso, debes definir tu propia contraseña personal. 
                Recuérdala bien para tus futuros inicios de sesión.
              </p>
            </div>
          </div>

          <form onSubmit={handleCambiarPasswordPrimerLogin} className="space-y-3.5">
            <Input
              label="Nueva Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              icon={<KeyRound className="w-5 h-5 text-slate-400" />}
              value={nuevoPassword}
              onChange={(e) => setNuevoPassword(e.target.value)}
              required
            />

            <Input
              label="Confirmar Nueva Contraseña"
              type="password"
              placeholder="Repite la nueva contraseña"
              icon={<Lock className="w-5 h-5 text-slate-400" />}
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmittingPassword}
              className="mt-2 bg-red-600 hover:bg-red-700 shadow-red-600/30"
            >
              ESTABLECER CONTRASEÑA Y ENTRAR
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
