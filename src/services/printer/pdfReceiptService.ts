import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PdfReceiptData {
  tipoDoc: string; // 'NOTA DE VENTA' | 'BOLETA DE VENTA' | 'FACTURA' | 'COTIZACIÓN / PROFORMA'
  isCotizacion: boolean;
  codigo: string;
  fecha: Date;
  nombreNegocio: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  cajero?: string;
  clienteNombre?: string;
  clienteDocumento?: string;
  items: Array<{
    cantidad: number;
    productoNombre: string;
    precioUnitario: number;
    subtotal: number;
  }>;
  subtotal?: number;
  descuento?: number;
  total: number;
  metodoPago?: string;
  montoRecibido?: number;
  vuelto?: number;
  validezDias?: number;
  pieTicket?: string;
  monedaSimbolo?: string;
}

/**
 * Genera un documento PDF estilo ticket térmico (80mm) ultra-legible
 * usando pdf-lib (100% compatible con Vite y navegadores móviles/desktop).
 */
export const generateReceiptPdfBytes = async (data: PdfReceiptData): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Dimensiones: 80mm de ancho (~226.77 pt)
  const pageWidth = 226.77;
  const margin = 12;

  // Altura dinámica según la cantidad de items
  const baseHeight = 340;
  const itemsHeight = Math.max(1, data.items.length) * 26;
  const pageHeight = Math.max(460, baseHeight + itemsHeight);

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // En el sistema de coordenadas PDF, (0, 0) está en la esquina inferior izquierda.
  let currentY = pageHeight - 20;

  const drawCenteredText = (text: string, size: number, font = fontRegular, color = rgb(0.1, 0.1, 0.1)) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (pageWidth - textWidth) / 2,
      y: currentY,
      size,
      font,
      color,
    });
  };

  const drawTextLeftRight = (
    leftText: string,
    rightText: string,
    size: number,
    leftFont = fontRegular,
    rightFont = fontRegular,
    leftColor = rgb(0.2, 0.2, 0.2),
    rightColor = rgb(0.1, 0.1, 0.1)
  ) => {
    page.drawText(leftText, {
      x: margin,
      y: currentY,
      size,
      font: leftFont,
      color: leftColor,
    });

    const rightWidth = rightFont.widthOfTextAtSize(rightText, size);
    page.drawText(rightText, {
      x: pageWidth - margin - rightWidth,
      y: currentY,
      size,
      font: rightFont,
      color: rightColor,
    });
  };

  const drawDashedLine = () => {
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: pageWidth - margin, y: currentY },
      thickness: 0.8,
      color: rgb(0.75, 0.75, 0.75),
      dashArray: [2, 2],
    });
  };

  // 1. Encabezado del Comercio
  drawCenteredText(data.nombreNegocio.toUpperCase(), 12, fontBold, rgb(0.08, 0.08, 0.08));
  currentY -= 13;

  if (data.ruc) {
    drawCenteredText(`RUC: ${data.ruc}`, 8, fontRegular, rgb(0.35, 0.35, 0.35));
    currentY -= 10;
  }
  if (data.direccion) {
    // Truncar o envolver si es muy larga
    const cleanDir = data.direccion.length > 36 ? data.direccion.substring(0, 36) + '...' : data.direccion;
    drawCenteredText(cleanDir, 7.5, fontRegular, rgb(0.35, 0.35, 0.35));
    currentY -= 10;
  }
  if (data.telefono) {
    drawCenteredText(`Tel / WhatsApp: ${data.telefono}`, 7.5, fontRegular, rgb(0.35, 0.35, 0.35));
    currentY -= 10;
  }

  // Separador
  currentY -= 2;
  drawDashedLine();
  currentY -= 12;

  // 2. Título de Documento y Código
  const docColor = data.isCotizacion ? rgb(0.1, 0.4, 0.85) : rgb(0.08, 0.08, 0.08);
  drawCenteredText(data.tipoDoc, 10.5, fontBold, docColor);
  currentY -= 12;

  drawCenteredText(`#${data.codigo}`, 9.5, fontBold, rgb(0.2, 0.2, 0.2));
  currentY -= 14;

  // 3. Metadatos
  const fechaStr = `${data.fecha.toLocaleDateString()} ${data.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  drawTextLeftRight('Fecha:', fechaStr, 7.5);
  currentY -= 10;

  if (data.cajero) {
    drawTextLeftRight('Atendido por:', data.cajero, 7.5);
    currentY -= 10;
  }

  if (data.isCotizacion && data.validezDias) {
    drawTextLeftRight('Validez:', `${data.validezDias} días calendario`, 7.5, fontBold, fontBold, rgb(0.8, 0.3, 0), rgb(0.8, 0.3, 0));
    currentY -= 10;
  }

  if (data.clienteNombre) {
    const docPart = data.clienteDocumento ? ` (${data.clienteDocumento})` : '';
    drawTextLeftRight('Cliente:', `${data.clienteNombre}${docPart}`, 7.5, fontRegular, fontBold);
    currentY -= 10;
  }

  // Separador de Items
  currentY -= 2;
  drawDashedLine();
  currentY -= 11;

  // 4. Cabecera de la tabla
  page.drawText('CANT', { x: margin, y: currentY, size: 7.5, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('DESCRIPCIÓN', { x: margin + 28, y: currentY, size: 7.5, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  const totalHeaderWidth = fontBold.widthOfTextAtSize('TOTAL', 7.5);
  page.drawText('TOTAL', { x: pageWidth - margin - totalHeaderWidth, y: currentY, size: 7.5, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  currentY -= 9;

  // Línea sólida suave
  page.drawLine({
    start: { x: margin, y: currentY + 3 },
    end: { x: pageWidth - margin, y: currentY + 3 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  currentY -= 3;

  // 5. Filas de Productos
  if (data.items.length === 0) {
    drawCenteredText('(Sin productos registrados)', 8, fontItalic, rgb(0.5, 0.5, 0.5));
    currentY -= 14;
  } else {
    data.items.forEach((item) => {
      // Cantidad
      page.drawText(`${item.cantidad}`, {
        x: margin,
        y: currentY,
        size: 8,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Nombre del producto (recortar si es muy largo)
      const name = item.productoNombre.length > 22
        ? item.productoNombre.substring(0, 22) + '...'
        : item.productoNombre;

      page.drawText(name, {
        x: margin + 28,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Subtotal de la fila
      const cur = data.monedaSimbolo || 'S/';
      const subtotalStr = `${cur} ${Number(item.subtotal).toFixed(2)}`;
      const subWidth = fontBold.widthOfTextAtSize(subtotalStr, 8);
      page.drawText(subtotalStr, {
        x: pageWidth - margin - subWidth,
        y: currentY,
        size: 8,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      currentY -= 9;

      // Precio unitario abajo
      page.drawText(`P. Unit: ${cur} ${Number(item.precioUnitario).toFixed(2)}`, {
        x: margin + 28,
        y: currentY,
        size: 6.5,
        font: fontRegular,
        color: rgb(0.45, 0.45, 0.45),
      });

      currentY -= 12;
    });
  }

  const cur = data.monedaSimbolo || 'S/';

  // Separador de Totales
  drawDashedLine();
  currentY -= 13;

  // 6. Subtotal y Descuento
  if (data.descuento && data.descuento > 0) {
    if (data.subtotal) {
      drawTextLeftRight('Subtotal:', `${cur} ${Number(data.subtotal).toFixed(2)}`, 8);
      currentY -= 10;
    }
    drawTextLeftRight('Descuento aplicado:', `- ${cur} ${Number(data.descuento).toFixed(2)}`, 8, fontBold, fontBold, rgb(0.1, 0.6, 0.3), rgb(0.1, 0.6, 0.3));
    currentY -= 11;
  }

  // 7. TOTAL GENERAL
  drawTextLeftRight('TOTAL:', `${cur} ${Number(data.total).toFixed(2)}`, 11, fontBold, fontBold, rgb(0.05, 0.05, 0.05), rgb(0.05, 0.05, 0.05));
  currentY -= 14;

  // 8. Método de pago / vuelto
  if (!data.isCotizacion && data.metodoPago) {
    drawTextLeftRight('Pago:', data.metodoPago, 8, fontRegular, fontBold);
    currentY -= 9;

    if (data.vuelto && data.vuelto > 0) {
      drawTextLeftRight('Vuelto:', `${cur} ${Number(data.vuelto).toFixed(2)}`, 8);
      currentY -= 9;
    }
  }

  // Separador del Pie
  currentY -= 4;
  drawDashedLine();
  currentY -= 12;

  // 9. Pie de Ticket
  const footer = data.pieTicket || (data.isCotizacion
    ? 'Cotización informativa sin reserva de stock. ¡Gracias por consultar!'
    : '¡Gracias por su compra! Revise su comprobante y vuelto.');
  
  const footerTrunc = footer.length > 55 ? footer.substring(0, 55) + '...' : footer;
  drawCenteredText(footerTrunc, 6.5, fontItalic, rgb(0.4, 0.4, 0.4));

  return await pdfDoc.save();
};

/**
 * Descarga el archivo PDF localmente en el dispositivo.
 */
export const downloadReceiptPdf = (pdfBytes: Uint8Array, fileName: string) => {
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Comparte el comprobante o cotización en formato PDF por WhatsApp.
 * - En celulares Android / iOS: Usa Web Share API para adjuntar el archivo PDF directamente a WhatsApp.
 * - En PC / Escritorio: Descarga el PDF automáticamente y abre WhatsApp Web con el texto preparado listo para adjuntar.
 */
export const shareReceiptPdfToWhatsApp = async (
  pdfBytes: Uint8Array,
  fileName: string,
  whatsappMessage: string,
  telefonoCliente?: string,
  codigoPais: string = '51'
): Promise<{ shared: boolean; method: 'native' | 'download_and_whatsapp' | 'aborted' }> => {
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const file = new File([blob], fileName, { type: 'application/pdf' });

  // 1. Dispositivos móviles con soporte de Web Share API de archivos
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
        text: whatsappMessage,
      });
      return { shared: true, method: 'native' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { shared: false, method: 'aborted' };
      }
      console.warn('Fallback a WhatsApp Web tras navigator.share:', err);
    }
  }

  // 2. Fallback para PC / Navegadores de escritorio
  downloadReceiptPdf(pdfBytes, fileName);

  const cleanCountryCode = (codigoPais || '51').replace(/\D/g, '') || '51';
  let phoneClean = telefonoCliente ? telefonoCliente.replace(/\D/g, '') : '';
  if (phoneClean && !phoneClean.startsWith(cleanCountryCode)) {
    phoneClean = `${cleanCountryCode}${phoneClean}`;
  }

  const url = phoneClean
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  window.open(url, '_blank');
  return { shared: true, method: 'download_and_whatsapp' };
};
