import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, X, Check, Zap, ZapOff, Image as ImageIcon } from 'lucide-react';
import { comprimirAWebP } from '@/utils/imageCompressor';
import toast from 'react-hot-toast';

interface ProductCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (webpDataUrl: string) => void;
  onOpenGallery?: () => void;
}

export const ProductCameraModal: React.FC<ProductCameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  onOpenGallery,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Detener todos los tracks de la cámara de forma segura
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('Error al detener track de cámara:', err);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  // Iniciar el stream de video de la cámara
  const startCamera = useCallback(async () => {
    stopStream();
    setCapturedBlob(null);
    setPreviewUrl(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Tu navegador no permite acceso directo a la cámara');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 1280, max: 1920 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((playErr) => {
          console.warn('AutoPlay de video restringido:', playErr);
        });
      }

      // Detectar soporte para linterna (torch)
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const capabilities = track.getCapabilities() as any;
        setHasTorch(!!capabilities?.torch);
      }

      // Detectar múltiples cámaras (para botón de rotar cámara)
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      toast.error('No se pudo abrir la cámara. Revisa los permisos.');
    }
  }, [facingMode, stopStream]);

  // Alternar linterna si está disponible
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && typeof track.applyConstraints === 'function') {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('No se pudo activar la linterna:', err);
      }
    }
  };

  // Alternar entre cámara trasera y delantera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capturar fotograma actual del elemento video
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    const width = video.videoWidth;
    const height = video.videoHeight;

    // Recorte cuadrado centrado para formato de foto de producto
    const size = Math.min(width, height);
    const startX = (width - size) / 2;
    const startY = (height - size) / 2;

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Si es cámara frontal, espejar horizontalmente para naturalidad
    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          stopStream();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  // Reanudar cámara para repetir captura
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedBlob(null);
    setPreviewUrl(null);
    startCamera();
  };

  // Confirmar y comprimir la foto capturada a WebP optimizado
  const handleConfirmPhoto = async () => {
    if (!capturedBlob) return;
    setIsProcessing(true);

    try {
      const webpDataUrl = await comprimirAWebP(capturedBlob, 800, 0.82);
      onPhotoCaptured(webpDataUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopStream();
      onClose();
      toast.success('Foto capturada con éxito');
    } catch (err) {
      console.error('Error al procesar foto capturada:', err);
      toast.error('Error al procesar la foto');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    stopStream();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
      {/* 1. Header de Cámara */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
          title="Cerrar cámara"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <span className="text-white font-extrabold text-sm tracking-wide">
          {previewUrl ? 'Confirmar Foto' : 'Foto del Producto'}
        </span>

        <div className="flex items-center gap-2">
          {hasTorch && !previewUrl && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`w-10 h-10 rounded-full ${
                isTorchOn ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white'
              } active:scale-95 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md`}
              title="Linterna"
            >
              {isTorchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          {hasMultipleCameras && !previewUrl && (
            <button
              type="button"
              onClick={toggleCamera}
              className="w-10 h-10 rounded-full bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
              title="Cambiar de cámara"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Visor de Cámara / Vista previa */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Foto capturada"
            className="w-full h-full max-h-[70vh] object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Guía visual cuadrada de encuadre para producto */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-full max-w-[320px] aspect-square rounded-3xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Barra de Control Inferior */}
      <div className="relative z-10 px-6 py-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex flex-col items-center gap-3">
        {previewUrl ? (
          <div className="w-full flex items-center justify-around gap-4">
            <button
              type="button"
              onClick={handleRetake}
              disabled={isProcessing}
              className="flex-1 h-13 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className="w-4 h-4" />
              Tomar otra
            </button>

            <button
              type="button"
              onClick={handleConfirmPhoto}
              disabled={isProcessing}
              className="flex-1 h-13 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/40 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  Usar esta foto
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between">
            {/* Botón secundario: Abrir galería */}
            {onOpenGallery ? (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenGallery();
                }}
                className="w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                title="Elegir de la galería"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-12 h-12" />
            )}

            {/* Botón Principal: Disparador de foto */}
            <button
              type="button"
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-2xl p-1"
              title="Capturar foto"
            >
              <div className="w-full h-full rounded-full bg-red-500 active:bg-red-600 transition-colors" />
            </button>

            <div className="w-12 h-12" />
          </div>
        )}
      </div>
    </div>
  );
};
