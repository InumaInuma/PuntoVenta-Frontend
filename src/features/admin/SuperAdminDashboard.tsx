import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  ShieldCheck,
  Plus,
  Search,
  Phone,
  Store,
  LogOut,
  ExternalLink,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TenantDemoItem {
  id: number;
  nombreComercial: string;
  razonSocial: string;
  ruc: string;
  plan: string;
  precioMensual: number;
  estado: 'ACTIVO' | 'EN_PRUEBA' | 'VENCIDO' | 'SUSPENDIDO';
  diasRestantes: number;
  telefono: string;
  correo: string;
  totalVentasMes: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<'TODOS' | 'ACTIVO' | 'EN_PRUEBA' | 'VENCIDO'>('TODOS');
  const [isNewTenantModal, setIsNewTenantModal] = useState(false);

  // Lista de comercios de la plataforma SaaS (con Bodega Don Pepe del seed y ejemplos)
  const [tenants, setTenants] = useState<TenantDemoItem[]>([
    {
      id: 1,
      nombreComercial: 'Bodega Don Pepe',
      razonSocial: 'Comercial Don Pepe S.A.C.',
      ruc: '20601234567',
      plan: 'Minimarket Pro',
      precioMensual: 89,
      estado: 'ACTIVO',
      diasRestantes: 28,
      telefono: '987654321',
      correo: 'donpepe@gmail.com',
      totalVentasMes: 12450.5,
    },
    {
      id: 2,
      nombreComercial: 'Minimarket San Jorge',
      razonSocial: 'Inversiones San Jorge E.I.R.L.',
      ruc: '20609876543',
      plan: 'Minimarket Pro',
      precioMensual: 89,
      estado: 'ACTIVO',
      diasRestantes: 19,
      telefono: '991234567',
      correo: 'sanjorge@comercio.pe',
      totalVentasMes: 18900.0,
    },
    {
      id: 3,
      nombreComercial: 'Farmacia & Botica Santa Rosa',
      razonSocial: 'Botica Santa Rosa S.A.C.',
      ruc: '20551122334',
      plan: 'Plan Cadena',
      precioMensual: 149,
      estado: 'ACTIVO',
      diasRestantes: 12,
      telefono: '984556677',
      correo: 'administracion@santarosa.pe',
      totalVentasMes: 24300.0,
    },
    {
      id: 4,
      nombreComercial: 'Panadería & Pastelería La Espiga',
      razonSocial: 'La Espiga Panificadora S.R.L.',
      ruc: '10456789012',
      plan: 'Plan Básico',
      precioMensual: 49,
      estado: 'EN_PRUEBA',
      diasRestantes: 5,
      telefono: '976543210',
      correo: 'contacto@laespiga.com',
      totalVentasMes: 4320.0,
    },
    {
      id: 5,
      nombreComercial: 'Licorería & Market El Barril',
      razonSocial: 'Inversiones El Barril S.A.C.',
      ruc: '20778899001',
      plan: 'Minimarket Pro',
      precioMensual: 89,
      estado: 'VENCIDO',
      diasRestantes: 0,
      telefono: '965432198',
      correo: 'elbarril@gmail.com',
      totalVentasMes: 8750.0,
    },
  ]);

  // Formulario nuevo comercio
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [rucNuevo, setRucNuevo] = useState('');
  const [telefonoNuevo, setTelefonoNuevo] = useState('');
  const [planNuevo, setPlanNuevo] = useState('Minimarket Pro');

  const handleCrearTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo.trim() || !rucNuevo.trim()) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    const nuevo: TenantDemoItem = {
      id: tenants.length + 1,
      nombreComercial: nombreNuevo.trim(),
      razonSocial: nombreNuevo.trim() + ' S.A.C.',
      ruc: rucNuevo.trim(),
      plan: planNuevo,
      precioMensual: planNuevo === 'Plan Cadena' ? 149 : planNuevo === 'Minimarket Pro' ? 89 : 49,
      estado: 'ACTIVO',
      diasRestantes: 30,
      telefono: telefonoNuevo.trim() || '999888777',
      correo: 'contacto@' + nombreNuevo.toLowerCase().replace(/\s+/g, '') + '.com',
      totalVentasMes: 0,
    };

    setTenants([nuevo, ...tenants]);
    toast.success(`¡Negocio "${nuevo.nombreComercial}" registrado en la plataforma!`);
    setIsNewTenantModal(false);
    setNombreNuevo('');
    setRucNuevo('');
    setTelefonoNuevo('');
  };

  const handleToggleEstado = (id: number) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nuevoEstado = t.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
          toast.success(`Estado de ${t.nombreComercial} cambiado a ${nuevoEstado}`);
          return { ...t, estado: nuevoEstado };
        }
        return t;
      })
    );
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleSimularPOS = (tenant: TenantDemoItem) => {
    toast.success(`Entrando a vista POS de ${tenant.nombreComercial}`);
    navigate(ROUTES.POS);
  };

  // Métricas de Plataforma
  const totalNegocios = tenants.length;
  const activos = tenants.filter((t) => t.estado === 'ACTIVO').length;
  const mrr = tenants.reduce((acc, t) => (t.estado === 'ACTIVO' ? acc + t.precioMensual : acc), 0);

  const filteredTenants = tenants.filter((t) => {
    const matchEstado = filterEstado === 'TODOS' || t.estado === filterEstado;
    const matchSearch =
      !search.trim() ||
      t.nombreComercial.toLowerCase().includes(search.toLowerCase()) ||
      t.ruc.includes(search) ||
      t.telefono.includes(search);
    return matchEstado && matchSearch;
  });

  return (
    <div className="min-h-[100dvh] bg-slate-900 text-slate-100 flex flex-col safe-top safe-bottom">
      {/* Top Header Super Admin */}
      <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">
                Almain SaaS Platform
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-semibold">
              Control global de suscripciones y comercios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(ROUTES.POS)}
            className="h-9 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Ir al POS"
          >
            <Store className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Ver POS</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-rose-950 text-rose-400 flex items-center justify-center transition-all cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4">
        {/* Banner de Bienvenida */}
        <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/40 border border-indigo-700/50 rounded-3xl p-4.5 flex items-center justify-between gap-3 shadow-xl">
          <div>
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
              Bienvenido, {user?.nombreCompleto || 'Super Administrador'}
            </span>
            <h2 className="text-lg font-black text-white mt-0.5">
              Panel de Gestión de Negocios
            </h2>
            <p className="text-xs text-zinc-300 mt-1 max-w-md">
              Supervisa el estado de todas las bodegas, farmacias y minimarkets suscritos a la plataforma.
            </p>
          </div>
          <button
            onClick={() => setIsNewTenantModal(true)}
            className="h-11 px-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-2 shrink-0 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>NUEVO NEGOCIO</span>
          </button>
        </div>

        {/* KPIs Métricas Globales */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              Total Comercios
            </span>
            <p className="text-2xl font-black text-white mt-1">
              {totalNegocios}
            </p>
            <span className="text-[10px] font-bold text-emerald-400 block mt-0.5">
              {activos} activos
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              MRR Recurrente
            </span>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              S/ {mrr}
            </p>
            <span className="text-[10px] font-semibold text-zinc-400 block mt-0.5">
              Facturación mes
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              Vencidos / Mora
            </span>
            <p className="text-2xl font-black text-rose-400 mt-1">
              {tenants.filter((t) => t.estado === 'VENCIDO').length}
            </p>
            <span className="text-[10px] font-semibold text-rose-400/80 block mt-0.5">
              Requieren cobro
            </span>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUC o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
            {(['TODOS', 'ACTIVO', 'EN_PRUEBA', 'VENCIDO'] as const).map((est) => (
              <button
                key={est}
                onClick={() => setFilterEstado(est)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all ${
                  filterEstado === est
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {est.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Negocios (Tenants) */}
        <div className="space-y-3 pb-8">
          {filteredTenants.map((t) => {
            const estadoBadge = {
              ACTIVO: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
              EN_PRUEBA: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
              VENCIDO: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
              SUSPENDIDO: 'bg-zinc-700 text-zinc-300 border-zinc-600',
            }[t.estado];

            return (
              <div
                key={t.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-4 transition-all shadow-sm space-y-3"
              >
                {/* Cabecera del Tenant */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 font-black text-base shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-white">
                          {t.nombreComercial}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${estadoBadge}`}
                        >
                          {t.estado.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-zinc-400 mt-0.5">
                        RUC: {t.ruc} • {t.razonSocial}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-400">
                      S/ {t.precioMensual}/mes
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-semibold">
                      {t.plan}
                    </span>
                  </div>
                </div>

                {/* Detalles y Métricas de la Tienda */}
                <div className="bg-zinc-950/60 rounded-2xl p-2.5 grid grid-cols-3 gap-2 text-center text-xs border border-zinc-800/80">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block">
                      Días Restantes
                    </span>
                    <span
                      className={`font-black ${
                        t.diasRestantes <= 5 ? 'text-rose-400' : 'text-zinc-200'
                      }`}
                    >
                      {t.diasRestantes} días
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block">
                      WhatsApp
                    </span>
                    <a
                      href={`https://wa.me/51${t.telefono}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {t.telefono}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block">
                      Ventas Mes
                    </span>
                    <span className="font-black text-zinc-200">
                      S/ {t.totalVentasMes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Acciones de Super Admin para este Comercio */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                  <button
                    onClick={() => handleToggleEstado(t.id)}
                    className="h-8 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {t.estado === 'ACTIVO' ? (
                      <>
                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                        <span>Suspender</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reactivar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSimularPOS(t)}
                    className="h-8 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/25"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver Tienda / POS</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal Registrar Nuevo Comercio */}
      <Modal
        isOpen={isNewTenantModal}
        onClose={() => setIsNewTenantModal(false)}
        title="Registrar Nuevo Negocio / Tenant"
        position="center"
      >
        <form onSubmit={handleCrearTenant} className="space-y-3 text-slate-800">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Nombre Comercial</label>
            <input
              type="text"
              placeholder="ej: Minimarket Los Laureles"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">RUC o DNI</label>
              <input
                type="text"
                placeholder="20601234567"
                value={rucNuevo}
                onChange={(e) => setRucNuevo(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none font-semibold"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Teléfono WhatsApp</label>
              <input
                type="tel"
                placeholder="987654321"
                value={telefonoNuevo}
                onChange={(e) => setTelefonoNuevo(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Plan SaaS</label>
            <select
              value={planNuevo}
              onChange={(e) => setPlanNuevo(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs mt-1 outline-none font-bold"
            >
              <option value="Plan Básico">Plan Básico (S/ 49 / mes)</option>
              <option value="Minimarket Pro">Minimarket Pro (S/ 89 / mes)</option>
              <option value="Plan Cadena">Plan Cadena (S/ 149 / mes)</option>
            </select>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
            >
              REGISTRAR NEGOCIO
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
