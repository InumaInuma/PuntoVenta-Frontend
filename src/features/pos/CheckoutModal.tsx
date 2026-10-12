import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { configuracionService } from '@/services/backend/configuracionService';
import { clientesService } from '@/services/backend/clientesService';
import { ventasService } from '@/services/backend/ventasService';
import type { Cliente, MetodoPago } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { NumericKeypad } from '@/components/ui/NumericKeypad';
import {
  Banknote,
  QrCode,
  CreditCard,
  UserCheck,
  ShieldCheck,
  User,
  UserPlus,
  Search,
  ArrowLeft,
  Building2,
  Check,
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: (saleData: {
    idVenta: number;
    codigoVenta: string;
    total: number;
    vuelto: number;
    metodoPago: string;
    cliente?: string;
    clienteDocumento?: string;
    tipoComprobante?: string;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSaleSuccess,
}) => {
  const { user, turnoActivo } = useAuth();
  const { items, total, subtotal, impuesto, clearCart } = useCart();
  const { playSuccess } = useSound();
  const { triggerSuccess } = useHaptics();

  const [metodoSeleccionado, setMetodoSeleccionado] = useState<
    'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'FIADO'
  >('EFECTIVO');
  const [tipoComprobante, setTipoComprobante] = useState<
    'NOTA_VENTA' | 'BOLETA' | 'FACTURA'
  >('NOTA_VENTA');
  const [efectivoRecibido, setEfectivoRecibido] = useState<string>('');
  const [referenciaOperacion, setReferenciaOperacion] = useState<string>('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  
  // Cliente casual exclusivo para el ticket (Opción A: no se guarda en la tabla de caseros)
  const [clienteCasual, setClienteCasual] = useState<{
    nombre: string;
    documento: string;
    tipoDoc: 'DNI' | 'RUC';
  } | null>(null);

  const [metodosPagoDisponibles, setMetodosPagoDisponibles] = useState<MetodoPago[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del selector de cliente
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [modoCliente, setModoCliente] = useState<'BUSCAR' | 'RAPIDO'>('RAPIDO');
  const [searchClienteQuery, setSearchClienteQuery] = useState('');
  const [rapidoTipoDoc, setRapidoTipoDoc] = useState<'DNI' | 'RUC'>('DNI');
  const [rapidoNumDoc, setRapidoNumDoc] = useState('');
  const [rapidoNombre, setRapidoNombre] = useState('');

  // Cargar métodos de pago y lista de caseros
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [metodos, clientesList] = await Promise.all([
          configuracionService.getMetodosPago(),
          clientesService.getAll(),
        ]);
        const normalized = (metodos || []).map((m: any) => ({
          ...m,
          idMetodoPago: m.id || m.idMetodoPago || 1,
          codigo: (m.codigoMetodo || m.codigo || '').toUpperCase(),
          nombre: m.nombreMostrado || m.nombre || '',
        }));
        setMetodosPagoDisponibles(normalized);
        setClientes(clientesList || []);
      } catch (err) {
        console.error('Error cargando catálogos de cobro:', err);
      }
    };

    loadData();
    setEfectivoRecibido(total.toFixed(2));
    setReferenciaOperacion('');
    setClienteSeleccionado(null);
    setClienteCasual(null);
    setShowClienteSelector(false);
    setSearchClienteQuery('');
    setRapidoNumDoc('');
    setRapidoNombre('');
  }, [isOpen, total]);

  const recibidoNum = parseFloat(efectivoRecibido) || 0;
  const vuelto = metodoSeleccionado === 'EFECTIVO' ? Math.max(0, recibidoNum - total) : 0;
  const faltaPagar = metodoSeleccionado === 'EFECTIVO' ? Math.max(0, total - recibidoNum) : 0;

  // Filtrado de caseros para búsqueda
  const clientesFiltrados = clientes.filter((c) => {
    const q = searchClienteQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombreCompleto.toLowerCase().includes(q) ||
      (c.numeroDocumento && c.numeroDocumento.includes(q)) ||
      (c.telefono && c.telefono.includes(q))
    );
  });

  const handleSelectTipoComprobante = (tipo: 'NOTA_VENTA' | 'BOLETA' | 'FACTURA') => {
    setTipoComprobante(tipo);
    if (tipo === 'FACTURA') {
      setRapidoTipoDoc('RUC');
      const tieneRucValido =
        (clienteCasual && clienteCasual.tipoDoc === 'RUC' && clienteCasual.documento.length === 11) ||
        (clienteSeleccionado && clienteSeleccionado.numeroDocumento?.length === 11);
      if (!tieneRucValido) {
        setModoCliente('RAPIDO');
        setShowClienteSelector(true);
      }
    }
  };

  const handleGuardarClienteRapido = () => {
    const numDocLimpio = rapidoNumDoc.trim();
    const nombreLimpio = rapidoNombre.trim();

    if (!nombreLimpio) {
      toast.error(
        rapidoTipoDoc === 'RUC'
          ? 'Ingresa la Razón Social de la empresa.'
          : 'Ingresa el nombre completo del cliente.'
      );
      return;
    }

    if (rapidoTipoDoc === 'DNI' && numDocLimpio && numDocLimpio.length !== 8) {
      toast.error('El DNI debe tener 8 dígitos numéricos.');
      return;
    }

    if (rapidoTipoDoc === 'RUC') {
      if (!numDocLimpio || numDocLimpio.length !== 11) {
        toast.error('El RUC debe tener 11 dígitos numéricos.');
        return;
      }
    }

    // Opción A: Asignar directo para la venta/ticket sin contaminar la lista de caseros
    setClienteCasual({
      nombre: nombreLimpio,
      documento: numDocLimpio,
      tipoDoc: rapidoTipoDoc,
    });
    setClienteSeleccionado(null);
    setShowClienteSelector(false);
    toast.success(`Datos asignados al comprobante: ${nombreLimpio}`);
  };

  const handleProcesarVenta = async () => {
    if (!turnoActivo) {
      toast.error('Debes tener una caja/turno abierto para cobrar.');
      return;
    }

    if (items.length === 0) {
      toast.error('El carrito no tiene productos.');
      return;
    }

    if (metodoSeleccionado === 'EFECTIVO' && recibidoNum < total) {
      toast.error(`El monto recibido es menor al total (Faltan S/ ${faltaPagar.toFixed(2)})`);
      return;
    }

    const clienteNombreFinal = clienteCasual
      ? clienteCasual.nombre
      : clienteSeleccionado
      ? clienteSeleccionado.nombreCompleto
      : null;
    const clienteDocFinal = clienteCasual
      ? clienteCasual.documento
      : clienteSeleccionado
      ? clienteSeleccionado.numeroDocumento
      : null;

    if (tipoComprobante === 'FACTURA') {
      if (!clienteDocFinal || clienteDocFinal.length !== 11 || !clienteNombreFinal) {
        toast.error('Para emitir Factura es obligatorio indicar un cliente con RUC (11 dígitos) y Razón Social.');
        setRapidoTipoDoc('RUC');
        setModoCliente('RAPIDO');
        setShowClienteSelector(true);
        return;
      }
    }

    if (metodoSeleccionado === 'FIADO' && !clienteSeleccionado) {
      toast.error('Selecciona un cliente casero para registrar el fiado.');
      return;
    }

    // Buscar idMetodoPago
    let idMetodo = 1;
    if (metodoSeleccionado !== 'FIADO') {
      const metodoObj =
        metodosPagoDisponibles.find((m: any) => {
          const cod = (m.codigoMetodo || m.codigo || '').toUpperCase();
          return cod === metodoSeleccionado;
        }) || metodosPagoDisponibles[0];

      idMetodo = (metodoObj as any)?.id || (metodoObj as any)?.idMetodoPago || 1;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        idEmpresa: user?.idEmpresa || 1,
        idSucursal: user?.idSucursal || 1,
        idTurnoCaja: turnoActivo.idTurnoCaja,
        idUsuario: user?.idUsuario || 1,
        idCliente: clienteSeleccionado ? clienteSeleccionado.idCliente : null,
        clienteNombre: clienteNombreFinal,
        clienteDocumento: clienteDocFinal,
        tipoComprobante,
        subtotal,
        impuesto,
        total,
        vuelto: Number(vuelto.toFixed(2)),
        metodoPago: metodoSeleccionado,
        isFiado: metodoSeleccionado === 'FIADO',
        detalles: items.map((it) => ({
          idProducto: it.producto.idProducto,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          subtotal: it.subtotal,
        })),
        pagos:
          metodoSeleccionado === 'FIADO'
            ? []
            : [
                {
                  idMetodoPago: idMetodo,
                  monto: total,
                  referenciaOperacion: referenciaOperacion || undefined,
                },
              ],
      };

      const res = await ventasService.registrar(payload);

      playSuccess();
      triggerSuccess();
      toast.success(
        metodoSeleccionado === 'FIADO'
          ? `¡Fiado registrado a ${clienteSeleccionado?.nombreCompleto}!`
          : '¡Venta registrada con éxito!'
      );
      clearCart();
      onClose();

      onSaleSuccess({
        idVenta: res.idVenta,
        codigoVenta: res.codigoVenta || `VNT-${res.idVenta}`,
        total,
        vuelto: Number(vuelto.toFixed(2)),
        metodoPago: metodoSeleccionado,
        cliente: clienteNombreFinal || undefined,
        clienteDocumento: clienteDocFinal || undefined,
        tipoComprobante,
      });
    } catch (err: unknown) {
      console.error('Error registrando venta:', err);
      const errorObj = err as {
        response?: { data?: { mensaje?: string; errors?: any } };
        message?: string;
      };
      const msg =
        errorObj?.response?.data?.mensaje ||
        (typeof errorObj?.response?.data === 'string' ? errorObj.response.data : null) ||
        errorObj?.message ||
        'Error al registrar la venta';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cobrar Venta" position="bottom">
      <div className="flex flex-col space-y-3">
        {/* Cabecera de Monto Total y Selector de Comprobante */}
        <div className="bg-slate-900 text-white rounded-3xl p-4 text-center shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Total a Cobrar
          </span>
          <div className="text-3xl font-black text-amber-400 mt-0.5">
            S/ {total.toFixed(2)}
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {(['NOTA_VENTA', 'BOLETA', 'FACTURA'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => handleSelectTipoComprobante(tipo)}
                className={`text-[10px] font-black px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                  tipoComprobante === tipo
                    ? 'bg-red-500 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tipo.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* VISTA 1: SELECTOR DE CLIENTE (CASUAL O CASERO) */}
        {showClienteSelector ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <button
                type="button"
                onClick={() => setShowClienteSelector(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Cobro</span>
              </button>
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Cliente para {tipoComprobante.replace('_', ' ')}
              </span>
            </div>

            {/* Pestañas: DNI/Rápido o Buscar Casero */}
            <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setModoCliente('RAPIDO')}
                className={`py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  modoCliente === 'RAPIDO'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {tipoComprobante === 'FACTURA' ? 'Ingresar RUC' : 'DNI / Rápido'}
              </button>
              <button
                type="button"
                onClick={() => setModoCliente('BUSCAR')}
                className={`py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  modoCliente === 'BUSCAR'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Buscar Casero
              </button>
            </div>

            {/* Pestaña: REGISTRO CASUAL PARA EL TICKET (No ensucia tabla de caseros) */}
            {modoCliente === 'RAPIDO' && (
              <div className="space-y-2.5">
                {tipoComprobante === 'FACTURA' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2 flex items-center gap-2 text-amber-800 text-[11px] font-bold">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Factura exige RUC (11 dígitos) y Razón Social.</span>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRapidoTipoDoc('DNI')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        rapidoTipoDoc === 'DNI'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      DNI (8 Dígitos)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRapidoTipoDoc('RUC')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        rapidoTipoDoc === 'RUC'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      RUC (11 Dígitos)
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase px-1">
                    {rapidoTipoDoc === 'RUC' ? 'Número de RUC (11 dígitos)' : 'Número de DNI (8 dígitos)'}
                  </label>
                  <input
                    type="text"
                    maxLength={rapidoTipoDoc === 'RUC' ? 11 : 8}
                    placeholder={rapidoTipoDoc === 'RUC' ? 'ej: 20601234567' : 'ej: 72481920'}
                    value={rapidoNumDoc}
                    onChange={(e) => setRapidoNumDoc(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-10 bg-white border border-slate-200 rounded-2xl px-3 text-xs outline-none font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase px-1">
                    {rapidoTipoDoc === 'RUC' ? 'Razón Social / Empresa' : 'Nombre Completo del Cliente'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      rapidoTipoDoc === 'RUC'
                        ? 'ej: COMERCIAL SAN JOSÉ S.A.C.'
                        : 'ej: Juan Carlos Pérez'
                    }
                    value={rapidoNombre}
                    onChange={(e) => setRapidoNombre(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-2xl px-3 text-xs outline-none font-bold text-slate-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGuardarClienteRapido}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Check className="w-4 h-4" />
                  <span>USAR EN ESTE TICKET</span>
                </button>
              </div>
            )}

            {/* Pestaña: BUSCAR CASERO EXISTENTE */}
            {modoCliente === 'BUSCAR' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o DNI/RUC..."
                    value={searchClienteQuery}
                    onChange={(e) => setSearchClienteQuery(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-2xl pl-9 pr-3 text-xs outline-none focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {clientesFiltrados.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                      No se encontraron caseros con esa búsqueda.
                    </div>
                  ) : (
                    clientesFiltrados.map((c) => (
                      <button
                        key={c.idCliente}
                        type="button"
                        onClick={() => {
                          setClienteSeleccionado(c);
                          setClienteCasual(null);
                          setShowClienteSelector(false);
                          toast.success(`Casero: ${c.nombreCompleto}`);
                        }}
                        className="w-full text-left p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl flex items-center justify-between transition-all cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {c.nombreCompleto}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {c.tipoDocumento || 'DOC'}: {c.numeroDocumento || 'Sin doc'} · Tel:{' '}
                            {c.telefono || 'S/N'}
                          </p>
                        </div>
                        {c.saldoDeudor > 0 && (
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full shrink-0">
                            Debe S/ {c.saldoDeudor.toFixed(2)}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VISTA 2: FLUJO DE COBRO NORMAL */
          <>
            {/* Barra de Resumen del Cliente */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    clienteCasual || clienteSeleccionado
                      ? 'bg-emerald-100 text-emerald-700'
                      : tipoComprobante === 'FACTURA'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {tipoComprobante === 'FACTURA' ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cliente del comprobante
                  </span>
                  <span className="text-xs font-black text-slate-800 truncate block">
                    {clienteCasual
                      ? `${clienteCasual.nombre} (${clienteCasual.tipoDoc}: ${
                          clienteCasual.documento || 'Sin doc'
                        })`
                      : clienteSeleccionado
                      ? `${clienteSeleccionado.nombreCompleto} ${
                          clienteSeleccionado.numeroDocumento
                            ? `(${clienteSeleccionado.numeroDocumento})`
                            : ''
                        }`
                      : tipoComprobante === 'FACTURA'
                      ? '⚠️ Factura requiere RUC *'
                      : 'Público General (Sin DNI/RUC)'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {clienteCasual || clienteSeleccionado ? (
                  <button
                    type="button"
                    onClick={() => {
                      setClienteCasual(null);
                      setClienteSeleccionado(null);
                    }}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                  >
                    Quitar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setModoCliente(tipoComprobante === 'FACTURA' ? 'RAPIDO' : 'RAPIDO');
                      if (tipoComprobante === 'FACTURA') setRapidoTipoDoc('RUC');
                      setShowClienteSelector(true);
                    }}
                    className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all ${
                      tipoComprobante === 'FACTURA'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{tipoComprobante === 'FACTURA' ? 'Ingresar RUC' : 'DNI / Nombre'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Selector de Métodos de Pago (Píldoras móviles) */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                { id: 'YAPE', label: 'Yape / Plin', icon: QrCode },
                { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                { id: 'FIADO', label: 'Fiado', icon: UserCheck },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = metodoSeleccionado === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetodoSeleccionado(m.id as typeof metodoSeleccionado)}
                    className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/25'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                    <span className="text-[10px] font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Flujo 1: EFECTIVO (Teclado táctil en pantalla y cálculo de vuelto) */}
            {metodoSeleccionado === 'EFECTIVO' && (
              <div className="space-y-3">
                {/* Resumen de efectivo y vuelto */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Recibido</span>
                    <p className="text-lg font-black text-slate-800">
                      S/ {recibidoNum ? recibidoNum.toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div
                    className={`border rounded-2xl p-2.5 text-center ${
                      vuelto > 0
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">
                      {faltaPagar > 0 ? 'Faltan' : 'Vuelto'}
                    </span>
                    <p
                      className={`text-lg font-black ${
                        faltaPagar > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      S/ {faltaPagar > 0 ? faltaPagar.toFixed(2) : vuelto.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Teclado táctil en pantalla */}
                <NumericKeypad
                  value={efectivoRecibido}
                  onChange={setEfectivoRecibido}
                  onConfirm={handleProcesarVenta}
                  confirmLabel={isSubmitting ? 'PROCESANDO...' : `COBRAR S/ ${total.toFixed(2)}`}
                  totalPagar={total}
                />
              </div>
            )}

            {/* Flujo 2: YAPE / PLIN (QR Corporativo de Cobro) */}
            {metodoSeleccionado === 'YAPE' && (
              <div className="bg-gradient-to-b from-purple-50 to-pink-50 border border-purple-200 rounded-3xl p-4 flex flex-col items-center text-center space-y-3">
                <div className="w-44 h-44 bg-white p-2.5 rounded-2xl shadow-md border border-purple-200 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white p-3">
                    <QrCode className="w-16 h-16 text-purple-400 mb-1" />
                    <span className="text-[10px] font-black tracking-wider text-purple-300">
                      ESCANEA CON YAPE / PLIN
                    </span>
                    <span className="text-xs font-black text-amber-300 mt-1">
                      S/ {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-bold text-purple-900">
                  Muestra este código al cliente para cobrar de inmediato
                </p>

                <div className="w-full text-left">
                  <label className="text-[10px] font-bold text-purple-800 uppercase px-1">
                    Número de Operación / Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Últimos 4 dígitos o código de operación"
                    value={referenciaOperacion}
                    onChange={(e) => setReferenciaOperacion(e.target.value)}
                    className="w-full h-11 bg-white border border-purple-300 rounded-2xl px-3 text-xs mt-1 outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleProcesarVenta}
                  disabled={isSubmitting}
                  className="w-full h-13 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  CONFIRMAR PAGO YAPE/PLIN
                </button>
              </div>
            )}

            {/* Flujo 3: TARJETA (POS Físico) */}
            {metodoSeleccionado === 'TARJETA' && (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-600 text-center">
                  Pasa la tarjeta en el terminal inalámbrico por S/ {total.toFixed(2)}
                </p>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase px-1">
                    N° de Operación / Lote Terminal
                  </label>
                  <input
                    type="text"
                    placeholder="ej: 004821"
                    value={referenciaOperacion}
                    onChange={(e) => setReferenciaOperacion(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 rounded-2xl px-3 text-xs mt-1 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleProcesarVenta}
                  disabled={isSubmitting}
                  className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  CONFIRMAR PAGO CON TARJETA
                </button>
              </div>
            )}

            {/* Flujo 4: FIADO CASERO (Cuenta por Cobrar) */}
            {metodoSeleccionado === 'FIADO' && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 space-y-3">
                <p className="text-xs font-bold text-amber-900">
                  Registrar deuda a cuenta del cliente casero
                </p>

                <div>
                  <label className="text-[10px] font-bold text-amber-800 uppercase px-1">
                    Selecciona al Cliente Casero
                  </label>
                  <select
                    className="w-full h-12 bg-white border border-amber-300 rounded-2xl px-3 text-xs mt-1 font-semibold text-slate-800 outline-none"
                    value={clienteSeleccionado?.idCliente || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const found = clientes.find((c) => c.idCliente === id) || null;
                      setClienteSeleccionado(found);
                      setClienteCasual(null);
                    }}
                  >
                    <option value="">-- Seleccionar Cliente Casero --</option>
                    {clientes.map((c) => (
                      <option key={c.idCliente} value={c.idCliente}>
                        {c.nombreCompleto} (Deuda actual: S/ {c.saldoDeudor.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {clienteSeleccionado && (
                  <div className="bg-white p-3 rounded-2xl border border-amber-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Límite de Crédito:</span>
                      <span className="font-bold text-slate-800">
                        S/ {clienteSeleccionado.limiteCredito.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deuda previa:</span>
                      <span className="font-bold text-rose-600">
                        S/ {clienteSeleccionado.saldoDeudor.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100 font-extrabold">
                      <span className="text-slate-700">Nueva deuda total:</span>
                      <span className="text-rose-700">
                        S/ {(clienteSeleccionado.saldoDeudor + total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProcesarVenta}
                  disabled={isSubmitting || !clienteSeleccionado}
                  className="w-full h-13 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span>REGISTRAR FIADO CASERO</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
