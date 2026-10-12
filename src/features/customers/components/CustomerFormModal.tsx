import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Cliente } from '@/types';
import toast from 'react-hot-toast';

export interface CustomerFormData {
  idCliente?: number;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento?: string;
  telefono?: string;
  direccion?: string;
  limiteCredito: number;
}

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClient: Cliente | null;
  onSubmit: (data: CustomerFormData) => void;
  isSubmitting?: boolean;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  editingClient,
  onSubmit,
  isSubmitting = false,
}) => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [limiteCredito, setLimiteCredito] = useState('200.00');

  useEffect(() => {
    if (!isOpen) return;

    if (editingClient) {
      setNombreCompleto(editingClient.nombreCompleto);
      setTipoDocumento(editingClient.tipoDocumento || 'DNI');
      setNumeroDocumento(editingClient.numeroDocumento || '');
      setTelefono(editingClient.telefono || '');
      setDireccion(editingClient.direccion || '');
      setLimiteCredito((editingClient.limiteCredito ?? 200).toString());
    } else {
      setNombreCompleto('');
      setTipoDocumento('DNI');
      setNumeroDocumento('');
      setTelefono('');
      setDireccion('');
      setLimiteCredito('200.00');
    }
  }, [isOpen, editingClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) {
      toast.error('Ingresa el nombre del cliente casero');
      return;
    }

    const parsedLimite = parseFloat(limiteCredito) || 0;

    onSubmit({
      idCliente: editingClient?.idCliente,
      nombreCompleto: nombreCompleto.trim(),
      tipoDocumento: tipoDocumento.trim(),
      numeroDocumento: numeroDocumento.trim() || undefined,
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
      limiteCredito: parsedLimite,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingClient ? 'Editar Casero' : 'Nuevo Cliente Casero'}
      position="bottom"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
            Nombre Completo del Casero *
          </label>
          <input
            type="text"
            placeholder="ej: Doña Carmen Torres"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-semibold mt-1 outline-none focus:border-red-500 focus:bg-white"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Tipo Doc.
            </label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-sm font-bold mt-1 outline-none focus:border-red-500"
            >
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="CE">C.E.</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Número de Documento
            </label>
            <input
              type="text"
              placeholder="8 u 11 dígitos"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-mono font-bold mt-1 outline-none focus:border-red-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
            Teléfono (WhatsApp para avisos de cobro)
          </label>
          <input
            type="tel"
            placeholder="999888777"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-mono font-bold mt-1 outline-none focus:border-red-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
            Dirección o Referencia
          </label>
          <input
            type="text"
            placeholder="ej: Mz. B Lote 4 (Frente al parque)"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-semibold mt-1 outline-none focus:border-red-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
            Límite de Fiado Máximo Permitido (S/)
          </label>
          <input
            type="number"
            step="10"
            value={limiteCredito}
            onChange={(e) => setLimiteCredito(e.target.value)}
            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-base font-black font-mono mt-1 outline-none focus:border-red-500 focus:bg-white"
            required
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
          >
            {editingClient ? 'GUARDAR CAMBIOS' : 'REGISTRAR CASERO'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
