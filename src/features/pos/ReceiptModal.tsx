import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Share2, Printer, Check, Loader2, FileText, Download, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ventasService } from '@/services/backend/ventasService';
import { printThermalReceipt } from '@/services/printer/thermalReceiptService';
import {
  generateReceiptPdfBytes,
  downloadReceiptPdf,
  shareReceiptPdfToWhatsApp,
  type PdfReceiptData,
} from '@/services/printer/pdfReceiptService';
import { getCachedTenantCountry, getCountryDetails, saveCachedTenantCountry, type CountryDetails } from '@/utils/countryHelper';
import { configuracionService } from '@/services/backend/configuracionService';
import toast from 'react-hot-toast';

export interface ReceiptSaleData {
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
}

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: ReceiptSaleData | null;
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [countryDetails, setCountryDetails] = useState<CountryDetails>(() => getCachedTenantCountry());
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState<string>('');
  const [isAskingPhone, setIsAskingPhone] = useState<boolean>(false);

  // Sincronizar país y teléfono del cliente cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // 1. Cargar configuración de país del comercio
      configuracionService.getConfiguracion().then((cfg) => {
        if (cfg) {
          saveCachedTenantCountry(cfg);
          setCountryDetails(getCountryDetails(
            cfg.codigoIso,
            cfg.codigoTelefonico,
            cfg.monedaSimbolo,
            cfg.monedaCodigo,
            cfg.paisNombre
          ));
        }
      }).catch(() => {
        setCountryDetails(getCachedTenantCountry());
      });

      // 2. Sincronizar celular del cliente
      if (saleData) {
        const initialPhone = (saleData.clienteTelefono || '').replace(/\D/g, '');
        setTelefonoWhatsApp(initialPhone);
        // Si no hay teléfono registrado, abrir directamente la tarjeta para pedir el número
        setIsAskingPhone(!initialPhone);
      }
    }
  }, [isOpen, saleData?.codigoVenta]);

  // Cargar información completa del ticket de venta desde el backend (solo si es venta registrada)
  useEffect(() => {
    if (!isOpen || !saleData?.idVenta || saleData.idVenta === 0) {
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

  const isCotizacion = saleData.tipoComprobante === 'COTIZACION' || saleData.codigoVenta.startsWith('COT');
  const cabecera = ticketInfo?.cabecera;
  const items = ticketInfo?.detalle || saleData.items || [];
  const logo = cabecera?.logoUrl || localStorage.getItem('almain_pos_logo_url');
  const nombreNegocio = cabecera?.nombreComercial || user?.nombreEmpresa || 'Comercio';
  const ruc = cabecera?.rucOIdentificacion || localStorage.getItem('almain_pos_ruc') || '';
  const direccion = cabecera?.direccionComercio || localStorage.getItem('almain_pos_address') || '';
  const telefono = cabecera?.telefonoComercio || localStorage.getItem('almain_pos_yape_phone') || '';
  const rawTipo = (cabecera?.comprobanteTipoNombre || saleData?.tipoComprobante || 'NOTA_VENTA').toUpperCase();
  const tipoDoc =
    isCotizacion
      ? 'COTIZACIÓN / PROFORMA'
      : rawTipo.includes('BOLETA') || rawTipo === 'BOL'
      ? 'BOLETA DE VENTA'
      : rawTipo.includes('FACTURA') || rawTipo === 'FAC'
      ? 'FACTURA'
      : 'NOTA DE VENTA';

  const etiquetaDoc =
    isCotizacion
      ? 'Cotización'
      : tipoDoc === 'NOTA DE VENTA'
      ? 'Nota de Venta'
      : tipoDoc === 'BOLETA DE VENTA'
      ? 'Boleta'
      : 'Factura';

  const fecha = cabecera?.fechaVenta ? new Date(cabecera.fechaVenta) : new Date();
  const cajero = cabecera?.cajeroNombre || user?.nombre || 'Dueño / Cajero';
  const pieTicket = isCotizacion
    ? 'Cotización válida por 7 días calendario. No tiene valor fiscal.'
    : (cabecera?.textoPieTicket || localStorage.getItem('almain_pos_ticket_footer') || '¡Gracias por su preferencia! Revise su vuelto.');
  const anchoPapel = (cabecera?.anchoTicketMm === 80 ? '80mm' : '58mm') as '58mm' | '80mm';

  const clienteNombre = cabecera?.clienteNombre || saleData.cliente;
  const clienteDoc = cabecera?.clienteDocumento || saleData.clienteDocumento;

  const getPdfData = (): PdfReceiptData => {
    return {
      tipoDoc,
      isCotizacion,
      codigo: saleData.codigoVenta,
      fecha,
      nombreNegocio,
      ruc,
      direccion,
      telefono,
      cajero,
      clienteNombre,
      clienteDocumento: clienteDoc,
      monedaSimbolo: countryDetails.currencySymbol,
      items: items.map((it: any) => ({
        cantidad: it.cantidad,
        productoNombre: it.productoNombre || it.nombre || 'Producto',
        precioUnitario: Number(it.precioUnitario ?? it.precioVenta ?? 0),
        subtotal: Number(it.subtotal ?? 0),
      })),
      subtotal: saleData.subtotal,
      descuento: saleData.descuento,
      total: saleData.total,
      metodoPago: saleData.metodoPago,
      vuelto: saleData.vuelto,
      validezDias: saleData.validezDias,
      pieTicket,
    };
  };

  const handleShareWhatsAppPdf = async (targetPhone?: string, preferNative: boolean = false) => {
    const rawNumber = targetPhone !== undefined ? targetPhone : telefonoWhatsApp;
    const cleanPhone = rawNumber.replace(/\D/g, '');

    setIsGeneratingPdf(true);
    try {
      const pdfData = getPdfData();
      const pdfBytes = await generateReceiptPdfBytes(pdfData);

      const cleanCode = saleData.codigoVenta.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = isCotizacion
        ? `Cotizacion_${cleanCode}.pdf`
        : `Comprobante_${cleanCode}.pdf`;

      const cur = countryDetails.currencySymbol || 'S/';

      let itemsText = '';
      if (items.length > 0) {
        itemsText = '\n\n*Productos:*\n' + items.map((it: any) => `• ${it.cantidad}x ${it.productoNombre} - ${cur} ${Number(it.subtotal).toFixed(2)}`).join('\n');
      }

      const descuentoText = saleData.descuento && saleData.descuento > 0
        ? `\n🏷️ *Descuento:* - ${cur} ${saleData.descuento.toFixed(2)}`
        : '';

      const texto = isCotizacion
        ? `¡Hola! Te compartimos la *Cotización en PDF* de *${nombreNegocio}*.\n\n` +
          `📄 *Cotización:* #${saleData.codigoVenta}\n` +
          `📅 *Fecha:* ${fecha.toLocaleString('es-PE')}\n` +
          `⏳ *Validez:* ${saleData.validezDias || 7} días calendario\n` +
          (clienteNombre ? `👤 *Cliente:* ${clienteNombre} ${clienteDoc ? `(${clienteDoc})` : ''}\n` : '') +
          itemsText +
          descuentoText +
          `\n\n💰 *Total Cotizado:* ${cur} ${saleData.total.toFixed(2)}\n\n` +
          `📎 _Te adjuntamos el documento PDF oficial con el detalle._`
        : `¡Hola! Gracias por tu compra en *${nombreNegocio}*.\n\n` +
          `🧾 *${tipoDoc}:* #${saleData.codigoVenta}\n` +
          `📅 *Fecha:* ${fecha.toLocaleString('es-PE')}\n` +
          (clienteNombre ? `👤 *Cliente:* ${clienteNombre} ${clienteDoc ? `(${clienteDoc})` : ''}\n` : '') +
          itemsText +
          descuentoText +
          `\n\n💰 *Total:* ${cur} ${saleData.total.toFixed(2)}\n` +
          `💳 *Método de Pago:* ${saleData.metodoPago}\n` +
          (saleData.vuelto > 0 ? `💵 *Vuelto:* ${cur} ${saleData.vuelto.toFixed(2)}\n` : '') +
          `\n${pieTicket}\n\n` +
          `📎 _Adjunto comprobante emitido en PDF._`;

      const result = await shareReceiptPdfToWhatsApp(
        pdfBytes,
        fileName,
        texto,
        cleanPhone || undefined,
        countryDetails.phoneCode,
        preferNative
      );
      if (result.method === 'whatsapp_direct') {
        toast.success(cleanPhone ? `¡Abriendo WhatsApp con +${countryDetails.phoneCode} ${cleanPhone}!` : '¡Abriendo WhatsApp!');
      } else if (result.method === 'native') {
        toast.success(cleanPhone ? `¡PDF preparado para enviar a +${countryDetails.phoneCode} ${cleanPhone}!` : '¡PDF preparado para compartir!');
      } else if (result.method === 'download_and_whatsapp') {
        toast.success(cleanPhone ? `PDF descargado. ¡Se abrió WhatsApp con +${countryDetails.phoneCode} ${cleanPhone}!` : 'PDF descargado. ¡Se abrió WhatsApp!');
      }
      setIsAskingPhone(false);
      setIsAskingPhone(false);
    } catch (err: any) {
      console.error('Error al generar o compartir PDF:', err);
      toast.error('No se pudo generar el archivo PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const pdfData = getPdfData();
      const pdfBytes = await generateReceiptPdfBytes(pdfData);
      const cleanCode = saleData.codigoVenta.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = isCotizacion
        ? `Cotizacion_${cleanCode}.pdf`
        : `Comprobante_${cleanCode}.pdf`;
      downloadReceiptPdf(pdfBytes, fileName);
      toast.success(`Archivo ${fileName} descargado.`);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      toast.error('Error al generar el PDF.');
    }
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
        subtotal: saleData.subtotal,
        descuento: saleData.descuento,
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
    <Modal isOpen={isOpen} onClose={onClose} title={isCotizacion ? "Cotización / Proforma" : "Venta Completada"} position="center">
      <div className="flex flex-col items-center text-center space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar py-1">
        {/* Ícono de Éxito */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isCotizacion ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isCotizacion ? (
            <FileText className="w-8 h-8 stroke-[2.2]" />
          ) : (
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          )}
        </div>

        <div>
          <h4 className="text-lg font-black text-slate-800">
            {isCotizacion ? '¡Cotización Lista!' : '¡Cobro Exitoso!'}
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
            {saleData.descuento && saleData.descuento > 0 ? (
              <>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Subtotal:</span>
                  <span>S/ {(saleData.subtotal || (saleData.total + saleData.descuento)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-rose-600 font-bold">
                  <span>Descuento:</span>
                  <span>- S/ {saleData.descuento.toFixed(2)}</span>
                </div>
              </>
            ) : null}

            <div className="flex justify-between text-base font-black text-slate-900">
              <span>{isCotizacion ? 'TOTAL COTIZADO:' : 'TOTAL:'}</span>
              <span>S/ {saleData.total.toFixed(2)}</span>
            </div>

            {isCotizacion ? (
              <div className="flex justify-between text-[11px]">
                <span>Condición:</span>
                <span className="font-bold text-blue-600">Cotización ({saleData.validezDias || 7} días)</span>
              </div>
            ) : (
              <>
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
              </>
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
        <div className="w-full space-y-2.5 pt-1">
          {/* Panel Interactivo y Didáctico para Pedir Número de WhatsApp */}
          {isAskingPhone ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 leading-tight">
                      Enviar {isCotizacion ? 'Cotización' : 'Comprobante'} por WhatsApp
                    </h4>
                    <p className="text-[10px] text-emerald-700 font-medium leading-tight">
                      Ingresa el celular del cliente para enviar el PDF
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAskingPhone(false)}
                  className="w-6 h-6 rounded-lg bg-emerald-200/60 hover:bg-emerald-200 text-emerald-900 flex items-center justify-center text-xs font-black cursor-pointer transition-colors"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Input con bandera y prefijo dinámico */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <div className="absolute left-2.5 flex items-center gap-1 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-black text-slate-700 shadow-xs pointer-events-none">
                    <span>{countryDetails.flag}</span>
                    <span>+{countryDetails.phoneCode}</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    maxLength={countryDetails.phoneLength}
                    placeholder={countryDetails.placeholder}
                    value={telefonoWhatsApp}
                    onChange={(e) => setTelefonoWhatsApp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && telefonoWhatsApp.length >= (countryDetails.phoneLength - 1)) {
                        e.preventDefault();
                        handleShareWhatsAppPdf(telefonoWhatsApp);
                      }
                    }}
                    className="w-full h-11 bg-white border-2 border-emerald-400 focus:border-emerald-600 rounded-xl pl-24 pr-8 text-sm font-black text-slate-800 outline-none transition-all placeholder:text-slate-300 tracking-wider font-mono shadow-xs"
                  />
                  {telefonoWhatsApp && (
                    <button
                      type="button"
                      onClick={() => setTelefonoWhatsApp('')}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between px-1 text-[10px]">
                  <span className="text-slate-500 font-medium">Formato: {countryDetails.countryName} ({countryDetails.phoneLength} dígitos)</span>
                  <span className={telefonoWhatsApp.length >= (countryDetails.phoneLength - 1) ? 'text-emerald-700 font-bold' : 'text-slate-400 font-medium'}>
                    {telefonoWhatsApp.length} / {countryDetails.phoneLength} dígitos
                  </span>
                </div>
              </div>

              {/* Botón enviar al número y opción fallback */}
              <div className="space-y-1.5 pt-0.5">
                <button
                  type="button"
                  disabled={telefonoWhatsApp.length < (countryDetails.phoneLength - 1) || isGeneratingPdf}
                  onClick={() => handleShareWhatsAppPdf(telefonoWhatsApp)}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>
                    {isGeneratingPdf
                      ? 'PREPARANDO PDF...'
                      : telefonoWhatsApp.length >= (countryDetails.phoneLength - 1)
                      ? `ENVIAR AL WHATSAPP (+${countryDetails.phoneCode} ${telefonoWhatsApp})`
                      : `INGRESA EL CELULAR (${countryDetails.phoneLength} DÍGITOS)`}
                  </span>
                </button>

                <div className="flex flex-col gap-1 pt-0.5">
                  <button
                    type="button"
                    disabled={isGeneratingPdf}
                    onClick={() => handleShareWhatsAppPdf('', false)}
                    className="w-full py-0.5 text-center text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer transition-colors"
                  >
                    💬 O abrir WhatsApp para elegir contacto
                  </button>
                  <button
                    type="button"
                    disabled={isGeneratingPdf}
                    onClick={() => handleShareWhatsAppPdf('', true)}
                    className="w-full py-0.5 text-center text-[11px] font-semibold text-slate-600 hover:text-slate-800 hover:underline cursor-pointer transition-colors"
                  >
                    📎 O compartir archivo PDF con otra app (Nativo)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Botón Principal: Enviar PDF por WhatsApp */
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  if (telefonoWhatsApp && telefonoWhatsApp.length >= (countryDetails.phoneLength - 1)) {
                    handleShareWhatsAppPdf(telefonoWhatsApp);
                  } else {
                    setIsAskingPhone(true);
                  }
                }}
                disabled={isGeneratingPdf}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>
                  {isGeneratingPdf
                    ? 'GENERANDO PDF...'
                    : telefonoWhatsApp && telefonoWhatsApp.length >= (countryDetails.phoneLength - 1)
                    ? `ENVIAR PDF A WHATSAPP (+${countryDetails.phoneCode} ${telefonoWhatsApp})`
                    : `ENVIAR ${isCotizacion ? 'COTIZACIÓN' : 'COMPROBANTE'} EN PDF POR WHATSAPP`}
                </span>
              </button>

              {telefonoWhatsApp && telefonoWhatsApp.length >= (countryDetails.phoneLength - 1) ? (
                <div className="flex justify-center items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Destinatario: <b>{countryDetails.flag} +{countryDetails.phoneCode} {telefonoWhatsApp}</b>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAskingPhone(true)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                  >
                    Cambiar número
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsAskingPhone(true)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Ingresar número de celular del cliente para enviar</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botones secundarios: Descargar PDF, Imprimir Térmico, Listo */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={handleDownloadPdf}
              icon={<Download className="w-4 h-4 text-slate-700" />}
              className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-xs"
            >
              Descargar PDF
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handlePrint}
              isLoading={isPrinting}
              icon={<Printer className="w-4 h-4 text-slate-700" />}
              className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-xs"
            >
              Imprimir
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onClose}
              icon={<Check className="w-4 h-4" />}
              className="font-bold text-xs"
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
