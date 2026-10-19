import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/services/auth/authService';
import type { LoginData } from '@/services/auth/authTypes';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { User, Lock, KeyRound, ShieldAlert } from 'lucide-react';
import { InstallPwaButton } from '@/components/common/InstallPwaButton';
import toast from 'react-hot-toast';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hasAutoLoadedCredentials, setHasAutoLoadedCredentials] = useState(false);

  // Estados para forzar cambio de contraseña en primer login
  const [isMustChangeModalOpen, setIsMustChangeModalOpen] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<LoginData | null>(null);
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Cargar credenciales desde URL si se enviaron por WhatsApp (ej: ?u=panaderiajonas&p=Almain123*)
  useEffect(() => {
    try {
      localStorage.removeItem('almain_pos_last_cashier');
    } catch { }

    const urlUser = searchParams.get('u') || searchParams.get('usuario') || searchParams.get('user');
    const urlPass = searchParams.get('p') || searchParams.get('password') || searchParams.get('pass');

    if (urlUser) {
      setUsuario(urlUser);
    }
    if (urlPass) {
      setPassword(urlPass);
    }
    if (urlUser || urlPass) {
      setHasAutoLoadedCredentials(true);
    }
  }, [searchParams]);

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

    setLoginError(null);
    setIsLoading(true);
    try {
      const response = await AuthService.login({
        usernameOrEmail: usuario.trim(),
        password: password.trim(),
      });

      const data = response.data;

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
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Usuario o contraseña incorrectos.');
      setLoginError(errorMsg);
      toast.error(errorMsg, { id: 'login-error', duration: 4000 });
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

    if (nuevoPassword.trim() === password.trim()) {
      toast.error('Por seguridad, la nueva contraseña debe ser diferente a tu contraseña actual de acceso');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await AuthService.cambiarPassword({
        passwordActual: password.trim(),
        nuevoPassword: nuevoPassword.trim(),
        confirmarPassword: confirmarPassword.trim(),
      });

      toast.success('¡Contraseña configurada con éxito!');
      setIsMustChangeModalOpen(false);

      if (pendingLoginData) {
        completeLogin({ ...pendingLoginData, debeCambiarPassword: false });
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || (err instanceof Error ? err.message : 'Error al establecer la contraseña');
      toast.error(errorMsg);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleCloseMustChangeModal = () => {
    setIsMustChangeModalOpen(false);
    setPendingLoginData(null);
    setNuevoPassword('');
    setConfirmarPassword('');
    setUsuario('');
    setPassword('');
    setLoginError(null);
    setHasAutoLoadedCredentials(false);
    try {
      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch { }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 bg-slate-100 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center mb-2.5">
            <img
              src="/icons/icon-192x192.png"
              alt="Almain POS"
              className="w-18 h-18 rounded-3xl shadow-lg shadow-slate-300/60 border-2 border-white object-cover"
            />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Almain POS
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Punto de Venta Móvil & Control de Negocio
          </p>
          <div className="mt-3 flex justify-center">
            <InstallPwaButton variant="login" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-slate-200/60 border border-slate-200/80">
          {hasAutoLoadedCredentials && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 flex items-center gap-2">
              <span className="text-base shrink-0">✨</span>
              <p className="leading-tight">
                Tus credenciales se han cargado automáticamente. Haz clic en <strong>"INGRESAR A LA PLATAFORMA"</strong>.
              </p>
            </div>
          )}

          {loginError && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-start gap-2.5 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Acceso Denegado</p>
                <p className="text-[11px] text-rose-700 leading-tight mt-0.5">{loginError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario"
              type="text"
              placeholder="Usuario"
              icon={<User className="w-5 h-5 text-slate-400" />}
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);
                if (loginError) setLoginError(null);
              }}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5 text-slate-400" />}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (loginError) setLoginError(null);
              }}
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
        onClose={handleCloseMustChangeModal}
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
                Debe ser de al menos 6 caracteres y diferente a la clave provisional que usaste para entrar.
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

            <button
              type="button"
              onClick={handleCloseMustChangeModal}
              className="w-full h-8 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
