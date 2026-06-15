import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
  children?: ReactNode;
  /** Jika true, tampilan error fullscreen. Jika false, tampilan inline (untuk per-page boundary). */
  fullscreen?: boolean;
  /** Label fallback untuk tombol (opsional) */
  fallbackLabel?: string;
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
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  /**
   * Reset state error → React akan re-render children.
   * Ini TIDAK reload halaman — hanya me-retry rendering.
   */
  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const isFullscreen = this.props.fullscreen !== false; // Default true

      return (
        <div className={`flex flex-col items-center justify-center px-4 ${isFullscreen ? 'min-h-screen bg-surface-primary' : 'py-12 w-full h-full'}`}>
          <div className="text-center max-w-md p-8 bg-surface-card rounded-2xl shadow-lg border border-border w-full">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-content-primary mb-2">
              {this.props.fallbackLabel || 'Terjadi Kesalahan'}
            </h2>
            <p className="text-content-secondary mb-4 text-sm">
              Maaf, terjadi kesalahan saat memuat halaman ini. Hal ini mungkin disebabkan oleh masalah koneksi atau error pada sistem.
            </p>
            <div className="bg-surface-secondary/50 p-3 rounded-xl text-left mb-6 overflow-auto max-h-24 text-xs font-mono text-content-secondary border border-border/50">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <div className="flex flex-col gap-3">
              {/* Tombol utama: Coba Lagi TANPA reload */}
              <Button
                variant="primary"
                onClick={this.handleRetry}
                className="w-full justify-center"
              >
                <RotateCcw size={18} className="mr-2" />
                Coba Lagi
              </Button>
              {/* Tombol sekunder: Full reload sebagai fallback */}
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-content-secondary hover:text-content-primary transition-colors underline py-2"
              >
                Muat ulang seluruh halaman
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
