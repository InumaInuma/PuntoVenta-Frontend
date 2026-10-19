import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/config/routes';
import { Plus, Store, Loader2 } from 'lucide-react';
import { useSuperAdmin } from './hooks/useSuperAdmin';
import { SuperAdminHeader } from './components/SuperAdminHeader';
import { SuperAdminKpis } from './components/SuperAdminKpis';
import { SuperAdminFilters } from './components/SuperAdminFilters';
import { TenantCard } from './components/TenantCard';
import { NewTenantModal } from './components/NewTenantModal';
import { TenantCreatedModal } from './components/TenantCreatedModal';
import { CambiarEstadoModal } from './components/CambiarEstadoModal';
import type { CreatedTenantCredentials } from './types';
import type { TenantListItem, EstadoTenant } from '@/services/auth/authTypes';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const {
    tenants,
    estadosTenant,
    filteredTenants,
    isLoadingTenants,
    actionLoadingId,
    search,
    setSearch,
    filterEstadoId,
    setFilterEstadoId,
    cargarDatos,
    handleCambiarEstado,
    stats,
  } = useSuperAdmin();

  // Modales
  const [isNewTenantModal, setIsNewTenantModal] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdTenantData, setCreatedTenantData] = useState<CreatedTenantCredentials | null>(null);

  // Modal de Confirmación y Éxito para Cambio de Estado
  const [estadoModalTenant, setEstadoModalTenant] = useState<TenantListItem | null>(null);
  const [estadoModalNuevo, setEstadoModalNuevo] = useState<EstadoTenant | null>(null);
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false);
  const [isEstadoModalSuccess, setIsEstadoModalSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleTenantCreated = (credentials: CreatedTenantCredentials) => {
    setCreatedTenantData(credentials);
    setIsSuccessModalOpen(true);
  };

  const handleRequestCambiarEstado = (tenant: TenantListItem, nuevoIdEstado: number) => {
    const estadoObj = estadosTenant.find((e) => e.id === nuevoIdEstado);
    if (!estadoObj) return;
    setEstadoModalTenant(tenant);
    setEstadoModalNuevo(estadoObj);
    setIsEstadoModalSuccess(false);
    setIsEstadoModalOpen(true);
  };

  const handleConfirmarCambioEstado = async () => {
    if (!estadoModalTenant || !estadoModalNuevo) return;
    const ok = await handleCambiarEstado(estadoModalTenant.id, estadoModalNuevo.id);
    if (ok) {
      setIsEstadoModalSuccess(true);
    }
  };

  const handleCloseEstadoModal = () => {
    setIsEstadoModalOpen(false);
    setEstadoModalTenant(null);
    setEstadoModalNuevo(null);
    setIsEstadoModalSuccess(false);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-900 text-slate-100 flex flex-col safe-top safe-bottom">
      {/* 1. Barra Superior SuperAdmin */}
      <SuperAdminHeader onLogout={handleLogout} />

      {/* 2. Contenido Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4 space-y-3.5 sm:space-y-4">
        {/* Banner de Bienvenida y Acceso Rápido */}
        <div className="bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-indigo-900/50 border border-indigo-700/50 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-indigo-400 uppercase tracking-wider block">
              Bienvenido, {user?.nombreCompleto || 'Super Administrador'}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Panel de Gestión de Negocios
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-md">
              Supervisa el estado de todas las bodegas, farmacias y minimarkets suscritos a la plataforma.
            </p>
          </div>
          <button
            onClick={() => setIsNewTenantModal(true)}
            className="w-full sm:w-auto h-11.5 px-5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-black text-xs shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>NUEVO NEGOCIO</span>
          </button>
        </div>

        {/* 3. KPIs Métricas Globales */}
        <SuperAdminKpis
          totalNegocios={stats.totalNegocios}
          activos={stats.activos}
          mrr={stats.mrr}
          vencidos={stats.vencidos}
        />

        {/* 4. Barra de Filtros y Búsqueda */}
        <SuperAdminFilters
          search={search}
          onSearchChange={setSearch}
          filterEstadoId={filterEstadoId}
          onFilterEstadoChange={setFilterEstadoId}
          tenants={tenants}
          estadosTenant={estadosTenant}
        />

        {/* 5. Listado de Negocios (Tenants) */}
        <div className="space-y-3 pb-8">
          {isLoadingTenants ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm font-bold text-zinc-300">Cargando comercios de la base de datos...</p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-zinc-200">
                {tenants.length === 0 ? 'No hay comercios registrados en el sistema' : 'No se encontraron comercios con los filtros actuales'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                {tenants.length === 0
                  ? 'Registra tu primer comercio cliente presionando el botón "+ Nuevo Comercio".'
                  : 'Prueba cambiando el filtro de estado o el término de búsqueda.'}
              </p>
              {tenants.length === 0 && (
                <button
                  onClick={() => setIsNewTenantModal(true)}
                  className="mt-2 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Primer Comercio
                </button>
              )}
            </div>
          ) : (
            filteredTenants.map((t) => (
              <TenantCard
                key={t.id}
                tenant={t}
                estadosTenant={estadosTenant}
                isLoading={actionLoadingId === t.id}
                onRequestCambiarEstado={handleRequestCambiarEstado}
              />
            ))
          )}
        </div>
      </main>

      {/* 6. Modal Registrar Nuevo Comercio */}
      <NewTenantModal
        isOpen={isNewTenantModal}
        onClose={() => setIsNewTenantModal(false)}
        onSuccess={handleTenantCreated}
        onReload={cargarDatos}
      />

      {/* 7. Modal Éxito y Compartir Credenciales por WhatsApp */}
      <TenantCreatedModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        data={createdTenantData}
      />

      {/* 8. Modal de Confirmación y Éxito para Cambio de Estado de Negocio */}
      <CambiarEstadoModal
        isOpen={isEstadoModalOpen}
        tenant={estadoModalTenant}
        nuevoEstado={estadoModalNuevo}
        isLoading={actionLoadingId !== null}
        isSuccess={isEstadoModalSuccess}
        onConfirm={handleConfirmarCambioEstado}
        onClose={handleCloseEstadoModal}
      />
    </div>
  );
};
