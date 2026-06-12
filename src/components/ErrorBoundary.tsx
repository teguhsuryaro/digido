import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
  children: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface-primary px-4">
          <div className="text-center max-w-md p-8 bg-surface-card rounded-2xl shadow-lg border border-border">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-content-primary mb-2">Terjadi Kesalahan</h1>
            <p className="text-content-secondary mb-6 text-sm">
              Maaf, terjadi kesalahan saat memuat halaman ini. Hal ini mungkin disebabkan oleh masalah koneksi atau error pada sistem.
            </p>
            <div className="bg-surface-secondary/50 p-4 rounded-xl text-left mb-6 overflow-auto max-h-32 text-xs font-mono text-content-secondary border border-border/50">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw size={18} className="mr-2" />
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
