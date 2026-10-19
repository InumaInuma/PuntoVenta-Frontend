import { useState, useEffect } from 'react';
import { AuthService } from '@/services/auth/authService';
import type { TenantListItem, EstadoTenant } from '@/services/auth/authTypes';
import { signalRService } from '@/services/signalrService';
import toast from 'react-hot-toast';

export const useSuperAdmin = () => {
  const [search, setSearch] = useState('');
  const [filterEstadoId, setFilterEstadoId] = useState<number | null>(null);
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [estadosTenant, setEstadosTenant] = useState<EstadoTenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const cargarDatos = async () => {
    try {
      setIsLoadingTenants(true);
      const [resTenants, resEstados] = await Promise.all([
        AuthService.listarTenants(),
        AuthService.listarEstadosTenant(),
      ]);

      if (resTenants.isSuccess && Array.isArray(resTenants.data)) {
        setTenants(resTenants.data);
      }
      if (resEstados.isSuccess && Array.isArray(resEstados.data)) {
        setEstadosTenant(resEstados.data);
      }
    } catch (err: any) {
      console.error('Error al cargar datos desde la base de datos:', err);
      toast.error('No se pudo cargar la lista de comercios.');
    } finally {
      setIsLoadingTenants(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Escuchar en tiempo real mediante SignalR cambios de estado de negocios
  useEffect(() => {
    signalRService.start();
    const unsub = signalRService.onTenantEstadoCambiado((notif) => {
      setTenants((prev) =>
        prev.map((t) => {
          if (t.id === notif.tenantId) {
            const estadoObj = estadosTenant.find((e) => e.id === notif.idEstadoTenant);
            return {
              ...t,
              idEstadoTenant: notif.idEstadoTenant,
              estadoCodigo: notif.estadoCodigo,
              estadoNombre: notif.estadoNombre,
              estadoColorHex: estadoObj?.colorHex || t.estadoColorHex,
            };
          }
          return t;
        })
      );
      toast.success(
        `[SignalR en vivo] Comercio #${notif.tenantId} actualizado a ${notif.estadoNombre}`,
        { icon: '📡' }
      );
    });

    return () => {
      unsub();
    };
  }, [estadosTenant]);

  const handleCambiarEstado = async (idTenant: number, nuevoIdEstado: number): Promise<boolean> => {
    try {
      setActionLoadingId(idTenant);
      const res = await AuthService.cambiarEstadoTenant(idTenant, nuevoIdEstado);
      if (res.isSuccess) {
        toast.success(res.message || 'Estado actualizado en la base de datos');
        const estadoObj = estadosTenant.find((e) => e.id === nuevoIdEstado);
        setTenants((prev) =>
          prev.map((t) => {
            if (t.id === idTenant) {
              return {
                ...t,
                idEstadoTenant: nuevoIdEstado,
                estadoCodigo: estadoObj?.codigo || t.estadoCodigo,
                estadoNombre: estadoObj?.nombre || t.estadoNombre,
                estadoColorHex: estadoObj?.colorHex || t.estadoColorHex,
              };
            }
            return t;
          })
        );
        return true;
      } else {
        toast.error(res.message || 'Error al actualizar estado');
        return false;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al actualizar estado en la base de datos');
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  // Métricas
  const totalNegocios = tenants.length;
  const activos = tenants.filter((t) => t.idEstadoTenant === 1).length;
  const mrr = tenants.reduce((acc, t) => (t.idEstadoTenant === 1 ? acc + Number(t.precioMensual || 0) : acc), 0);
  const vencidos = tenants.filter((t) => t.idEstadoTenant === 3).length;

  const filteredTenants = tenants.filter((t) => {
    const matchEstado = filterEstadoId === null || t.idEstadoTenant === filterEstadoId;
    const matchSearch =
      !search.trim() ||
      t.nombreComercial.toLowerCase().includes(search.toLowerCase()) ||
      (t.ruc && t.ruc.includes(search)) ||
      (t.telefono && t.telefono.includes(search));
    return matchEstado && matchSearch;
  });

  return {
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
    stats: {
      totalNegocios,
      activos,
      mrr,
      vencidos,
    },
  };
};
