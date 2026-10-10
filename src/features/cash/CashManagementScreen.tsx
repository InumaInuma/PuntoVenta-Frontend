import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cajasService } from '@/services/backend/cajasService';
import type { MovimientoCaja } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Landmark,
  CircleDot,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  Plus,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CashManagementScreen: React.FC = () => {
  const { turnoActivo, verificarTurnoActivo, user } = useAuth();

  const [montoApertura, setMontoApertura] = useState('100.00');
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const [isCloseModal, setIsCloseModal] = useState(false);
  const [isMovementModal, setIsMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [movementConcept, setMovementConcept] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    verificarTurnoActivo();
  }, [verificarTurnoActivo]);

  // Aperturar Turno de Caja
  const handleOpenShift = async () => {
    const monto = parseFloat(montoApertura);
    if (isNaN(monto) || monto < 0) {
      toast.error('Ingresa un monto de apertura válido');
      return;
    }

    setIsLoading(true);
    try {
      await cajasService.abrirTurno({
        idCaja: 1,
        idUsuario: user?.idUsuario || 1,
        montoApertura: monto,
      });
      toast.success('¡Turno de caja aperturado con éxito!');
      setIsOpeningModal(false);
      await verificarTurnoActivo();
    } catch {
      // Interceptor handles error
    } finally {
      setIsLoading(false);
    }
  };

  // Registrar Movimiento (Ingreso o Egreso)
  const handleAddMovement = async () => {
    const monto = parseFloat(movementAmount);
    if (isNaN(monto) || monto <= 0 || !movementConcept.trim()) {
      toast.error('Completa el concepto y un monto válido');
      return;
    }

    if (!turnoActivo) {
      toast.error('No hay un turno activo');
      return;
    }

    setIsLoading(true);
    try {
      const payload: MovimientoCaja = {
        idTurnoCaja: turnoActivo.idTurnoCaja,
        tipo: movementType,
        concepto: movementConcept.trim(),
        monto,
        idUsuario: user?.idUsuario,
      };

      await cajasService.registrarMovimiento(payload);
      toast.success(`Movimiento de ${movementType} registrado`);
      setMovementConcept('');
      setMovementAmount('');
      setIsMovementModal(false);
      await verificarTurnoActivo();
    } catch {
      // Interceptor handles error
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar Turno de Caja
  const handleCloseShift = async () => {
    const montoReal = parseFloat(countedCash);
    if (isNaN(montoReal) || montoReal < 0) {
      toast.error('Ingresa el monto de efectivo contado en caja');
      return;
    }

    if (!turnoActivo) return;

    setIsLoading(true);
    try {
      await cajasService.cerrarTurno(turnoActivo.idTurnoCaja, {
        montoCierre: montoReal,
        observaciones: closeNotes.trim() || undefined,
      });

      toast.success('¡Caja cerrada correctamente!');
      setIsCloseModal(false);
      await verificarTurnoActivo();
    } catch {
      // Interceptor handles error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tarjeta Principal de Estado de Turno */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              turnoActivo ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <Landmark className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                {turnoActivo ? 'Turno en Curso' : 'Caja Cerrada'}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Caja Principal 01
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
              turnoActivo
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <CircleDot className={`w-3 h-3 ${turnoActivo ? 'animate-pulse' : ''}`} />
            {turnoActivo ? 'Abierta' : 'Cerrada'}
          </span>
        </div>

        {turnoActivo ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Monto Apertura</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">
                  S/ {turnoActivo.montoApertura.toFixed(2)}
                </p>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/60">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Efectivo Esperado</span>
                <p className="text-lg font-black text-emerald-800 mt-0.5">
                  S/ {(turnoActivo.montoSistemaEfectivo ?? turnoActivo.montoApertura).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between px-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Apertura: {new Date(turnoActivo.fechaApertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="font-semibold text-slate-700">
                Cajero: {turnoActivo.nombreUsuario || user?.nombre}
              </span>
            </div>

            {/* Acciones de Caja Abierta */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setMovementType('EGRESO');
                  setIsMovementModal(true);
                }}
                icon={<ArrowDownCircle className="w-4 h-4 text-rose-500" />}
              >
                Gasto / Retiro
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setMovementType('INGRESO');
                  setIsMovementModal(true);
                }}
                icon={<ArrowUpCircle className="w-4 h-4 text-emerald-500" />}
              >
                Ingreso Extra
              </Button>
            </div>

            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={() => {
                setCountedCash((turnoActivo.montoSistemaEfectivo ?? turnoActivo.montoApertura).toFixed(2));
                setIsCloseModal(true);
              }}
              icon={<Lock className="w-5 h-5" />}
              className="mt-2"
            >
              ARQUEO Y CIERRE DE CAJA
            </Button>
          </div>
        ) : (
          <div className="mt-6 text-center py-4 space-y-4">
            <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
              No tienes un turno activo en esta sucursal. Ingresa el fondo de caja inicial para comenzar a registrar ventas.
            </p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setIsOpeningModal(true)}
              icon={<Plus className="w-5 h-5 stroke-[2.5]" />}
            >
              APERTURAR NUEVO TURNO
            </Button>
          </div>
        )}
      </div>

      {/* Modal Apertura de Turno */}
      <Modal isOpen={isOpeningModal} onClose={() => setIsOpeningModal(false)} title="Aperturar Turno de Caja">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Ingresa el monto de sencillo o fondo inicial con el que comienzas en la gaveta:
          </p>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Monto Inicial (S/)</label>
            <input
              type="number"
              step="0.10"
              value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
              className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-center text-slate-900 outline-none focus:border-red-500 focus:bg-white mt-1"
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[50, 100, 150, 200].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMontoApertura(v.toFixed(2))}
                className="h-10 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800"
              >
                S/ {v}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            onClick={handleOpenShift}
          >
            CONFIRMAR APERTURA
          </Button>
        </div>
      </Modal>

      {/* Modal Registro de Movimiento (Ingreso / Egreso) */}
      <Modal
        isOpen={isMovementModal}
        onClose={() => setIsMovementModal(false)}
        title={movementType === 'EGRESO' ? 'Registrar Gasto o Retiro' : 'Registrar Ingreso Manual'}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Concepto o Motivo</label>
            <input
              type="text"
              placeholder="ej: Compra de bolsas, pago delivery, etc."
              value={movementConcept}
              onChange={(e) => setMovementConcept(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm mt-1 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Monto en Efectivo (S/)</label>
            <input
              type="number"
              step="0.50"
              placeholder="0.00"
              value={movementAmount}
              onChange={(e) => setMovementAmount(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-lg font-black mt-1 outline-none"
            />
          </div>

          <Button
            variant={movementType === 'EGRESO' ? 'danger' : 'primary'}
            size="lg"
            fullWidth
            isLoading={isLoading}
            onClick={handleAddMovement}
          >
            GUARDAR MOVIMIENTO
          </Button>
        </div>
      </Modal>

      {/* Modal Cierre y Arqueo de Caja */}
      <Modal isOpen={isCloseModal} onClose={() => setIsCloseModal(false)} title="Arqueo y Cierre de Caja">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p>
              Cuenta todo el dinero en efectivo que tienes en físico y digítalo a continuación. El sistema comparará con las ventas del turno.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Efectivo Físico Contado (S/)</label>
            <input
              type="number"
              step="0.10"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-center text-slate-900 outline-none focus:border-red-500 focus:bg-white mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Observaciones del Cierre</label>
            <textarea
              rows={2}
              placeholder="Notas opcionales del turno..."
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs mt-1 outline-none"
            />
          </div>

          <Button
            variant="danger"
            size="lg"
            fullWidth
            isLoading={isLoading}
            onClick={handleCloseShift}
          >
            CONFIRMAR CIERRE DE TURNO
          </Button>
        </div>
      </Modal>
    </div>
  );
};
