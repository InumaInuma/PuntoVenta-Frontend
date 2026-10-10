import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type {
  ScannerEngineType,
  ScannerOptions,
  ScanResult,
} from './scannerTypes';

// Declaración global para BarcodeDetector API nativa de Chromium / Android
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
      };
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

const RETAIL_FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'code_93',
  'itf',
  'qr_code',
];

export class BarcodeScannerService {
  private options: ScannerOptions;
  private currentEngine: ScannerEngineType = 'html5-fallback';
  private nativeStream: MediaStream | null = null;
  private html5QrCode: Html5Qrcode | null = null;
  private animFrameId: number | null = null;
  private isScanning = false;
  private lastScannedCode = '';
  private lastScannedTime = 0;
  private activeVideoElement: HTMLVideoElement | null = null;

  constructor(options: ScannerOptions) {
    this.options = {
      fps: 20,
      cooldownMs: 1600,
      facingMode: 'environment',
      ...options,
    };
  }

  // Verifica si el navegador soporta el motor nativo de Google Play Services / ML Kit para códigos de barras 1D de retail
  public static async isNativeRetailSupported(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.BarcodeDetector) {
      return false;
    }
    try {
      const detectorClass = window.BarcodeDetector;
      if (typeof detectorClass.getSupportedFormats === 'function') {
        const supported = await detectorClass.getSupportedFormats();
        // En Windows desktop, Chrome solo devuelve ['qr_code'], por lo que debe retornar FALSE para usar Html5Qrcode.
        // En Android, devuelve ['ean_13', 'code_128', ...] soportando retail por hardware.
        return supported.includes('ean_13') || supported.includes('code_128');
      }
    } catch (err) {
      console.warn('Error comprobando formatos nativos de BarcodeDetector:', err);
    }
    return false;
  }

  // Inicia el escáner con la mejor tecnología disponible
  public async start(): Promise<ScannerEngineType> {
    await this.stop();

    const isNativeReady = await BarcodeScannerService.isNativeRetailSupported();
    if (isNativeReady) {
      try {
        await this.startNativeEngine();
        this.currentEngine = 'native-mlkit';
        this.options.onEngineResolved?.('native-mlkit');
        return 'native-mlkit';
      } catch (err) {
        console.warn('Fallo motor nativo, recurriendo a Html5Qrcode fallback:', err);
      }
    }

    // Fallback para Laptop, PC, iOS Safari y navegadores sin BarcodeDetector 1D nativo
    await this.startHtml5Engine();
    this.currentEngine = 'html5-fallback';
    this.options.onEngineResolved?.('html5-fallback');
    return 'html5-fallback';
  }

  // 1. Motor Nativo (Android / Chromium) - 60 FPS acelerado por hardware
  private async startNativeEngine(): Promise<void> {
    const BarcodeDetectorClass = window.BarcodeDetector!;
    const detector = new BarcodeDetectorClass({ formats: RETAIL_FORMATS });

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: this.options.facingMode || 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.nativeStream = stream;

    const container = document.getElementById(this.options.containerId);
    if (!container) throw new Error('Contenedor no encontrado en el DOM');

    // Limpiar contenido previo del contenedor
    container.innerHTML = '';

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.srcObject = stream;

    container.appendChild(video);
    this.activeVideoElement = video;

    await video.play();
    this.isScanning = true;

    // Bucle continuo de detección por fotograma
    const scanLoop = async () => {
      if (!this.isScanning || !this.activeVideoElement) return;

      if (this.activeVideoElement.readyState >= 2) {
        try {
          const barcodes = await detector.detect(this.activeVideoElement);
          if (barcodes && barcodes.length > 0) {
            const first = barcodes[0];
            this.handleDetectedCode(first.rawValue, first.format);
          }
        } catch {
          // Ignorar fotogramas intermedios con movimiento
        }
      }

      if (this.isScanning) {
        this.animFrameId = requestAnimationFrame(scanLoop);
      }
    };

    this.animFrameId = requestAnimationFrame(scanLoop);
  }

  // 2. Motor Html5Qrcode (Laptop, PC, iOS Safari y otros navegadores)
  private async startHtml5Engine(): Promise<void> {
    const container = document.getElementById(this.options.containerId);
    if (!container) throw new Error('Contenedor no encontrado en el DOM');
    container.innerHTML = '';

    const formatsToSupport = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    const qrCode = new Html5Qrcode(this.options.containerId, {
      formatsToSupport,
      verbose: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: false, // Forzar decodificador ZXing para soporte universal de EAN-13
      },
    });
    this.html5QrCode = qrCode;

    const config = {
      fps: this.options.fps || 20,
      qrbox: { width: 280, height: 160 },
      aspectRatio: 1.7777,
    };

    const facing = this.options.facingMode || 'environment';

    try {
      await qrCode.start(
        { facingMode: facing },
        config,
        (decodedText) => this.handleDetectedCode(decodedText, 'UNKNOWN'),
        () => {}
      );
    } catch {
      // Si la cámara trasera estricta falla, intentar cualquier dispositivo de video
      await qrCode.start(
        true as any,
        config,
        (decodedText) => this.handleDetectedCode(decodedText, 'UNKNOWN'),
        () => {}
      );
    }

    this.isScanning = true;
  }

  // Procesa el código detectado aplicando debounce / cooldown
  private handleDetectedCode(code: string, format: string): void {
    if (!code || !code.trim()) return;
    const clean = code.trim();
    const now = Date.now();
    const cooldown = this.options.cooldownMs || 1600;

    if (clean === this.lastScannedCode && now - this.lastScannedTime < cooldown) {
      return;
    }

    this.lastScannedCode = clean;
    this.lastScannedTime = now;

    const result: ScanResult = {
      code: clean,
      format,
      timestamp: now,
    };

    this.options.onScan(result);
  }

  // Linterna / Flashlight (si la cámara lo permite)
  public async setTorch(on: boolean): Promise<boolean> {
    try {
      if (this.nativeStream) {
        const track = this.nativeStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: on } as any],
          });
          return true;
        }
      } else if (this.html5QrCode) {
        await this.html5QrCode.applyVideoConstraints({
          advanced: [{ torch: on } as any],
        });
        return true;
      }
    } catch (err) {
      console.warn('Linterna no soportada en este dispositivo:', err);
    }
    return false;
  }

  // Verifica si la linterna está soportada
  public hasTorchCapability(): boolean {
    if (this.nativeStream) {
      const track = this.nativeStream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities ? (track.getCapabilities() as any) : {};
      return !!capabilities.torch;
    }
    return false;
  }

  // Detiene cámaras y bucles de renderizado
  public async stop(): Promise<void> {
    this.isScanning = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.nativeStream) {
      this.nativeStream.getTracks().forEach((track) => track.stop());
      this.nativeStream = null;
    }

    if (this.activeVideoElement) {
      this.activeVideoElement.srcObject = null;
      this.activeVideoElement = null;
    }

    if (this.html5QrCode) {
      try {
        if (this.html5QrCode.isScanning) {
          await this.html5QrCode.stop();
        }
      } catch (err) {
        // Ignorar interrupciones al detener escáner en caliente
      } finally {
        try {
          this.html5QrCode?.clear();
        } catch {
          // Ignorar advertencias si ya fue cerrado
        }
        this.html5QrCode = null;
      }
    }

    const container = document.getElementById(this.options.containerId);
    if (container) {
      container.innerHTML = '';
    }
  }

  public getEngine(): ScannerEngineType {
    return this.currentEngine;
  }
}

export default BarcodeScannerService;
