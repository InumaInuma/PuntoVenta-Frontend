import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { API_URL } from './api';
import { AuthStorage } from './storage';

export interface VentaRegistradaNotificacion {
  ventaId: number;
  numeroComprobante: string;
  totalVenta: number;
  clienteNombre: string;
  cajeroNombre: string;
  fechaVenta: string;
}

export interface VentaAnuladaNotificacion {
  ventaId: number;
  numeroComprobante: string;
  motivoAnulacion: string;
  usuarioAnulacion: string;
  fechaAnulacion: string;
}

export interface CotizacionNotificacion {
  cotizacionId: number;
  codigoCotizacion: string;
  clienteNombre: string;
  total: number;
  fechaEmision: string;
}

export interface CotizacionConvertidaNotificacion {
  cotizacionId: number;
  ventaId: number;
  usuarioConversion: string;
  fechaConversion: string;
}

class SignalRService {
  private connection: HubConnection | null = null;
  private startingPromise: Promise<HubConnection | null> | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  private getHubUrl(): string {
    const base = API_URL.replace(/\/api\/?$/, '');
    return `${base}/hubs/pos`;
  }

  public async start(): Promise<HubConnection | null> {
    const token = AuthStorage.getToken();
    if (!token) {
      return null;
    }

    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.startingPromise) {
      return this.startingPromise;
    }

    this.startingPromise = (async () => {
      try {
        if (!this.connection) {
          this.connection = new HubConnectionBuilder()
            .withUrl(this.getHubUrl(), {
              accessTokenFactory: () => AuthStorage.getToken() || '',
              withCredentials: true,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.None)
            .build();

          this.connection.onreconnected(() => {
            console.info('SignalR reconectado exitosamente al POS Hub.');
          });

          this.registerDispatchers();
        }

        if (this.connection.state === HubConnectionState.Disconnected) {
          await this.connection.start();
          console.info('SignalR conectado al POS Hub (Grupo de Tenant activo).');
        }

        return this.connection;
      } catch (err) {
        console.warn('No se pudo establecer conexión con SignalR Hub:', err);
        return null;
      } finally {
        this.startingPromise = null;
      }
    })();

    return this.startingPromise;
  }

  private registerDispatchers(): void {
    if (!this.connection) return;

    const events = [
      'VentaRegistrada',
      'VentaAnulada',
      'CotizacionCreada',
      'CotizacionConvertidaAVenta',
    ];

    events.forEach((evt) => {
      this.connection?.on(evt, (payload: any) => {
        const callbacks = this.listeners.get(evt);
        if (callbacks && callbacks.size > 0) {
          callbacks.forEach((cb) => {
            try {
              cb(payload);
            } catch (err) {
              console.error(`Error en listener de evento SignalR ${evt}:`, err);
            }
          });
        }
      });
    });
  }

  public on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.start();

    return () => this.off(event, callback);
  }

  public off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  public async stop(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (err) {
        console.error('Error al desconectar SignalR:', err);
      } finally {
        this.connection = null;
        this.startingPromise = null;
      }
    }
  }

  public onVentaRegistrada(callback: (data: VentaRegistradaNotificacion) => void): () => void {
    return this.on('VentaRegistrada', callback);
  }

  public onVentaAnulada(callback: (data: VentaAnuladaNotificacion) => void): () => void {
    return this.on('VentaAnulada', callback);
  }

  public onCotizacionCreada(callback: (data: CotizacionNotificacion) => void): () => void {
    return this.on('CotizacionCreada', callback);
  }

  public onCotizacionConvertida(callback: (data: CotizacionConvertidaNotificacion) => void): () => void {
    return this.on('CotizacionConvertidaAVenta', callback);
  }
}

export const signalRService = new SignalRService();
