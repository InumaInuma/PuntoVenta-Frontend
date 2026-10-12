import React, { useState, useEffect } from 'react';
import {
  clientesService,
  type CuentaPorCobrar,
} from '@/services/backend/clientesService';
import type { Cliente } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { Sparkles } from 'lucide-react';
import {
  CustomersHeader,
  CustomersStats,
  CustomersFilterTabs,
  CustomerCard,
  CustomerFormModal,
  CustomerAbonoModal,
  type FilterTabOption,
  type CustomerFormData,
  type AbonoSubmitData,
} from './components';
import toast from 'react-hot-toast';

export const CustomersScreen: React.FC = () => {
  const { turnoActivo } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTabOption>('todos');
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Modales
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [pendingClientData, setPendingClientData] = useState<CustomerFormData | null>(null);

  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [clienteAbono, setClienteAbono] = useState<Cliente | null>(null);
  const [deudasPendientes, setDeudasPendientes] = useState<CuentaPorCobrar[]>([]);
  const [isLoadingDeudas, setIsLoadingDeudas] = useState(false);
  const [pendingAbonoData, setPendingAbonoData] = useState<AbonoSubmitData | null>(null);

  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);

  // Modales Reutilizables de Confirmación y Éxito
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isConfirmAbonoOpen, setIsConfirmAbonoOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    title: string;
    message: string;
    details?: Array<{ label: string; value: string | number; highlight?: boolean }>;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carga de clientes desde backend
  const loadClientes = async () => {
    setIsLoading(true);
    try {
      const data = await clientesService.getAll();
      setClientes(data || []);
    } catch (err) {
      console.error('Error cargando clientes:', err);
      toast.error('No se pudo cargar la lista de clientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // Métricas del Dashboard
  const totalClientes = clientes.length;
  const clientesConDeuda = clientes.filter((c) => (c.saldoDeudor ?? 0) > 0);
  const totalDeudaAcumulada = clientes.reduce((acc, c) => acc + (c.saldoDeudor ?? 0), 0);

  // Filtrado de Clientes
  const filtered = clientes.filter((c) => {
    const matchesSearch =
      c.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      (c.telefono && c.telefono.includes(search)) ||
      (c.numeroDocumento && c.numeroDocumento.includes(search));

    if (!matchesSearch) return false;

    if (filterTab === 'deuda') return (c.saldoDeudor ?? 0) > 0;
    if (filterTab === 'aldia') return (c.saldoDeudor ?? 0) === 0;
    return true;
  });

  // Manejador: Abrir creación / edición
  const handleOpenCreateClient = () => {
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (cl: Cliente) => {
    setEditingClient(cl);
    setIsClientModalOpen(true);
  };

  // Manejador: Formulario de cliente listo para confirmar
  const handleClientFormSubmit = (data: CustomerFormData) => {
    setPendingClientData(data);
    setIsConfirmSaveOpen(true);
  };

  // Ejecutar Guardado de Cliente en la Base de Datos
  const executeSaveClient = async () => {
    if (!pendingClientData) return;
    setIsSubmitting(true);

    try {
      if (pendingClientData.idCliente) {
        await clientesService.update(pendingClientData.idCliente, {
          nombreCompleto: pendingClientData.nombreCompleto,
          tipoDocumento: pendingClientData.tipoDocumento,
          numeroDocumento: pendingClientData.numeroDocumento,
          telefono: pendingClientData.telefono,
          direccion: pendingClientData.direccion,
          limiteCredito: pendingClientData.limiteCredito,
          activo: true,
        });

        setIsConfirmSaveOpen(false);
        setIsClientModalOpen(false);
        setSuccessInfo({
          title: '¡Cliente Actualizado!',
          message: 'Los datos del casero y su límite de crédito fueron actualizados.',
          details: [
            { label: 'Nombre', value: pendingClientData.nombreCompleto },
            { label: 'Documento', value: pendingClientData.numeroDocumento || '(Sin doc)' },
            { label: 'Teléfono', value: pendingClientData.telefono || '(Sin teléfono)' },
            {
              label: 'Límite de Fiado',
              value: `S/ ${pendingClientData.limiteCredito.toFixed(2)}`,
              highlight: true,
            },
          ],
        });
        setIsSuccessModalOpen(true);
      } else {
        await clientesService.create({
          nombreCompleto: pendingClientData.nombreCompleto,
          tipoDocumento: pendingClientData.tipoDocumento,
          numeroDocumento: pendingClientData.numeroDocumento,
          telefono: pendingClientData.telefono,
          direccion: pendingClientData.direccion,
          limiteCredito: pendingClientData.limiteCredito,
        });

        setIsConfirmSaveOpen(false);
        setIsClientModalOpen(false);
        setSuccessInfo({
          title: '¡Cliente Registrado con Éxito!',
          message: 'El casero ha sido registrado y puede recibir fiados y compras.',
          details: [
            { label: 'Nombre', value: pendingClientData.nombreCompleto },
            { label: 'Documento', value: pendingClientData.numeroDocumento || '(Sin doc)' },
            { label: 'Teléfono', value: pendingClientData.telefono || '(Sin teléfono)' },
            {
              label: 'Límite de Fiado',
              value: `S/ ${pendingClientData.limiteCredito.toFixed(2)}`,
              highlight: true,
            },
          ],
        });
        setIsSuccessModalOpen(true);
      }

      loadClientes();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { mensaje?: string } }; message?: string };
      const msg = errorObj?.response?.data?.mensaje || errorObj?.message || 'Error al guardar cliente';
      toast.error(msg);
      setIsConfirmSaveOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejador: Iniciar Abono
  const handleOpenAbono = async (cl: Cliente) => {
    setClienteAbono(cl);
    setDeudasPendientes([]);
    setIsAbonoModalOpen(true);
    setIsLoadingDeudas(true);

    try {
      const deudas = await clientesService.getDeudas(cl.idCliente);
      setDeudasPendientes(deudas || []);
    } catch (err) {
      console.warn('Error al cargar deudas del cliente:', err);
    } finally {
      setIsLoadingDeudas(false);
    }
  };

  const handleAbonoSubmit = (data: AbonoSubmitData) => {
    if (!turnoActivo) {
      toast.error('Debes tener un turno de caja abierto para ingresar el dinero del abono.');
      return;
    }
    setPendingAbonoData(data);
    setIsConfirmAbonoOpen(true);
  };

  // Ejecutar Abono en Caja
  const executeAbono = async () => {
    if (!pendingAbonoData || !turnoActivo) return;
    setIsSubmitting(true);

    try {
      let ultimoSaldoRestante = 0;

      if (pendingAbonoData.esPagoTotalGeneral) {
        let montoRestante = pendingAbonoData.monto;
        for (const d of deudasPendientes) {
          if (montoRestante <= 0.001) break;
          const abonoParcial = Math.min(montoRestante, d.saldoPendiente);
          if (abonoParcial <= 0) continue;

          const r = await clientesService.abonarCuenta(d.id, {
            idTurnoCaja: turnoActivo.idTurnoCaja,
            idMetodoPagoConfig: pendingAbonoData.metodoPago,
            montoAbonado: Number(abonoParcial.toFixed(2)),
            observaciones: `Abono total casero ${pendingAbonoData.cliente.nombreCompleto} (Ticket ${d.numeroComprobante || d.id})`,
          });
          ultimoSaldoRestante = r?.saldoRestanteCliente ?? 0;
          montoRestante -= abonoParcial;
        }
      } else {
        const res = await clientesService.abonarCuenta(pendingAbonoData.idCuenta, {
          idTurnoCaja: turnoActivo.idTurnoCaja,
          idMetodoPagoConfig: pendingAbonoData.metodoPago,
          montoAbonado: pendingAbonoData.monto,
          observaciones: `Abono de casero ${pendingAbonoData.cliente.nombreCompleto}`,
        });
        ultimoSaldoRestante = res?.saldoRestanteCliente ?? 0;
      }

      setIsConfirmAbonoOpen(false);
      setIsAbonoModalOpen(false);

      setSuccessInfo({
        title: '¡Abono Ingresado a Caja!',
        message: 'El dinero fue registrado en tu turno de caja y se redujo la deuda del casero.',
        details: [
          { label: 'Cliente', value: pendingAbonoData.cliente.nombreCompleto },
          { label: 'Monto Abonado', value: `S/ ${pendingAbonoData.monto.toFixed(2)}`, highlight: true },
          {
            label: 'Saldo Restante',
            value: `S/ ${ultimoSaldoRestante.toFixed(2)}`,
          },
          { label: 'Turno de Caja', value: `Caja #${turnoActivo.idCaja}` },
        ],
      });
      setIsSuccessModalOpen(true);
      loadClientes();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { mensaje?: string } }; message?: string };
      const msg = errorObj?.response?.data?.mensaje || 'Error al procesar el abono';
      toast.error(msg);
      setIsConfirmAbonoOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejador: Eliminación de Cliente
  const handleInitiateDelete = (cl: Cliente) => {
    if ((cl.saldoDeudor ?? 0) > 0) {
      toast.error(
        `No puedes eliminar a "${cl.nombreCompleto}" porque mantiene una deuda pendiente de S/ ${(
          cl.saldoDeudor ?? 0
        ).toFixed(2)}`
      );
      return;
    }
    setClientToDelete(cl);
    setIsConfirmDeleteOpen(true);
  };

  const executeDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsSubmitting(true);

    try {
      await clientesService.delete(clientToDelete.idCliente);
      toast.success(`Cliente "${clientToDelete.nombreCompleto}" eliminado`);
      setIsConfirmDeleteOpen(false);
      setClientToDelete(null);
      loadClientes();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { mensaje?: string } }; message?: string };
      const msg = errorObj?.response?.data?.mensaje || 'No se pudo eliminar el cliente';
      toast.error(msg);
      setIsConfirmDeleteOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Cabecera & Botón Nuevo */}
      <CustomersHeader onOpenCreate={handleOpenCreateClient} />

      {/* Tarjetas Resumen de Saldos (KPIs) */}
      <CustomersStats
        totalClientes={totalClientes}
        totalConDeuda={clientesConDeuda.length}
        totalDeudaAcumulada={totalDeudaAcumulada}
      />

      {/* Buscador & Pestañas de Filtro */}
      <CustomersFilterTabs
        search={search}
        onSearchChange={setSearch}
        filterTab={filterTab}
        onFilterChange={setFilterTab}
        totalClientes={totalClientes}
        totalConDeuda={clientesConDeuda.length}
      />

      {/* Listado de Caseros */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-bold">Cargando caseros...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No se encontraron clientes caseros</p>
          <p className="text-xs text-slate-400 mt-1">
            {search
              ? 'Prueba con otro término de búsqueda'
              : 'Registra a tus clientes frecuentes para llevar fiados'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={handleOpenCreateClient}
              className="mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 cursor-pointer hover:bg-red-100"
            >
              + Registrar primer casero
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((cl) => (
            <CustomerCard
              key={cl.idCliente}
              cliente={cl}
              onEdit={handleOpenEditClient}
              onDelete={handleInitiateDelete}
              onOpenAbono={handleOpenAbono}
            />
          ))}
        </div>
      )}

      {/* MODAL: FORMULARIO CLIENTE (CREAR / EDITAR) */}
      <CustomerFormModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        editingClient={editingClient}
        onSubmit={handleClientFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* MODAL: ABONO / PAGO A FIADO */}
      <CustomerAbonoModal
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        cliente={clienteAbono}
        deudasPendientes={deudasPendientes}
        isLoadingDeudas={isLoadingDeudas}
        onSubmit={handleAbonoSubmit}
        isSubmitting={isSubmitting}
      />

      {/* MODAL REUTILIZABLE: CONFIRMACIÓN DE GUARDAR CLIENTE */}
      <ConfirmModal
        isOpen={isConfirmSaveOpen}
        onClose={() => setIsConfirmSaveOpen(false)}
        onConfirm={executeSaveClient}
        title={pendingClientData?.idCliente ? '¿Actualizar Casero?' : '¿Confirmar Registro de Casero?'}
        description="Verifica los datos del cliente antes de registrarlo en el sistema."
        confirmText={pendingClientData?.idCliente ? 'Sí, Actualizar' : 'Sí, Registrar'}
        cancelText="Revisar"
        variant="primary"
        isLoading={isSubmitting}
        details={
          pendingClientData
            ? [
                { label: 'Nombre', value: pendingClientData.nombreCompleto },
                { label: 'Documento', value: pendingClientData.numeroDocumento || '(Sin documento)' },
                { label: 'Teléfono', value: pendingClientData.telefono || '(Sin teléfono)' },
                {
                  label: 'Límite Fiado',
                  value: `S/ ${pendingClientData.limiteCredito.toFixed(2)}`,
                  highlight: true,
                },
              ]
            : undefined
        }
      />

      {/* MODAL REUTILIZABLE: CONFIRMACIÓN DE ABONO */}
      <ConfirmModal
        isOpen={isConfirmAbonoOpen}
        onClose={() => setIsConfirmAbonoOpen(false)}
        onConfirm={executeAbono}
        title="¿Registrar Ingreso de Abono?"
        description="Se registrará el cobro de la deuda y el dinero ingresará automáticamente a tu turno de caja."
        confirmText="Sí, Cobrar Abono"
        cancelText="Cancelar"
        variant="success"
        isLoading={isSubmitting}
        details={
          pendingAbonoData
            ? [
                { label: 'Casero', value: pendingAbonoData.cliente.nombreCompleto },
                {
                  label: 'Monto a Cobrar',
                  value: `S/ ${pendingAbonoData.monto.toFixed(2)}`,
                  highlight: true,
                },
                {
                  label: 'Caja Receptora',
                  value: turnoActivo ? `Turno #${turnoActivo.idTurnoCaja}` : 'Caja Activa',
                },
              ]
            : undefined
        }
      />

      {/* MODAL REUTILIZABLE: CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={executeDeleteClient}
        title="¿Eliminar Casero?"
        description={`¿Estás seguro de que deseas eliminar a "${clientToDelete?.nombreCompleto}"?`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isSubmitting}
        details={
          clientToDelete
            ? [
                { label: 'Nombre', value: clientToDelete.nombreCompleto },
                {
                  label: 'Deuda Pendiente',
                  value: `S/ ${(clientToDelete.saldoDeudor ?? 0).toFixed(2)}`,
                },
              ]
            : undefined
        }
      />

      {/* MODAL REUTILIZABLE: ÉXITO DE OPERACIÓN */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setSuccessInfo(null);
        }}
        title={successInfo?.title || '¡Operación Exitosa!'}
        message={successInfo?.message || 'Los cambios se aplicaron exitosamente.'}
        primaryActionText="Entendido"
        onPrimaryAction={() => {
          setIsSuccessModalOpen(false);
          setSuccessInfo(null);
        }}
        details={successInfo?.details}
      />
    </div>
  );
};

export default CustomersScreen;
