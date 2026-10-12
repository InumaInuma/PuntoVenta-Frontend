import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Share2, Printer, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ventasService } from '@/services/backend/ventasService';
import { printThermalReceipt } from '@/services/printer/thermalReceiptService';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    idVenta: number;
    codigoVenta: string;
    total: number;
    vuelto: number;
    metodoPago: string;
    cliente?: string;
    clienteDocumento?: string;
    tipoComprobante?: string;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  saleData,
}) => {
  const { user } = useAuth();
  const [ticketInfo, setTicketInfo] = useState<any | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Cargar información completa del ticket de venta desde el backend
  useEffect(() => {
    if (!isOpen || !saleData?.idVenta) {
      setTicketInfo(null);
      return;
    }

    let isMounted = true;
    const fetchTicket = async () => {
      setIsLoadingTicket(true);
      try {
        const data = await ventasService.getTicket(saleData.idVenta);
        if (isMounted) {
          setTicketInfo(data);
        }
      } catch (err) {
        console.warn('No se pudo obtener el ticket completo del backend:', err);
      } finally {
        if (isMounted) {
          setIsLoadingTicket(false);
        }
      }
    };

    fetchTicket();

    return () => {
      isMounted = false;
    };
  }, [isOpen, saleData?.idVenta]);

  if (!saleData) return null;

  const cabecera = ticketInfo?.cabecera;
  const items = ticketInfo?.detalle || [];
  const logo = cabecera?.logoUrl || localStorage.getItem('almain_pos_logo_url');
  const nombreNegocio = cabecera?.nombreComercial || user?.nombreEmpresa || 'Bodega Don Pepe';
  const ruc = cabecera?.rucOIdentificacion || localStorage.getItem('almain_pos_ruc') || '20601234567';
  const direccion = cabecera?.direccionComercio || localStorage.getItem('almain_pos_address') || '';
  const telefono = cabecera?.telefonoComercio || localStorage.getItem('almain_pos_yape_phone') || '';
  const rawTipo = (cabecera?.comprobanteTipoNombre || saleData?.tipoComprobante || 'NOTA_VENTA').toUpperCase();
  const tipoDoc =
    rawTipo.includes('BOLETA') || rawTipo === 'BOL'
      ? 'BOLETA DE VENTA'
      : rawTipo.includes('FACTURA') || rawTipo === 'FAC'
      ? 'FACTURA'
      : 'NOTA DE VENTA';

  const etiquetaDoc =
    tipoDoc === 'NOTA DE VENTA'
      ? 'Nota de Venta'
      : tipoDoc === 'BOLETA DE VENTA'
      ? 'Boleta'
      : 'Factura';

  const fecha = cabecera?.fechaVenta ? new Date(cabecera.fechaVenta) : new Date();
  const cajero = cabecera?.cajeroNombre || user?.nombre || 'Dueño / Cajero';
  const pieTicket = cabecera?.textoPieTicket || localStorage.getItem('almain_pos_ticket_footer') || '¡Gracias por su preferencia! Revise su vuelto.';
  const anchoPapel = (cabecera?.anchoTicketMm === 80 ? '80mm' : '58mm') as '58mm' | '80mm';

  const clienteNombre = cabecera?.clienteNombre || saleData.cliente;
  const clienteDoc = cabecera?.clienteDocumento || saleData.clienteDocumento;

  const handleShareWhatsApp = () => {
    let itemsText = '';
    if (items.length > 0) {
      itemsText = '\n\n*Productos:*\n' + items.map((it: any) => `• ${it.cantidad}x ${it.productoNombre} - S/ ${Number(it.subtotal).toFixed(2)}`).join('\n');
    }

    const texto = `¡Hola! Gracias por tu compra en *${nombreNegocio}*.\n\n` +
      `🧾 *${tipoDoc}:* #${saleData.codigoVenta}\n` +
      `📅 *Fecha:* ${fecha.toLocaleString('es-PE')}\n` +
      (clienteNombre ? `👤 *Cliente:* ${clienteNombre} ${clienteDoc ? `(${clienteDoc})` : ''}\n` : '') +
      itemsText +
      `\n\n💰 *Total:* S/ ${saleData.total.toFixed(2)}\n` +
      `💳 *Método de Pago:* ${saleData.metodoPago}\n` +
      (saleData.vuelto > 0 ? `💵 *Vuelto:* S/ ${saleData.vuelto.toFixed(2)}\n` : '') +
      `\n${pieTicket}`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printThermalReceipt({
        logoUrl: logo,
        nombreComercial: nombreNegocio,
        razonSocial: cabecera?.razonSocial,
        rucOIdentificacion: ruc,
        direccion,
        telefono,
        tipoComprobante: tipoDoc,
        numeroComprobante: saleData.codigoVenta,
        fecha,
        cajero,
        cliente: clienteNombre,
        clienteDocumento: clienteDoc,
        items: items.length > 0
          ? items.map((it: any) => ({
              cantidad: it.cantidad,
              nombre: it.productoNombre,
              precioUnitario: it.precioUnitario,
              subtotal: it.subtotal,
            }))
          : [
              {
                cantidad: 1,
                nombre: 'Venta General',
                precioUnitario: saleData.total,
                subtotal: saleData.total,
              },
            ],
        total: saleData.total,
        metodoPago: saleData.metodoPago,
        montoRecibido: cabecera?.montoEfectivoRecibido,
        vuelto: saleData.vuelto,
        textoPieTicket: pieTicket,
        anchoPapel,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Venta Completada" position="center">
      <div className="flex flex-col items-center text-center space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar py-1">
        {/* Ícono de Éxito */}
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          <h4 className="text-lg font-black text-slate-800">
            ¡Cobro Exitoso!
          </h4>
          <p className="text-xs font-semibold text-slate-500">
            Código: <span className="text-slate-800 font-bold font-mono">#{saleData.codigoVenta}</span>
          </p>
        </div>

        {/* Simulación Realista de Ticket Térmico (Idéntico a la Imagen 1 de Referencia) */}
        <div className="w-full bg-slate-50/90 border-2 border-dashed border-slate-300 rounded-2xl p-4 text-left font-mono text-xs space-y-2 text-slate-800 shadow-inner">
          {/* Logo del Negocio */}
          {logo && (
            <div className="text-center pb-1">
              <img
                src={logo}
                alt="Logo del negocio"
                className="max-h-16 max-w-[120px] mx-auto object-contain filter grayscale contrast-125"
              />
            </div>
          )}

          {/* Encabezado del Comercio */}
          <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300">
            <p className="text-sm font-black uppercase text-slate-900">{nombreNegocio}</p>
            {ruc && <p className="text-[10px] text-slate-600 font-bold">RUC: {ruc}</p>}
            {direccion && <p className="text-[10px] text-slate-500">{direccion}</p>}
            {telefono && <p className="text-[10px] text-slate-500">Tel: {telefono}</p>}
          </div>

          {/* Datos del Documento */}
          <div className="text-center font-black uppercase text-xs pt-0.5">
            {tipoDoc}
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>{etiquetaDoc}:</span>
            <span className="font-bold text-slate-800">#{saleData.codigoVenta}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>Fecha:</span>
            <span>{fecha.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>Atendido por:</span>
            <span className="font-bold">{cajero}</span>
          </div>
          {clienteNombre && (
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Cliente:</span>
              <span className="font-bold text-slate-800">{clienteNombre}</span>
            </div>
          )}
          {clienteDoc && (
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>{tipoDoc === 'FACTURA' ? 'RUC:' : 'Doc / DNI:'}</span>
              <span className="font-bold text-slate-800">{clienteDoc}</span>
            </div>
          )}

          {/* Cabecera y Lista de Productos (Como la Imagen 1) */}
          <div className="pt-2 border-t border-dashed border-slate-300">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase pb-1 border-b border-dashed border-slate-200">
              <span className="w-8">Cant</span>
              <span className="flex-1">Producto</span>
              <span className="text-right">Total</span>
            </div>

            {isLoadingTicket ? (
              <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                <span>Cargando productos...</span>
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-1.5 pt-1.5 max-h-40 overflow-y-auto no-scrollbar">
                {items.map((it: any, idx: number) => (
                  <div key={idx} className="text-[11px]">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span className="w-8 shrink-0">{it.cantidad}</span>
                      <span className="flex-1 truncate pr-2">{it.productoNombre}</span>
                      <span className="text-right shrink-0">S/ {Number(it.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 pl-8">
                      P. Unit: S/ {Number(it.precioUnitario).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 text-[11px] text-slate-600">
                <span>Venta de mostrador</span>
              </div>
            )}
          </div>

          {/* Totales y Forma de Pago */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between text-base font-black text-slate-900">
              <span>TOTAL:</span>
              <span>S/ {saleData.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span>Pago:</span>
              <span className="font-bold">{saleData.metodoPago}</span>
            </div>

            {cabecera?.montoEfectivoRecibido && cabecera.montoEfectivoRecibido > 0 ? (
              <div className="flex justify-between text-[11px]">
                <span>Pago con:</span>
                <span>S/ {cabecera.montoEfectivoRecibido.toFixed(2)}</span>
              </div>
            ) : null}

            {saleData.vuelto > 0 && (
              <div className="flex justify-between font-bold text-emerald-700 text-[11px]">
                <span>Vuelto:</span>
                <span>S/ {saleData.vuelto.toFixed(2)}</span>
              </div>
            )}

            {saleData.cliente && (
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Cliente:</span>
                <span className="font-bold truncate max-w-[150px]">{saleData.cliente}</span>
              </div>
            )}
          </div>

          {/* Pie de Página */}
          <div className="pt-2 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 italic">
            {pieTicket}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="w-full space-y-2 pt-1">
          {/* Botón WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>ENVIAR TICKET POR WHATSAPP</span>
          </button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handlePrint}
              isLoading={isPrinting}
              icon={<Printer className="w-4 h-4 text-slate-700" />}
              className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50 font-bold"
            >
              Imprimir Ticket
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={onClose}
              icon={<Check className="w-4 h-4" />}
            >
              Listo
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default ReceiptModal;
