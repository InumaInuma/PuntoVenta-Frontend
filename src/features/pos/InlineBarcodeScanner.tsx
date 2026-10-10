import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BarcodeScannerService,
  type ScannerEngineType,
  type ScanResult,
} from '@/services/scanner';
import { Camera, CameraOff, RefreshCw, Zap, ZapOff, CheckCircle2 } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';

interface InlineBarcodeScannerProps {
  onScan: (code: string) => void;
  lastScannedMessage?: string | null;
}

export const InlineBarcodeScanner: React.FC<InlineBarcodeScannerProps> = ({
  onScan,
  lastScannedMessage,
}) => {
  const containerId = 'pos-inline-barcode-reader';
  const serviceRef = useRef<BarcodeScannerService | null>(null);

  const [isActive, setIsActive] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [activeEngine, setActiveEngine] = useState<ScannerEngineType>('native-mlkit');
  const [hasPermissionError, setHasPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [justScanned, setJustScanned] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  const { playBeep } = useSound();
  const { triggerSuccess } = useHaptics();

  // Iniciar o reiniciar el escáner
  const startScanner = useCallback(async () => {
    if (!isActive) return;

    setIsInitializing(true);
    setHasPermissionError(null);

    // Esperar un frame a que el div exista en el DOM
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      if (serviceRef.current) {
        await serviceRef.current.stop();
      }

      const service = new BarcodeScannerService({
        containerId,
        facingMode,
        fps: 20,
        cooldownMs: 1600,
        onScan: (result: ScanResult) => {
          playBeep();
          triggerSuccess();

          setJustScanned(true);
          setTimeout(() => setJustScanned(false), 800);

          onScan(result.code);
        },
        onEngineResolved: (engine) => {
          setActiveEngine(engine);
        },
      });

      serviceRef.current = service;
      const engine = await service.start();
      setActiveEngine(engine);

      setHasTorch(service.hasTorchCapability());
      setIsTorchOn(false);

      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Error al iniciar cámara:', err);
      setIsInitializing(false);
      setHasPermissionError(
        'No se pudo acceder a la cámara. Revisa los permisos del navegador.'
      );
    }
  }, [isActive, facingMode, onScan, playBeep, triggerSuccess]);

  const stopScanner = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.stop();
      serviceRef.current = null;
    }
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, facingMode, startScanner, stopScanner]);

  const toggleCamera = () => {
    setIsActive((prev) => !prev);
  };

  const switchCameraFacing = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (!serviceRef.current) return;
    const nextState = !isTorchOn;
    const ok = await serviceRef.current.setTorch(nextState);
    if (ok) {
      setIsTorchOn(nextState);
    }
  };

  return (
    <div className="w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-md overflow-hidden relative transition-all">
      {isActive ? (
        <div className="relative w-full h-52 bg-black overflow-hidden flex items-center justify-center">
          {/* Contenedor del stream de video */}
          <div
            id={containerId}
            className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {/* BARRA SUPERIOR FLOTANTE (Como en la foto de referencia) */}
          <div className="absolute top-2.5 inset-x-3 flex items-center justify-between pointer-events-none z-20">
            {/* Badge estado flotante */}
            <div
              className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2 pointer-events-auto shadow-lg"
              title={`Motor: ${activeEngine}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-extrabold text-white tracking-wide">
                Cámara lista para escanear
              </span>
              {activeEngine === 'native-mlkit' && (
                <span className="text-[9px] font-black bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full">
                  ML
                </span>
              )}
            </div>

            {/* Botones de acción flotantes oscuros y translúcidos */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                    isTorchOn
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50'
                      : 'bg-black/60 text-white/90 border border-white/15 hover:bg-black/80'
                  }`}
                  title={isTorchOn ? 'Apagar Linterna' : 'Encender Linterna'}
                >
                  {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={switchCameraFacing}
                className="w-8 h-8 rounded-full bg-black/60 border border-white/15 text-white/90 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all hover:bg-black/80 cursor-pointer"
                title="Girar cámara"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className="w-8 h-8 rounded-full bg-black/60 border border-white/15 text-white/90 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all hover:bg-black/80 cursor-pointer"
                title="Pausar cámara"
              >
                <CameraOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cuadro de enfoque y esquinas redondeadas guía */}
          <div
            className={`absolute inset-x-8 top-12 bottom-11 rounded-2xl pointer-events-none transition-all flex items-center justify-center ${
              justScanned
                ? 'border-4 border-emerald-400 bg-emerald-500/25 scale-105'
                : 'border-2 border-emerald-400/70 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
            }`}
          >
            {/* Esquinas guía */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-lg" />

            {/* Línea láser de escaneo */}
            {!justScanned && (
              <div className="w-full h-0.5 bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse" />
            )}
          </div>

          {/* Texto inferior dentro del visor (Como en la foto) */}
          <div className="absolute bottom-2.5 z-20 pointer-events-none">
            <div className="bg-black/65 backdrop-blur-md border border-white/10 px-3.5 py-0.5 rounded-full text-[11px] font-semibold text-white/90 shadow-sm">
              Alinea el código de barras en el marco
            </div>
          </div>

          {/* Estado de inicialización */}
          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950/85 z-30 flex flex-col items-center justify-center text-slate-300 gap-2">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Activando cámara...</span>
            </div>
          )}

          {/* Error de permisos */}
          {hasPermissionError && (
            <div className="absolute inset-0 bg-slate-950/90 z-30 p-4 flex flex-col items-center justify-center text-center text-rose-300 text-xs font-semibold gap-2">
              <CameraOff className="w-6 h-6 text-rose-400" />
              <span>{hasPermissionError}</span>
            </div>
          )}

          {/* Feedback de último producto escaneado */}
          {lastScannedMessage && (
            <div className="absolute bottom-9 inset-x-4 z-20 bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{lastScannedMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={toggleCamera}
          className="w-full py-8 px-4 bg-slate-900 hover:bg-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-md">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">
            Cámara en pausa para ahorrar batería
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Toca aquí para reactivar el lector en vivo
          </span>
        </div>
      )}
    </div>
  );
};

export default InlineBarcodeScanner;
