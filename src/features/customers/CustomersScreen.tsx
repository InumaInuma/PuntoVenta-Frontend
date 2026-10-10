import React, { useState, useEffect } from 'react';
import { clientesService } from '@/services/backend/clientesService';
import type { Cliente } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Phone, CreditCard, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomersScreen: React.FC = () => {
  const { turnoActivo, user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Nuevo Cliente
  const [isNewClientModal, setIsNewClientModal] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [limiteCredito, setLimiteCredito] = useState('200.00');

  // Modal Abono / Pago de Deuda
  const [isAbonoModal, setIsAbonoModal] = useState(false);
  const [clienteAbono, setClienteAbono] = useState<Cliente | null>(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadClientes = async () => {
    setIsLoading(true);
    try {
      const data = await clientesService.getAll();
      setClientes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }

    setIsSubmitting(true);
    try {
      await clientesService.create({
        idEmpresa: 1,
        nombreCompleto: nombreCompleto.trim(),
        telefono: telefono.trim() || undefined,
        numeroDocumento: numeroDocumento.trim() || undefined,
        limiteCredito: parseFloat(limiteCredito) || 0,
      });

      toast.success('Cliente registrado exitosamente');
      setIsNewClientModal(false);
      setNombreCompleto('');
      setTelefono('');
      setNumeroDocumento('');
      loadClientes();
    } catch {
      // Handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePagarAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoAbono);
    if (!clienteAbono || isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto de abono válido');
      return;
    }

    if (!turnoActivo) {
      toast.error('Debes tener un turno de caja abierto para recibir dinero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await clientesService.abonar({
        idEmpresa: 1,
        idTurnoCaja: turnoActivo.idTurnoCaja,
        idCliente: clienteAbono.idCliente,
        idUsuario: user?.idUsuario || 1,
        montoAbono: monto,
        idMetodoPago: 1, // Efectivo por defecto
      });

      toast.success(`¡Abono de S/ ${monto.toFixed(2)} registrado!`);
      setIsAbonoModal(false);
      setClienteAbono(null);
      setMontoAbono('');
      loadClientes();
    } catch {
      // Handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = clientes.filter(
    (c) =>
      c.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono?.includes(search) ||
      c.numeroDocumento?.includes(search)
  );

  return (
    <div className="space-y-3 pb-16">
      {/* Cabecera & Botón Nuevo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Clientes & Fiados</h2>
          <p className="text-xs font-semibold text-slate-500">
            Control de cuentas caseras y deudas
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewClientModal(true)}
          icon={<Plus className="w-4 h-4 stroke-[3]" />}
        >
          NUEVO
        </Button>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar cliente casero o teléfono..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full h-12 bg-white rounded-2xl px-4 text-sm border border-slate-200/90 shadow-sm outline-none focus:border-red-500"
      />

      {/* Lista de Clientes */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-bold">Cargando caseros...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((cl) => {
            const tieneDeuda = cl.saldoDeudor > 0;
            return (
              <div
                key={cl.idCliente}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-black text-sm flex items-center justify-center">
                      {cl.nombreCompleto[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">
                        {cl.nombreCompleto}
                      </h4>
                      {cl.telefono && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <Phone className="w-3 h-3" />
                          <span>{cl.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                      tieneDeuda
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {tieneDeuda ? 'Tiene Deuda' : 'Al Día'}
                  </span>
                </div>

                {/* Balance de Deuda */}
                <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">
                      Límite Fiado
                    </span>
                    <span className="font-extrabold text-slate-700">
                      S/ {cl.limiteCredito.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">
                      Saldo Deudor
                    </span>
                    <span className={`text-base font-black ${tieneDeuda ? 'text-rose-600' : 'text-emerald-600'}`}>
                      S/ {cl.saldoDeudor.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Botón de Abonar si tiene deuda */}
                {tieneDeuda && (
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setClienteAbono(cl);
                      setMontoAbono(cl.saldoDeudor.toFixed(2));
                      setIsAbonoModal(true);
                    }}
                    icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
                  >
                    REGISTRAR ABONO / PAGO
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      <Modal isOpen={isNewClientModal} onClose={() => setIsNewClientModal(false)} title="Registrar Cliente Casero">
        <form onSubmit={handleCreateClient} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Nombre Completo</label>
            <input
              type="text"
              placeholder="ej: Doña Carmen Torres"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Teléfono (WhatsApp)</label>
              <input
                type="tel"
                placeholder="999888777"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">DNI o RUC</label>
              <input
                type="text"
                placeholder="8 dígitos"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm mt-1 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Límite de Fiado Máximo (S/)</label>
            <input
              type="number"
              step="10"
              value={limiteCredito}
              onChange={(e) => setLimiteCredito(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold mt-1 outline-none"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSubmitting}>
              GUARDAR CLIENTE
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Abonar a Deuda */}
      <Modal isOpen={isAbonoModal} onClose={() => setIsAbonoModal(false)} title={`Abonar a ${clienteAbono?.nombreCompleto}`}>
        <form onSubmit={handlePagarAbono} className="space-y-4">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Deuda Total Actual</span>
            <p className="text-2xl font-black text-rose-600">
              S/ {clienteAbono?.saldoDeudor.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Monto que el cliente abona (S/)</label>
            <input
              type="number"
              step="0.50"
              value={montoAbono}
              onChange={(e) => setMontoAbono(e.target.value)}
              className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-center text-slate-900 outline-none focus:border-red-500 focus:bg-white mt-1"
              required
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSubmitting}>
            CONFIRMAR INGRESO A CAJA
          </Button>
        </form>
      </Modal>
    </div>
  );
};
