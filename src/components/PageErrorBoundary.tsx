import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  pageName?: string;
}

/**
 * Error boundary untuk membungkus halaman individual.
 * Jika error terjadi di halaman ini, hanya halaman ini yang terganggu —
 * navbar dan sidebar tetap berfungsi.
 */
export default function PageErrorBoundary({ children, pageName }: Props) {
  return (
    <ErrorBoundary
      fullscreen={false}
      fallbackLabel={pageName ? `Gagal memuat ${pageName}` : 'Gagal memuat halaman'}
    >
      {children}
    </ErrorBoundary>
  );
}
