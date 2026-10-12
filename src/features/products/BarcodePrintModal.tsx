import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Printer, Minus, Plus } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import toast from 'react-hot-toast';

export interface BarcodePrintData {
  nombre: string;
  codigoBarras: string;
  precioVenta?: number | string;
  categoria?: string;
}

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BarcodePrintData | null;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const svgPreviewRef = useRef<SVGSVGElement | null>(null);

  const [ancho, setAncho] = useState<'58mm' | '80mm'>('58mm');
  const [copias, setCopias] = useState<number>(1);

  // Renderizar código de barras en el SVG de vista previa en tiempo real
  useEffect(() => {
    if (isOpen && data?.codigoBarras && svgPreviewRef.current) {
      try {
        JsBarcode(svgPreviewRef.current, data.codigoBarras, {
          format: 'CODE128',
          width: ancho === '80mm' ? 2.4 : 1.9,
          height: 60,
          displayValue: true,
          font: 'monospace',
          fontSize: 14,
          textMargin: 4,
          margin: 6,
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('Error al generar código de barras preview:', err);
      }
    }
  }, [isOpen, data?.codigoBarras, ancho]);

  if (!data) return null;

  const handlePrint = () => {
    if (!data.codigoBarras) {
      toast.error('El producto no tiene un código de barras asignado.');
      return;
    }

    // Generar SVG en memoria con JsBarcode en máxima definición
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    try {
      JsBarcode(tempSvg, data.codigoBarras, {
        format: 'CODE128',
        width: ancho === '80mm' ? 2.4 : 1.9,
        height: 65,
        displayValue: true,
        font: 'monospace',
        fontSize: 15,
        textMargin: 4,
        margin: 4,
        lineColor: '#000000',
      });
    } catch {
      toast.error('No se pudo codificar el código de barras.');
      return;
    }

    const svgString = new XMLSerializer().serializeToString(tempSvg);

    // Construir bloque con ÚNICAMENTE el código de barras y sus dígitos
    let etiquetasHtml = '';
    for (let i = 0; i < copias; i++) {
      etiquetasHtml += `
        <div class="ticket-etiqueta">
          <div class="barcode-container">
            ${svgString}
          </div>
        </div>
      `;
    }

    // Plantilla HTML pura y limpia para ticketeras térmicas (58mm / 80mm)
    const printDocHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Código ${data.codigoBarras}</title>
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
              width: ${ancho};
              margin: 0 auto;
              padding: 2mm 0;
              text-align: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .ticket-etiqueta {
              page-break-after: always;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 2mm 0;
            }
            .ticket-etiqueta:last-child {
              page-break-after: auto;
            }
            .barcode-container {
              display: inline-block;
              margin: 0 auto;
              text-align: center;
            }
            .barcode-container svg {
              max-width: 100% !important;
              height: auto !important;
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${etiquetasHtml}
        </body>
      </html>
    `;

    // Imprimir mediante iframe aislado (estándar de impresión térmica POS)
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
      return;
    }

    frameDoc.open();
    frameDoc.write(printDocHtml);
    frameDoc.close();

    toast.success(`Enviando ${copias} etiqueta(s) a la ticketera...`);

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
        } catch {
          /* ignore */
        }
      }, 1500);
    }, 350);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="center" maxWidth="max-w-sm">
      <div className="flex flex-col items-center">
        {/* Cabecera del Modal */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 leading-tight">
              Imprimir Código de Barras
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {data.nombre}
            </p>
          </div>
        </div>

        {/* VISTA PREVIA: ÚNICAMENTE CÓDIGO DE BARRAS Y SU NÚMERO */}
        <div className="w-full bg-slate-100/90 rounded-2xl p-3 border border-slate-200/80 mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Vista Previa de Etiqueta</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
              {ancho}
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center text-center">
            {/* SVG del Código de Barras con sus dígitos */}
            <div className="w-full flex justify-center bg-white py-1">
              <svg ref={svgPreviewRef} className="max-w-full h-auto" />
            </div>
          </div>
        </div>

        {/* CONTROLES DE CONFIGURACIÓN */}
        <div className="w-full space-y-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs">
          {/* Ancho de Ticketera */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Ancho del Papel:</span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAncho('58mm')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  ancho === '58mm'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58 mm
              </button>
              <button
                type="button"
                onClick={() => setAncho('80mm')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  ancho === '80mm'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80 mm
              </button>
            </div>
          </div>

          {/* Selector de Cantidad de Copias */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span className="font-bold text-slate-700">Cantidad a Imprimir:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCopias((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 cursor-pointer font-bold"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-black text-sm text-slate-900 font-mono">
                {copias}
              </span>
              <button
                type="button"
                onClick={() => setCopias((prev) => prev + 1)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 cursor-pointer font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center gap-2.5 w-full mt-4">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            className="flex-1"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Imprimir ({copias})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
