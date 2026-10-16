import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { configuracionService } from '@/services/backend/configuracionService';
import { clientesService } from '@/services/backend/clientesService';
import { ventasService } from '@/services/backend/ventasService';
import { cotizacionesService } from '@/services/backend/cotizacionesService';
import type { Cliente, MetodoPago } from '@/types';
import { Modal } from '@/components/ui/Modal';
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
  Package,
  FileText,
  ShoppingBag,
  Calendar,
  Smartphone,
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import { getCountryDetails, getCachedTenantCountry, saveCachedTenantCountry, type CountryDetails } from '@/utils/countryHelper';
import { getStorageUrl } from '@/utils/storageUrl';
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
    clienteTelefono?: string;
    tipoComprobante?: string;
    items?: Array<{ cantidad: number; productoNombre: string; precioUnitario: number; subtotal: number }>;
    subtotal?: number;
    descuento?: number;
    validezDias?: number;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSaleSuccess,
}) => {
  const { user, turnoActivo } = useAuth();
  const { items, clearCart } = useCart();
  const { playSuccess } = useSound();
  const { triggerSuccess } = useHaptics();

  // Pestaña Principal: Venta vs Cotización
  const [modoTab, setModoTab] = useState<'VENTA' | 'COTIZACION'>('VENTA');

  // Descuento y Precio Final
  const [tipoDescuento, setTipoDescuento] = useState<'MONTO' | 'PORCENTAJE'>('MONTO');
  const [descuentoInput, setDescuentoInput] = useState<string>('0');
  const [precioFinalInput, setPrecioFinalInput] = useState<string>('');
  const [validezDias, setValidezDias] = useState<number>(7);

  // Estados de Cobro
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

  // Cliente casual para comprobante o cotización
  const [clienteCasual, setClienteCasual] = useState<{
    nombre: string;
    documento: string;
    tipoDoc: 'DNI' | 'RUC';
    telefono?: string;
  } | null>(null);

  const [metodosPagoDisponibles, setMetodosPagoDisponibles] = useState<MetodoPago[]>([]);
  const [billeteraSeleccionadaId, setBilleteraSeleccionadaId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del selector de cliente
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [modoCliente, setModoCliente] = useState<'BUSCAR' | 'RAPIDO'>('RAPIDO');
  const [searchClienteQuery, setSearchClienteQuery] = useState('');
  const [rapidoTipoDoc, setRapidoTipoDoc] = useState<'DNI' | 'RUC'>('DNI');
  const [rapidoNumDoc, setRapidoNumDoc] = useState('');
  const [rapidoNombre, setRapidoNombre] = useState('');
  const [rapidoTelefono, setRapidoTelefono] = useState('');
  const [countryDetails, setCountryDetails] = useState<CountryDetails>(() => getCachedTenantCountry());
  const [telefonoDirecto, setTelefonoDirecto] = useState<string>('');

  // 1. Cálculos de Subtotal, Descuentos y Total
  const subtotalProductos = useMemo(() => {
    return items.reduce((sum, it) => sum + it.subtotal, 0);
  }, [items]);

  const totalArticulos = useMemo(() => {
    return items.reduce((sum, it) => sum + it.cantidad, 0);
  }, [items]);

  const descuentoCalculado = useMemo(() => {
    const val = parseFloat(descuentoInput) || 0;
    if (val <= 0) return 0;
    if (tipoDescuento === 'PORCENTAJE') {
      const pct = Math.min(100, Math.max(0, val));
      return (subtotalProductos * pct) / 100;
    }
    return Math.min(subtotalProductos, Math.max(0, val));
  }, [subtotalProductos, descuentoInput, tipoDescuento]);

  const totalFinal = useMemo(() => {
    return Math.max(0, subtotalProductos - descuentoCalculado);
  }, [subtotalProductos, descuentoCalculado]);

  const cur = countryDetails.currencySymbol || 'S/';

  // Manejador de cambio de descuento manual
  const handleDescuentoChange = (val: string) => {
    setDescuentoInput(val);
    setPrecioFinalInput('');
  };

  // Manejador de cambio de Precio Final deseado
  const handlePrecioFinalChange = (val: string) => {
    setPrecioFinalInput(val);
    const pf = parseFloat(val);
    if (!isNaN(pf) && pf >= 0) {
      setTipoDescuento('MONTO');
      const diff = Math.max(0, subtotalProductos - pf);
      setDescuentoInput(diff > 0 ? diff.toFixed(2) : '0');
    } else {
      setDescuentoInput('0');
    }
  };

  // Cargar catálogos iniciales
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [metodos, clientesList, tenantCfg] = await Promise.all([
          configuracionService.getMetodosPago(),
          clientesService.getAll(),
          configuracionService.getConfiguracion().catch(() => null),
        ]);
        if (tenantCfg) {
          saveCachedTenantCountry(tenantCfg);
          setCountryDetails(getCountryDetails(
            tenantCfg.codigoIso,
            tenantCfg.codigoTelefonico,
            tenantCfg.monedaSimbolo,
            tenantCfg.monedaCodigo,
            tenantCfg.paisNombre
          ));
        }
        const normalized = (metodos || []).map((m: any) => ({
          ...m,
          idMetodoPago: m.id || m.idMetodoPago || 1,
          codigo: (m.codigoMetodo || m.codigo || '').toUpperCase(),
          nombre: m.nombreMostrado || m.nombre || '',
        }));
        setMetodosPagoDisponibles(normalized);

        const wallets = normalized.filter((m: any) =>
          ['YAPE', 'PLIN', 'BILLETERA', 'MERCADOPAGO', 'TUNKI', 'TRANSFERENCIA'].includes(
            (m.codigoMetodo || m.codigo || '').toUpperCase()
          ) && m.activo !== false
        );
        if (wallets.length > 0) {
          setBilleteraSeleccionadaId(wallets[0].id || wallets[0].idMetodoPago);
        }

        setClientes(clientesList || []);
      } catch (err) {
        console.error('Error cargando catálogos de cobro:', err);
      }
    };

    loadData();
    setReferenciaOperacion('');
    setClienteSeleccionado(null);
    setClienteCasual(null);
    setShowClienteSelector(false);
    setSearchClienteQuery('');
    setRapidoNumDoc('');
    setRapidoNombre('');
    setRapidoTelefono('');
    setTelefonoDirecto('');
    setDescuentoInput('0');
    setPrecioFinalInput('');
    setModoTab('VENTA');
  }, [isOpen]);

  // Sincronizar teléfono cuando se asigna o cambia el cliente
  useEffect(() => {
    if (clienteCasual?.telefono) {
      setTelefonoDirecto(clienteCasual.telefono.replace(/\D/g, ''));
    } else if (clienteSeleccionado?.telefono) {
      setTelefonoDirecto(clienteSeleccionado.telefono.replace(/\D/g, ''));
    }
  }, [clienteCasual, clienteSeleccionado]);

  // Sincronizar monto recibido con el total final
  useEffect(() => {
    if (!isOpen) return;
    setEfectivoRecibido(totalFinal.toFixed(2));
  }, [isOpen, totalFinal]);

  // Billeteras digitales activas filtradas
  const billeterasDisponibles = useMemo(() => {
    return metodosPagoDisponibles.filter((m: any) =>
      ['YAPE', 'PLIN', 'BILLETERA', 'MERCADOPAGO', 'TUNKI', 'TRANSFERENCIA'].includes(
        (m.codigoMetodo || m.codigo || '').toUpperCase()
      ) && m.activo !== false
    );
  }, [metodosPagoDisponibles]);

  const billeteraActual = useMemo(() => {
    if (billeterasDisponibles.length === 0) return null;
    return (
      billeterasDisponibles.find(
        (b: any) => (b.id || b.idMetodoPago) === billeteraSeleccionadaId
      ) || billeterasDisponibles[0]
    );
  }, [billeterasDisponibles, billeteraSeleccionadaId]);

  const recibidoNum = parseFloat(efectivoRecibido) || 0;
  const vuelto = metodoSeleccionado === 'EFECTIVO' ? Math.max(0, recibidoNum - totalFinal) : 0;
  const faltaPagar = metodoSeleccionado === 'EFECTIVO' ? Math.max(0, totalFinal - recibidoNum) : 0;

  // Filtrado de caseros para búsqueda
  const clientesFiltrados = clientes.filter((c) => {
    const q = searchClienteQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombreCompleto.toLowerCase().includes(q) ||
      (c.numeroDocumento && c.numeroDocumento.includes(q))
    );
  });

  const handleSelectTipoComprobante = (tipo: 'NOTA_VENTA' | 'BOLETA' | 'FACTURA') => {
    setTipoComprobante(tipo);
    if (tipo === 'FACTURA') {
      if (!clienteCasual && !clienteSeleccionado) {
        setModoCliente('RAPIDO');
        setRapidoTipoDoc('RUC');
        setShowClienteSelector(true);
      } else if (clienteCasual && clienteCasual.tipoDoc !== 'RUC') {
        setModoCliente('RAPIDO');
        setRapidoTipoDoc('RUC');
        setShowClienteSelector(true);
      }
    }
  };

  const handleGuardarClienteRapido = () => {
    if (!rapidoNombre.trim()) {
      toast.error('Ingresa el nombre o razón social del cliente.');
      return;
    }
    if (rapidoTipoDoc === 'RUC' && rapidoNumDoc.length !== 11) {
      toast.error('El RUC debe tener exactamente 11 dígitos.');
      return;
    }
    if (rapidoTipoDoc === 'DNI' && rapidoNumDoc && rapidoNumDoc.length !== 8) {
      toast.error('El DNI debe tener 8 dígitos.');
      return;
    }

    setClienteCasual({
      nombre: rapidoNombre.trim(),
      documento: rapidoNumDoc.trim(),
      tipoDoc: rapidoTipoDoc,
      telefono: rapidoTelefono.trim() || undefined,
    });
    setClienteSeleccionado(null);
    setShowClienteSelector(false);
    toast.success('Cliente asignado.');
  };

  // Generar Cotización
  const handleGenerarCotizacion = async () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío.');
      return;
    }

    const clientName = clienteCasual
      ? clienteCasual.nombre
      : clienteSeleccionado
      ? clienteSeleccionado.nombreCompleto
      : 'Público General';

    const clientDoc = clienteCasual
      ? clienteCasual.documento
      : clienteSeleccionado?.numeroDocumento;

    const clientPhone = telefonoDirecto.trim()
      ? telefonoDirecto.trim()
      : clienteCasual
      ? clienteCasual.telefono
      : clienteSeleccionado?.telefono;

    setIsSubmitting(true);
    try {
      const res = await cotizacionesService.crear({
        idCliente: clienteSeleccionado?.idCliente || null,
        clienteNombre: clientName,
        clienteDocumento: clientDoc || null,
        subtotal: subtotalProductos,
        descuento: Number(descuentoCalculado.toFixed(2)),
        total: totalFinal,
        validezDias,
        observaciones: 'Cotización emitida desde POS',
        items: items.map((it) => ({
          idProducto: it.producto.idProducto,
          cantidad: it.cantidad,
          precioUnitario: it.producto.precioVenta,
          descuento: 0,
          subtotal: it.subtotal,
        })),
      });

      playSuccess();
      triggerSuccess();

      const cotizacionData = {
        idVenta: res.idCotizacion,
        codigoVenta: res.codigoCotizacion,
        total: res.total,
        vuelto: 0,
        metodoPago: 'COTIZACIÓN',
        cliente: clientName,
        clienteDocumento: clientDoc,
        clienteTelefono: clientPhone,
        tipoComprobante: 'COTIZACION',
        items: items.map((it) => ({
          cantidad: it.cantidad,
          productoNombre: it.producto.nombre,
          precioUnitario: it.producto.precioVenta,
          subtotal: it.subtotal,
        })),
        subtotal: subtotalProductos,
        descuento: Number(descuentoCalculado.toFixed(2)),
        validezDias: res.validezDias || validezDias,
      };

      toast.success(`¡Cotización ${res.codigoCotizacion} generada con éxito!`);
      clearCart();
      onClose();
      onSaleSuccess(cotizacionData);
    } catch (err: any) {
      console.error('Error al registrar cotización en backend:', err);
      playSuccess();
      triggerSuccess();
      const fallbackCode = `COT-${Date.now().toString().slice(-6)}`;
      const cotizacionData = {
        idVenta: 0,
        codigoVenta: fallbackCode,
        total: totalFinal,
        vuelto: 0,
        metodoPago: 'COTIZACIÓN',
        cliente: clientName,
        clienteDocumento: clientDoc,
        clienteTelefono: clientPhone,
        tipoComprobante: 'COTIZACION',
        items: items.map((it) => ({
          cantidad: it.cantidad,
          productoNombre: it.producto.nombre,
          precioUnitario: it.producto.precioVenta,
          subtotal: it.subtotal,
        })),
        subtotal: subtotalProductos,
        descuento: Number(descuentoCalculado.toFixed(2)),
        validezDias,
      };
      toast.success('¡Cotización generada!');
      clearCart();
      onClose();
      onSaleSuccess(cotizacionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Procesar Venta Real
  const handleProcesarVenta = async () => {
    if (!turnoActivo) {
      toast.error('No hay una caja abierta en esta sucursal.');
      return;
    }

    if (items.length === 0) {
      toast.error('El carrito está vacío.');
      return;
    }

    if (metodoSeleccionado === 'EFECTIVO' && faltaPagar > 0.05) {
      toast.error(`El monto recibido es insuficiente. Faltan ${cur} ${faltaPagar.toFixed(2)}.`);
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
    const clienteTelefonoFinal = telefonoDirecto.trim()
      ? telefonoDirecto.trim()
      : clienteCasual
      ? clienteCasual.telefono
      : clienteSeleccionado?.telefono;

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

    let idMetodo = 1;
    let nombreMetodo: 'FIADO' | 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' = metodoSeleccionado;

    if (metodoSeleccionado === 'YAPE') {
      if (billeteraActual) {
        idMetodo = (billeteraActual as any).id || (billeteraActual as any).idMetodoPago || 2;
        const cod = ((billeteraActual as any).codigoMetodo || (billeteraActual as any).codigo || 'YAPE').toUpperCase();
        nombreMetodo = cod === 'PLIN' ? 'PLIN' : 'YAPE';
      } else {
        idMetodo = 2;
        nombreMetodo = 'YAPE';
      }
    } else if (metodoSeleccionado !== 'FIADO') {
      const metodoObj =
        metodosPagoDisponibles.find((m: any) => {
          const cod = (m.codigoMetodo || m.codigo || '').toUpperCase();
          return cod === metodoSeleccionado;
        }) || metodosPagoDisponibles[0];

      idMetodo = (metodoObj as any)?.id || (metodoObj as any)?.idMetodoPago || 1;
      nombreMetodo = metodoSeleccionado;
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
        subtotal: subtotalProductos,
        descuento: Number(descuentoCalculado.toFixed(2)),
        total: totalFinal,
        totalVenta: totalFinal,
        vuelto: Number(vuelto.toFixed(2)),
        metodoPago: nombreMetodo,
        isFiado: metodoSeleccionado === 'FIADO',
        detalles: items.map((it) => ({
          idProducto: it.producto.idProducto,
          cantidad: it.cantidad,
          precioUnitario: it.producto.precioVenta,
          subtotal: it.subtotal,
        })),
        pagos:
          metodoSeleccionado === 'FIADO'
            ? []
            : [
                {
                  idMetodoPago: idMetodo,
                  monto: totalFinal,
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
        total: totalFinal,
        vuelto: Number(vuelto.toFixed(2)),
        metodoPago: metodoSeleccionado,
        cliente: clienteNombreFinal || undefined,
        clienteDocumento: clienteDocFinal || undefined,
        clienteTelefono: clienteTelefonoFinal,
        tipoComprobante,
        items: items.map((it) => ({
          cantidad: it.cantidad,
          productoNombre: it.producto.nombre,
          precioUnitario: it.producto.precioVenta,
          subtotal: it.subtotal,
        })),
        subtotal: subtotalProductos,
        descuento: Number(descuentoCalculado.toFixed(2)),
      });
    } catch (err: any) {
      console.error('Error al cobrar:', err);
      const errorObj = err?.response?.data || err;
      const msg =
        errorObj?.errors?.[0] ||
        errorObj?.detalles ||
        errorObj?.message ||
        'Error al registrar la venta';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modoTab === 'VENTA' ? 'Cobrar Venta' : 'Generar Cotización'}
      position="bottom"
    >
      <div className="flex flex-col space-y-3.5 max-h-[82vh] overflow-y-auto no-scrollbar pr-0.5">
        {/* Pestañas Superiores de Modo: Venta vs Cotización */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setModoTab('VENTA')}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              modoTab === 'VENTA'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>Venta</span>
          </button>
          <button
            type="button"
            onClick={() => setModoTab('COTIZACION')}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              modoTab === 'COTIZACION'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Cotización</span>
          </button>
        </div>

        {/* 1. SECCIÓN DE ARTÍCULOS QUE VA A COMPRAR / COTIZAR */}
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-500" />
              <span>{totalArticulos} {totalArticulos === 1 ? 'artículo' : 'artículos'}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs space-y-0.5">
            {items.map((it) => (
              <div key={it.producto.idProducto} className="py-1.5 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-800 truncate">{it.producto.nombre}</p>
                  <span className="text-[10px] text-slate-400">
                    {cur} {it.producto.precioVenta.toFixed(2)} c/u
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500 mr-2.5">
                    x{it.cantidad}
                  </span>
                  <span className="font-black text-slate-800">
                    {cur} {it.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. SECCIÓN DE SUBTOTAL, DESCUENTO Y PRECIO FINAL */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-xs">
          {/* Subtotal */}
          <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
            <span>Subtotal productos</span>
            <span className="font-bold text-slate-800">{cur} {subtotalProductos.toFixed(2)}</span>
          </div>

          {/* Total a Cobrar Destacado */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {modoTab === 'VENTA' ? 'Total a Cobrar' : 'Total a Cotizar'}
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {cur} {totalFinal.toFixed(2)}
            </span>
          </div>

          {/* Campo de Descuento con selector S/ o % */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700">Descuento</label>
              {descuentoCalculado > 0 && (
                <span className="text-[11px] font-bold text-emerald-600">
                  Ahorro: - {cur} {descuentoCalculado.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0"
                  value={descuentoInput === '0' ? '' : descuentoInput}
                  onChange={(e) => handleDescuentoChange(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              {/* Toggle S/ vs % */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTipoDescuento('MONTO')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    tipoDescuento === 'MONTO'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tipoDescuento === 'MONTO' && <Check className="w-3 h-3 inline mr-0.5 stroke-[3]" />}
                  {cur}
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDescuento('PORCENTAJE')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    tipoDescuento === 'PORCENTAJE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tipoDescuento === 'PORCENTAJE' && <Check className="w-3 h-3 inline mr-0.5 stroke-[3]" />}
                  %
                </button>
              </div>
            </div>
          </div>

          {/* Precio Final (Opcional) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
              Precio Final (Opcional)
            </label>
            <p className="text-[10px] text-slate-400 mb-1.5 leading-tight">
              Escribe a cuánto quieres que quede toda la cuenta y se calculará el descuento automático.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {cur}
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder={subtotalProductos.toFixed(2)}
                value={precioFinalInput}
                onChange={(e) => handlePrecioFinalChange(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl pl-8 pr-3 text-xs font-bold text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. VISTA MODAL: SELECTOR DE CLIENTE (DNI / RUC / CASERO) */}
        {showClienteSelector ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setShowClienteSelector(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Cliente para {modoTab === 'COTIZACION' ? 'Cotización' : tipoComprobante.replace('_', ' ')}
              </span>
            </div>

            {/* Pestañas: DNI/Rápido o Buscar Casero */}
            <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setModoCliente('RAPIDO')}
                className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  modoCliente === 'RAPIDO'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {tipoComprobante === 'FACTURA' && modoTab === 'VENTA' ? 'Ingresar RUC' : 'DNI / Rápido'}
              </button>
              <button
                type="button"
                onClick={() => setModoCliente('BUSCAR')}
                className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  modoCliente === 'BUSCAR'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Buscar Casero
              </button>
            </div>

            {modoCliente === 'RAPIDO' && (
              <div className="space-y-2.5">
                {tipoComprobante === 'FACTURA' && modoTab === 'VENTA' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-center gap-2 text-amber-800 text-[11px] font-bold">
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
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs outline-none font-bold text-slate-800"
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
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs outline-none font-bold text-slate-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between px-1 mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Celular / WhatsApp (Opcional)
                    </label>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Para enviar PDF
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-2.5 flex items-center gap-1 text-[11px] font-black text-slate-500 select-none pointer-events-none">
                      <span>{countryDetails.flag}</span>
                      <span>+{countryDetails.phoneCode}</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={countryDetails.phoneLength}
                      placeholder={countryDetails.placeholder}
                      value={rapidoTelefono}
                      onChange={(e) => setRapidoTelefono(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-10 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-20 pr-3 text-xs font-bold text-slate-800 outline-none transition-colors tracking-wide font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGuardarClienteRapido}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Cliente</span>
                </button>
              </div>
            )}

            {modoCliente === 'BUSCAR' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o DNI del casero..."
                    value={searchClienteQuery}
                    onChange={(e) => setSearchClienteQuery(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-xs outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {clientesFiltrados.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No se encontraron caseros registrados.
                    </p>
                  ) : (
                    clientesFiltrados.map((c) => (
                      <button
                        key={c.idCliente}
                        type="button"
                        onClick={() => {
                          setClienteSeleccionado(c);
                          setClienteCasual(null);
                          setShowClienteSelector(false);
                          toast.success(`Casero ${c.nombreCompleto} seleccionado.`);
                        }}
                        className="w-full p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-800">{c.nombreCompleto}</p>
                          <span className="text-[10px] text-slate-400">
                            {c.numeroDocumento || 'Sin DNI'} • Límite S/ {c.limiteCredito.toFixed(2)}
                          </span>
                        </div>
                        {c.saldoDeudor > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
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
          /* 4. FLUJO PRINCIPAL: VENTA vs COTIZACIÓN */
          <>
            {/* Barra de Resumen del Cliente */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    clienteCasual || clienteSeleccionado
                      ? 'bg-emerald-100 text-emerald-700'
                      : tipoComprobante === 'FACTURA' && modoTab === 'VENTA'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {tipoComprobante === 'FACTURA' && modoTab === 'VENTA' ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {modoTab === 'COTIZACION' ? 'Cliente para la Cotización' : 'Cliente del comprobante'}
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
                      : tipoComprobante === 'FACTURA' && modoTab === 'VENTA'
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
                      setModoCliente('RAPIDO');
                      if (tipoComprobante === 'FACTURA' && modoTab === 'VENTA') setRapidoTipoDoc('RUC');
                      setShowClienteSelector(true);
                    }}
                    className="text-[11px] font-black px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>DNI / Nombre</span>
                  </button>
                )}
              </div>
            </div>

            {/* Campo Didáctico: WhatsApp del Cliente para enviar Comprobante o Cotización */}
            <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-2.5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between px-0.5">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp del Cliente</span>
                </label>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                  Para enviar PDF por WhatsApp
                </span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-2.5 flex items-center gap-1 text-[11px] font-black text-slate-700 select-none pointer-events-none">
                  <span>{countryDetails.flag}</span>
                  <span>+{countryDetails.phoneCode}</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={countryDetails.phoneLength}
                  placeholder={countryDetails.placeholder}
                  value={telefonoDirecto}
                  onChange={(e) => setTelefonoDirecto(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-10 bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl pl-20 pr-8 text-xs font-black text-slate-800 outline-none transition-colors tracking-wider font-mono shadow-xs"
                />
                {telefonoDirecto && (
                  <button
                    type="button"
                    onClick={() => setTelefonoDirecto('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* SI ES MODO COTIZACIÓN */}
            {modoTab === 'COTIZACION' ? (
              <div className="space-y-3 bg-blue-50/50 border border-blue-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Validez de la Cotización:</span>
                  </span>
                  <div className="flex gap-1">
                    {[3, 7, 15, 30].map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => setValidezDias(dias)}
                        className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          validezDias === dias
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {dias}d
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  Al pulsar generar, se emitirá una proforma en ticket térmico lista para imprimir o compartir por WhatsApp con el cliente.
                </p>

                <button
                  type="button"
                  onClick={handleGenerarCotizacion}
                  disabled={items.length === 0 || isSubmitting}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isSubmitting ? 'GENERANDO COTIZACIÓN...' : `GENERAR COTIZACIÓN (${cur} ${totalFinal.toFixed(2)})`}</span>
                </button>
              </div>
            ) : (
              /* SI ES MODO VENTA */
              <div className="space-y-3">
                {/* Selector de Comprobante */}
                <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase px-1">
                    Comprobante
                  </span>
                  <div className="flex gap-1">
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

                {/* Selector de Métodos de Pago */}
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

                {/* EFECTIVO: Teclado nativo del celular + botones rápidos de billetes */}
                {metodoSeleccionado === 'EFECTIVO' && (
                  <div className="space-y-3 bg-slate-50/80 border border-slate-200 rounded-2xl p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Recibido</span>
                        <p className="text-base font-black text-slate-800">
                          {cur} {recibidoNum ? recibidoNum.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div
                        className={`border rounded-xl p-2 text-center shadow-xs ${
                          vuelto > 0
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase">
                          {faltaPagar > 0 ? 'Faltan' : 'Vuelto'}
                        </span>
                        <p
                          className={`text-base font-black ${
                            faltaPagar > 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {cur} {faltaPagar > 0 ? faltaPagar.toFixed(2) : vuelto.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-0.5">
                        Efectivo Recibido (Usa teclado del celular)
                      </label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                          {cur}
                        </span>
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={efectivoRecibido}
                          onChange={(e) => setEfectivoRecibido(e.target.value)}
                          placeholder={totalFinal.toFixed(2)}
                          className="w-full h-11 bg-white border-2 border-slate-200 focus:border-red-500 rounded-xl pl-8 pr-16 text-base font-black text-slate-900 outline-none transition-all shadow-xs"
                        />
                        {efectivoRecibido && (
                          <button
                            type="button"
                            onClick={() => setEfectivoRecibido('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 px-1 py-0.5 rounded cursor-pointer"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Botones de Efectivo Rápido */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEfectivoRecibido(totalFinal.toFixed(2))}
                        className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-black transition-all cursor-pointer text-center"
                      >
                        Exacto
                      </button>
                      {[10, 20, 50, 100].map((monto) => (
                        <button
                          key={monto}
                          type="button"
                          onClick={() => setEfectivoRecibido(monto.toString())}
                          className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer text-center"
                        >
                          {cur} {monto}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleProcesarVenta}
                      disabled={isSubmitting || items.length === 0}
                      className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] mt-1"
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>{isSubmitting ? 'PROCESANDO...' : `COBRAR ${cur} ${totalFinal.toFixed(2)}`}</span>
                    </button>
                  </div>
                )}

                {/* YAPE / PLIN / BILLETERAS DIGITALES DINÁMICAS */}
                {metodoSeleccionado === 'YAPE' && (
                  <div className="bg-gradient-to-b from-purple-50/80 to-pink-50/80 border border-purple-200 rounded-3xl p-3.5 flex flex-col items-center text-center space-y-3 shadow-xs">
                    {/* Selector de billeteras activas (si hay más de 1) */}
                    {billeterasDisponibles.length > 1 && (
                      <div className="w-full flex items-center gap-1.5 p-1 bg-white/90 rounded-2xl border border-purple-200 overflow-x-auto shadow-xs">
                        {billeterasDisponibles.map((b) => {
                          const bId = b.id || b.idMetodoPago;
                          const isSelected = (billeteraActual?.id || billeteraActual?.idMetodoPago) === bId;
                          const cod = (b.codigoMetodo || b.codigo || '').toUpperCase();
                          const isYape = cod === 'YAPE';
                          const isPlin = cod === 'PLIN';

                          return (
                            <button
                              key={bId}
                              type="button"
                              onClick={() => setBilleteraSeleccionadaId(bId)}
                              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                                isSelected
                                  ? isYape
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : isPlin
                                    ? 'bg-cyan-600 text-white shadow-xs'
                                    : 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <QrCode className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{b.nombreMostrado || b.nombre}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Contenedor del Código QR */}
                    {billeteraActual?.imagenQRUrl ? (
                      <div className="w-48 h-48 bg-white border-2 border-purple-300 rounded-2xl p-2 shadow-sm flex items-center justify-center relative">
                        <img
                          src={getStorageUrl(billeteraActual.imagenQRUrl)}
                          alt={billeteraActual.nombreMostrado}
                          className="w-full h-full object-contain rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-40 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white p-3 text-center shadow-sm">
                        <QrCode className="w-12 h-12 text-purple-400 mb-1" />
                        <span className="text-[10px] font-black tracking-wider text-purple-300 uppercase">
                          {billeteraActual?.nombreMostrado || 'YAPE / PLIN'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          Sin QR adjunto en Configuración
                        </span>
                      </div>
                    )}

                    {/* Datos de la cuenta (Titular, Celular, Monto) */}
                    <div className="bg-white/95 border border-purple-200/80 rounded-2xl p-2.5 w-full text-center space-y-1 shadow-xs">
                      <div className="text-xs font-black text-slate-800">
                        {billeteraActual?.nombreMostrado || 'Billetera Digital'}
                      </div>
                      {billeteraActual?.numeroTitular && (
                        <div className="text-xs font-mono font-bold text-purple-700 flex items-center justify-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                          <span>{billeteraActual.numeroTitular}</span>
                        </div>
                      )}
                      {billeteraActual?.nombreTitular && (
                        <div className="text-[11px] text-slate-600">
                          Titular: <strong className="text-slate-800">{billeteraActual.nombreTitular}</strong>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-purple-100 flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total a Cobrar</span>
                        <span className="text-sm font-black text-purple-700">
                          {cur} {totalFinal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* N° de Operación */}
                    <div className="w-full text-left">
                      <label className="text-[10px] font-bold text-purple-900 uppercase px-1">
                        {billeteraActual?.requiereComprobanteRef
                          ? 'N° de Operación (Requerido)'
                          : 'N° de Operación (Opcional)'}
                      </label>
                      <input
                        type="text"
                        placeholder="ej: 981240"
                        value={referenciaOperacion}
                        onChange={(e) => setReferenciaOperacion(e.target.value)}
                        className="w-full h-10 bg-white border border-purple-300 rounded-xl px-3 text-xs mt-1 outline-none font-bold text-slate-800 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 shadow-xs"
                      />
                    </div>

                    {/* Botón de Confirmación */}
                    <button
                      type="button"
                      onClick={handleProcesarVenta}
                      disabled={isSubmitting}
                      className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span>
                        CONFIRMAR PAGO {billeteraActual?.nombreMostrado?.toUpperCase() || 'YAPE / PLIN'}
                      </span>
                    </button>
                  </div>
                )}

                {/* TARJETA */}
                {metodoSeleccionado === 'TARJETA' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                    <p className="text-xs font-semibold text-slate-600 text-center">
                      Pasa la tarjeta en el POS por {cur} {totalFinal.toFixed(2)}
                    </p>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">
                        N° de Operación / Referencia POS
                      </label>
                      <input
                        type="text"
                        placeholder="ej: 004821"
                        value={referenciaOperacion}
                        onChange={(e) => setReferenciaOperacion(e.target.value)}
                        className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs mt-1 outline-none font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleProcesarVenta}
                      disabled={isSubmitting}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span>CONFIRMAR PAGO CON TARJETA</span>
                    </button>
                  </div>
                )}

                {/* FIADO */}
                {metodoSeleccionado === 'FIADO' && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-2.5">
                    <p className="text-xs font-bold text-amber-900">
                      Registrar deuda a cuenta del cliente casero
                    </p>

                    <div>
                      <label className="text-[10px] font-bold text-amber-800 uppercase px-1">
                        Selecciona al Cliente Casero
                      </label>
                      <select
                        className="w-full h-11 bg-white border border-amber-300 rounded-xl px-3 text-xs mt-1 font-semibold text-slate-800 outline-none"
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
                            {c.nombreCompleto} (Deuda actual: {cur} {c.saldoDeudor.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {clienteSeleccionado && (
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Límite de Crédito:</span>
                          <span className="font-bold text-slate-800">
                            {cur} {clienteSeleccionado.limiteCredito.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Deuda previa:</span>
                          <span className="font-bold text-rose-600">
                            {cur} {clienteSeleccionado.saldoDeudor.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 font-extrabold">
                          <span className="text-slate-700">Nueva deuda total:</span>
                          <span className="text-rose-700">
                            {cur} {(clienteSeleccionado.saldoDeudor + totalFinal).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleProcesarVenta}
                      disabled={isSubmitting || !clienteSeleccionado}
                      className="w-full h-12 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <UserCheck className="w-5 h-5" />
                      <span>CONFIRMAR VENTA AL CRÉDITO (FIADO)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
