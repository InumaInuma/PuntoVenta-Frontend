import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TopHeader } from '@/components/navigation/TopHeader';
import { FloatingBottomDock } from '@/components/navigation/FloatingBottomDock';
import { DarkDrawer } from '@/components/navigation/DarkDrawer';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { signalRService } from '@/services/signalrService';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/config/routes';
import { Lock, LogOut, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface MobileAppLayoutProps {
  onOpenCartSheet?: () => void;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({ onOpenCartSheet }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [suspensionState, setSuspensionState] = useState<{
    suspendido: boolean;
    motivo: string;
    estadoNombre: string;
  } | null>(null);

  // Iniciar conexión SignalR y escuchar cambios de estado de este tenant en tiempo real
  useEffect(() => {
    signalRService.start();

    const unsub = signalRService.onTenantEstadoCambiado((notif) => {
      // Verificar si la notificación corresponde al comercio actual
      if (user?.tenantId && notif.tenantId === user.tenantId) {
        if (notif.idEstadoTenant === 2 || notif.idEstadoTenant === 3) {
          // 2 = SUSPENDIDO (No pagó), 3 = VENCIDO
          setSuspensionState({
            suspendido: true,
            motivo:
              notif.mensaje ||
              (notif.idEstadoTenant === 2
                ? 'Tu cuenta ha sido suspendida temporalmente por falta de pago.'
                : 'Tu plan de suscripción ha vencido. Por favor regulariza tu pago.'),
            estadoNombre: notif.estadoNombre,
          });
          toast.error(`Atención: ${notif.estadoNombre}. El servicio se encuentra suspendido.`, {
            duration: 8000,
          });
        } else if (notif.idEstadoTenant === 1) {
          // 1 = ACTIVO (Pagó / Reactivado)
          setSuspensionState(null);
          toast.success(
            '¡Pago registrado! Tu comercio ha sido reactivado en tiempo real. Puedes continuar con tus ventas.',
            {
              duration: 8000,
              icon: '🎉',
            }
          );
        }
      }
    });

    return () => {
      unsub();
    };
  }, [user?.tenantId]);

  return (
    <div className="min-h-[100dvh] bg-slate-100 flex flex-col lg:flex-row">
      {/* 1. SIDEBAR EXCLUSIVO PARA PC Y TABLETS GRANDES (>= 1024px) */}
      <DesktopSidebar />

      {/* 2. ÁREA PRINCIPAL ADAPTATIVA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh] relative">
        <div className="w-full max-w-md mx-auto lg:max-w-none flex flex-col flex-1 min-h-[100dvh]">
          {/* Top Header */}
          <TopHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

          {/* Main Viewport Content */}
          <main className="flex-1 pb-24 lg:pb-8 px-4 lg:px-6 py-4 overflow-x-hidden">
            <Outlet />
          </main>

          {/* Floating Bottom Dock (Exclusivo para móviles, en PC se usa el Sidebar) */}
          <div className="block lg:hidden">
            <FloatingBottomDock
              onOpenDrawer={() => setIsDrawerOpen(true)}
              onOpenCartSheet={onOpenCartSheet}
            />
          </div>

          {/* Dark Sidebar Drawer (Menú deslizante para móviles) */}
          <DarkDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
          />
        </div>
      </div>

      {/* OVERLAY DE BLOQUEO EN TIEMPO REAL POR FALTA DE PAGO (SIGNALR) */}
      {suspensionState?.suspendido && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-200 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 uppercase tracking-wider inline-block">
                {suspensionState.estadoNombre || 'Cuenta Suspendida'}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                Acceso Pausado por Falta de Pago
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {suspensionState.motivo}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-left">
              <p className="text-[11px] font-semibold text-amber-900">
                💡 <strong>¿Ya realizaste tu pago?</strong><br />
                En cuanto el SuperAdmin confirme tu abono por Yape o transferencia, esta pantalla se desbloqueará <strong>automáticamente en tiempo real</strong> vía SignalR sin que tengas que recargar la página.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="https://wa.me/51987654321?text=Hola,%20acabo%20de%20realizar%20el%20pago%20de%20mi%20suscripción%20en%20Almain%20POS,%20por%20favor%20reactivar%20mi%20cuenta."
                target="_blank"
                rel="noreferrer"
                className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>CONTACTAR SOPORTE / ENVIAR COMPROBANTE</span>
              </a>

              <button
                onClick={() => {
                  logout();
                  navigate(ROUTES.LOGIN);
                }}
                className="w-full h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAppLayout;
