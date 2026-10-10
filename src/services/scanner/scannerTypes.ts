export type ScannerEngineType = 'native-mlkit' | 'html5-fallback';

export interface ScanResult {
  code: string;
  format?: string;
  timestamp: number;
}

export interface ScannerOptions {
  containerId: string;
  videoElementId?: string;
  facingMode?: 'environment' | 'user';
  fps?: number;
  cooldownMs?: number;
  onScan: (result: ScanResult) => void;
  onError?: (error: Error) => void;
  onEngineResolved?: (engine: ScannerEngineType) => void;
}

export interface ScannerStatus {
  isActive: boolean;
  isInitializing: boolean;
  engine: ScannerEngineType;
  hasTorch: boolean;
  isTorchOn: boolean;
  facingMode: 'environment' | 'user';
  errorMessage: string | null;
}
