import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '@/components/ui/Modal';
import { Camera, CheckCircle2, Keyboard, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

// Emite un "bip" acústico nativo idéntico al de lectores POS de punto de venta
const playScannerBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Tono A5 (880 Hz)
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Si el navegador tiene políticas estrictas de audio antes de interacción, se ignora silenciosamente
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const isHandledRef = useRef(false);
  const containerId = 'html5qr-code-scanner-reader';

  const [isScanning, setIsScanning] = useState(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detiene y limpia la instancia de cámara con total seguridad antes del desmontaje del DOM
  const stopCameraSafe = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    const scanner = html5QrCodeRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn('Detención no crítica de cámara:', err);
      }

      try {
        scanner.clear();
      } catch (err) {
        console.warn('Limpieza no crítica de canvas:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleClose = async () => {
    await stopCameraSafe();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraSafe();
      return;
    }

    let isMounted = true;
    isStoppingRef.current = false;
    isHandledRef.current = false;
    setDetectedCode(null);
    setErrorMessage(null);
    setIsScanning(false);

    const initScanner = async () => {
      try {
        // Pausa breve para garantizar que el Modal esté renderizado en el DOM
        await new Promise((res) => setTimeout(res, 250));
        if (!isMounted) return;

        const containerEl = document.getElementById(containerId);
        if (!containerEl) {
          console.warn('Contenedor del escáner no disponible aún');
          return;
        }

        const scanner = new Html5Qrcode(containerId);
        html5QrCodeRef.current = scanner;

        // Callback invocado cuando se detecta un código válido
        const onScanSuccess = async (decodedText: string) => {
          if (isHandledRef.current) return;
          isHandledRef.current = true;

          // Feedback inmediato: Bip sonoro y vibración háptica en celulares
          playScannerBeep();
          if ('vibrate' in navigator) {
            try { navigator.vibrate(100); } catch { /* ignore */ }
          }

          setDetectedCode(decodedText);

          // Pausa estética de 350ms para que el usuario visualice el código reconocido en verde
          setTimeout(async () => {
            await stopCameraSafe();
            onScan(decodedText);
            onClose();
          }, 350);
        };

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.33,
        };

        // 1. Intentar con cámara trasera (móvil)
        try {
          await scanner.start(
            { facingMode: 'environment' },
            config,
            onScanSuccess,
            () => { /* ignorar frames sin código */ }
          );
        } catch {
          // 2. Si falla (por ejemplo en laptop con cámara frontal/webcam), intentar cámara por defecto
          await scanner.start(
            { facingMode: 'user' },
            config,
            onScanSuccess,
            () => { /* ignorar frames sin código */ }
          );
        }

        if (isMounted) setIsScanning(true);
      } catch (err) {
        console.warn('Error inicializando cámara:', err);
        if (isMounted) {
          setErrorMessage(
            'No se pudo activar la cámara. Puedes ingresar el código en el campo de texto inferior.'
          );
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      stopCameraSafe();
    };
  }, [isOpen, onScan, onClose, stopCameraSafe]);

  // Manejo de envío manual automático o con botón
  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualCode.trim();
    if (!clean) {
      toast.error('Ingresa un código de barras');
      return;
    }
    if (isHandledRef.current) return;
    isHandledRef.current = true;

    playScannerBeep();
    setDetectedCode(clean);

    await stopCameraSafe();
    onScan(clean);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Escanear Código de Barras" position="bottom">
      <div className="flex flex-col items-center">
        {/* Visor de Cámara */}
        <div className="relative w-full max-w-xs h-64 bg-slate-950 rounded-3xl overflow-hidden flex items-center justify-center border-2 border-slate-700 shadow-2xl">
          <div id={containerId} className="w-full h-full object-cover" />

          {/* Guía visual láser animada de escaneo */}
          {isScanning && !detectedCode && (
            <div className="absolute inset-x-8 top-12 bottom-12 border-2 border-red-500/80 rounded-2xl pointer-events-none flex items-center justify-center">
              {/* Esquinas destacadas */}
              <div className="w-full h-0.5 bg-red-500 shadow-lg shadow-red-500 animate-pulse" />
            </div>
          )}

          {/* Estado de activación */}
          {!isScanning && !errorMessage && !detectedCode && (
            <div className="absolute flex flex-col items-center gap-2 text-slate-400">
              <Camera className="w-8 h-8 animate-bounce text-red-500" />
              <span className="text-xs font-semibold">Activando cámara...</span>
            </div>
          )}

          {/* Mensaje de error si la cámara falla */}
          {errorMessage && (
            <div className="absolute p-4 text-center text-xs font-semibold text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Éxito: Badge flotante cuando el código es detectado */}
          {detectedCode && (
            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white p-4 animate-fadeIn z-20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                ¡Código Escaneado!
              </span>
              <span className="text-base font-black font-mono bg-emerald-900/80 px-3 py-1 rounded-xl border border-emerald-500/40 text-emerald-100 shadow-md">
                {detectedCode}
              </span>
            </div>
          )}
        </div>

        {/* Indicador de ayuda */}
        <p className="text-xs text-slate-500 font-medium mt-3 text-center flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-red-500" />
          <span>Apunta la cámara al código de barras del empaque (EAN-13, QR)</span>
        </p>

        {/* Ingreso manual con detección automática */}
        <form onSubmit={handleManualSubmit} className="w-full mt-4 pt-3 border-t border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="O ingresa código manual..."
              value={manualCode}
              onChange={(e) => {
                const val = e.target.value;
                setManualCode(val);
                // Si el usuario pega o escanea con pistola USB un código estándar (12 o 13 dígitos)
                if (val.trim().length >= 12 && /^\d+$/.test(val.trim())) {
                  handleManualSubmit();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualSubmit();
                }
              }}
              className="w-full h-11 bg-slate-100 rounded-xl px-3 text-sm font-semibold border border-slate-200 outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-4 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Keyboard className="w-4 h-4" />
            <span>Usar</span>
          </button>
        </form>
      </div>
    </Modal>
  );
};
