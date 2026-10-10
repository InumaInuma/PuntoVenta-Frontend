import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '@/components/ui/Modal';
import { Camera, Keyboard } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'html5qr-code-scanner-reader';
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          })
          .catch(() => {});
      }
      setIsScanning(false);
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setErrorMessage(null);
        // Esperar un frame a que el div esté en el DOM
        await new Promise((res) => setTimeout(res, 300));
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 160 },
            aspectRatio: 1.33,
          },
          (decodedText) => {
            // Éxito al escanear
            onScan(decodedText);
            onClose();
          },
          () => {
            // Ignorar errores de frame no reconocido
          }
        );

        if (isMounted) setIsScanning(true);
      } catch (err) {
        console.warn('Error al iniciar cámara:', err);
        if (isMounted) {
          setErrorMessage(
            'No se pudo acceder a la cámara trasera. Puedes escribir el código manualmente abajo.'
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [isOpen, onClose, onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error('Ingresa un código de barras');
      return;
    }
    onScan(manualCode.trim());
    setManualCode('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Escanear Código de Barras" position="bottom">
      <div className="flex flex-col items-center">
        {/* Contenedor del visor de cámara */}
        <div className="relative w-full max-w-xs h-64 bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center border-2 border-slate-700 shadow-inner">
          <div id={containerId} className="w-full h-full object-cover" />

          {/* Guía visual de escaneo */}
          {isScanning && (
            <div className="absolute inset-x-8 top-12 bottom-12 border-2 border-red-500 rounded-2xl pointer-events-none flex items-center justify-center animate-pulse">
              <div className="w-full h-0.5 bg-red-500 shadow-lg shadow-red-500/80" />
            </div>
          )}

          {!isScanning && !errorMessage && (
            <div className="absolute flex flex-col items-center gap-2 text-slate-400">
              <Camera className="w-8 h-8 animate-bounce text-red-500" />
              <span className="text-xs font-semibold">Activando cámara...</span>
            </div>
          )}

          {errorMessage && (
            <div className="absolute p-4 text-center text-xs font-semibold text-rose-300">
              {errorMessage}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 font-medium mt-3 text-center">
          Apunta con la cámara al código de barras del producto (EAN-13, QR)
        </p>

        {/* Entrada Manual de Respaldo */}
        <form onSubmit={handleManualSubmit} className="w-full mt-4 pt-3 border-t border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="O ingresa código manual..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full h-11 bg-slate-100 rounded-xl px-3 text-sm border border-slate-200 outline-none focus:border-red-500"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-4 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
            <span>Buscar</span>
          </button>
        </form>
      </div>
    </Modal>
  );
};
