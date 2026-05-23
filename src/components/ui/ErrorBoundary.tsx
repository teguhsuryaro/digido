import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-secondary rounded-2xl shadow-xl p-8 text-center border border-border">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-content-primary mb-3">
              Oops! Terjadi Kesalahan
            </h1>
            <p className="text-content-secondary mb-8">
              Aplikasi mengalami masalah saat memuat halaman ini. Silakan muat ulang halaman atau kembali ke Beranda.
            </p>
            
            <div className="flex flex-col gap-3 sm:flex-row justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-button font-semibold hover:bg-primary-600 transition-colors"
              >
                <RefreshCw size={18} />
                <span>Muat Ulang</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-primary text-content-primary border border-border rounded-button font-semibold hover:bg-surface-secondary transition-colors"
              >
                <Home size={18} />
                <span>Ke Beranda</span>
              </button>
            </div>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 text-left bg-surface-primary p-4 rounded-lg border border-border overflow-auto max-h-48 text-xs font-mono text-content-tertiary">
                <p className="font-semibold text-red-500 mb-2">{this.state.error.toString()}</p>
                <p className="whitespace-pre-wrap">{this.state.error.stack}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
