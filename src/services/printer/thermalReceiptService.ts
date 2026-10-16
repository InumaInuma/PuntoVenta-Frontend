// Servicio Especializado de Impresión Térmica (58mm / 80mm) con Soporte de Logo por Comercio
// Sigue el estándar de formato físico de boleta/ticket (Referencia Imagen 1)

export interface ThermalReceiptItem {
  cantidad: number;
  nombre: string;
  precioUnitario: number;
  subtotal: number;
}

export interface ThermalReceiptData {
  logoUrl?: string | null;
  nombreComercial: string;
  razonSocial?: string | null;
  rucOIdentificacion?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  tipoComprobante?: string; // NOTA DE VENTA, BOLETA, FACTURA
  numeroComprobante: string;
  fecha?: string | Date;
  cajero?: string | null;
  cliente?: string | null;
  clienteDocumento?: string | null;
  items: ThermalReceiptItem[];
  subtotal?: number;
  descuento?: number;
  total: number;
  metodoPago: string;
  montoRecibido?: number | null;
  vuelto?: number | null;
  textoPieTicket?: string | null;
  anchoPapel?: '58mm' | '80mm';
}

export const printThermalReceipt = (data: ThermalReceiptData): Promise<void> => {
  return new Promise((resolve) => {
    const ancho = data.anchoPapel || '58mm';
    const is58 = ancho === '58mm';

    const fechaFormateada = data.fecha
      ? new Date(data.fecha).toLocaleString('es-PE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString('es-PE');

    const rawTipo = (data.tipoComprobante || 'NOTA DE VENTA').toUpperCase();
    const isCotizacion = rawTipo.includes('COTIZACI') || rawTipo.includes('PROFORMA');
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

    const itemsHtml = data.items
      .map(
        (it) => `
        <div class="item-row">
          <div class="item-main">
            <span class="item-cant">${it.cantidad}</span>
            <span class="item-desc">${it.nombre}</span>
            <span class="item-subt">S/ ${it.subtotal.toFixed(2)}</span>
          </div>
          <div class="item-unit">P. Unit: S/ ${it.precioUnitario.toFixed(2)}</div>
        </div>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Ticket - ${data.numeroComprobante}</title>
          <style>
            @page {
              size: ${ancho} auto;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              background: #fff;
              color: #000;
              font-family: 'Courier New', Courier, monospace, monospace;
              width: ${ancho};
              margin: 0 auto;
              padding: 2mm 2.5mm 8mm 2.5mm;
              font-size: ${is58 ? '11px' : '12px'};
              line-height: 1.25;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: 900; }
            
            /* Logo térmico optimizado */
            .logo-container {
              text-align: center;
              margin-bottom: 4px;
            }
            .logo-img {
              max-width: ${is58 ? '48mm' : '65mm'};
              max-height: 80px;
              object-fit: contain;
              filter: grayscale(100%) contrast(150%);
              display: inline-block;
            }

            .negocio-title {
              font-size: ${is58 ? '14px' : '16px'};
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-bottom: 2px;
            }
            .negocio-info {
              font-size: ${is58 ? '10px' : '11px'};
              color: #111;
            }

            .divider {
              border-top: 1px dashed #000;
              margin: 4px 0;
              width: 100%;
            }
            .divider-solid {
              border-top: 1px solid #000;
              margin: 4px 0;
              width: 100%;
            }

            .doc-header {
              font-size: ${is58 ? '11px' : '12px'};
              font-weight: 800;
              text-transform: uppercase;
              margin: 2px 0;
            }
            .doc-meta {
              font-size: ${is58 ? '10px' : '11px'};
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }

            /* Cabecera tabla productos */
            .table-head {
              font-size: ${is58 ? '10px' : '11px'};
              font-weight: 800;
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }

            .item-row {
              margin-bottom: 4px;
            }
            .item-main {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              font-size: ${is58 ? '11px' : '12px'};
            }
            .item-cant {
              width: 18px;
              font-weight: 800;
              shrink: 0;
            }
            .item-desc {
              flex: 1;
              font-weight: 700;
              word-break: break-word;
              padding-right: 4px;
            }
            .item-subt {
              font-weight: 900;
              white-space: nowrap;
              text-align: right;
            }
            .item-unit {
              font-size: ${is58 ? '9.5px' : '10.5px'};
              color: #333;
              padding-left: 18px;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: ${is58 ? '14px' : '15px'};
              font-weight: 900;
              margin: 4px 0;
            }

            .payment-row {
              display: flex;
              justify-content: space-between;
              font-size: ${is58 ? '10.5px' : '11.5px'};
              margin-bottom: 2px;
            }

            .footer-msg {
              font-size: ${is58 ? '10px' : '11px'};
              text-align: center;
              margin-top: 6px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <!-- Logo si está configurado -->
          ${
            data.logoUrl
              ? `
            <div class="logo-container">
              <img src="${data.logoUrl}" class="logo-img" alt="Logo Negocio" />
            </div>
          `
              : ''
          }

          <!-- Encabezado del Comercio -->
          <div class="center">
            <div class="negocio-title">${data.nombreComercial}</div>
            ${data.rucOIdentificacion ? `<div class="negocio-info">RUC: ${data.rucOIdentificacion}</div>` : ''}
            ${data.direccion ? `<div class="negocio-info">${data.direccion}</div>` : ''}
            ${data.telefono ? `<div class="negocio-info">Tel: ${data.telefono}</div>` : ''}
          </div>

          <div class="divider"></div>

          <!-- Tipo y Datos del Comprobante -->
          <div class="center doc-header">${tipoDoc}</div>
          <div class="doc-meta">
            <span>${etiquetaDoc}:</span>
            <span class="bold">#${data.numeroComprobante}</span>
          </div>
          <div class="doc-meta">
            <span>Fecha:</span>
            <span>${fechaFormateada}</span>
          </div>
          ${
            data.cajero
              ? `
            <div class="doc-meta">
              <span>Atendido por:</span>
              <span class="bold">${data.cajero}</span>
            </div>
          `
              : ''
          }
          ${
            data.cliente
              ? `
            <div class="doc-meta">
              <span>Cliente:</span>
              <span class="bold">${data.cliente}</span>
            </div>
          `
              : ''
          }
          ${
            data.clienteDocumento
              ? `
            <div class="doc-meta">
              <span>${tipoDoc === 'FACTURA' ? 'RUC:' : 'Doc / DNI:'}</span>
              <span class="bold">${data.clienteDocumento}</span>
            </div>
          `
              : ''
          }

          <div class="divider"></div>

          <!-- Cabecera de Items -->
          <div class="table-head">
            <span style="width: 18px;">Cant</span>
            <span style="flex: 1;">Producto</span>
            <span>Total</span>
          </div>
          <div class="divider" style="margin: 2px 0 4px 0;"></div>

          <!-- Listado de Productos -->
          <div class="items-list">
            ${itemsHtml}
          </div>

          <div class="divider"></div>

          ${
            data.descuento && data.descuento > 0
              ? `
            <div class="payment-row">
              <span>Subtotal:</span>
              <span>S/ ${(data.subtotal ?? (data.total + data.descuento)).toFixed(2)}</span>
            </div>
            <div class="payment-row">
              <span>Descuento:</span>
              <span class="bold">- S/ ${data.descuento.toFixed(2)}</span>
            </div>
          `
              : ''
          }

          <!-- Total a Cobrar -->
          <div class="total-row">
            <span>TOTAL:</span>
            <span>S/ ${data.total.toFixed(2)}</span>
          </div>

          ${
            isCotizacion
              ? `
            <div class="payment-row">
              <span>Condición:</span>
              <span class="bold">Cotización (Validez 7 días)</span>
            </div>
          `
              : `
            <!-- Desglose de Pagos -->
            <div class="payment-row">
              <span>Pago:</span>
              <span class="bold">${data.metodoPago}</span>
            </div>
            ${
              data.montoRecibido && data.montoRecibido > 0
                ? `
              <div class="payment-row">
                <span>Pago con:</span>
                <span>S/ ${data.montoRecibido.toFixed(2)}</span>
              </div>
            `
                : ''
            }
            ${
              data.vuelto && data.vuelto > 0
                ? `
              <div class="payment-row">
                <span>Vuelto:</span>
                <span class="bold">S/ ${data.vuelto.toFixed(2)}</span>
              </div>
            `
                : ''
            }
          `
          }

          <div class="divider"></div>

          <!-- Mensaje de Pie de Ticket -->
          <div class="footer-msg">
            ${data.textoPieTicket || '¡Gracias por su preferencia!'}
          </div>
        </body>
      </html>
    `;

    // Imprimir mediante un iframe oculto aislado
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(printFrame);
      resolve();
      return;
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.error('Error al imprimir ticket:', err);
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(printFrame);
          } catch {}
          resolve();
        }, 1200);
      }
    }, 300);
  });
};
