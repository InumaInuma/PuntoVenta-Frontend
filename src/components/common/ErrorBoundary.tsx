import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error no controlado:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black mb-2">
            {this.props.fallbackTitle || 'Algo salió mal'}
          </h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Ocurrió un error inesperado al renderizar la interfaz. Puedes reiniciar la vista para continuar operando.
          </p>
          {this.state.error && (
            <div className="max-w-md w-full bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-left text-xs font-mono text-rose-300 mb-6 overflow-x-auto">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="h-11 px-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/30"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recargar pantalla</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
