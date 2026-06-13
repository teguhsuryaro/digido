import { useEffect, useRef } from 'react';
import { toast } from '@/components/ui/Toast';

/**
 * Hook untuk handle error global yang tidak tertangani.
 * Menggunakan debounce agar tidak menspam toast saat error berulang.
 */
export const useGlobalErrorHandler = () => {
  const lastErrorTime = useRef(0);

  useEffect(() => {
    const shouldShowToast = () => {
      const now = Date.now();
      // Throttle: hanya tampilkan toast 1x per 5 detik
      if (now - lastErrorTime.current < 5000) return false;
      lastErrorTime.current = now;
      return true;
    };

    // Handle unhandled promise rejection
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = (reason?.message || reason?.toString() || '').toLowerCase();

      // Abaikan error yang sudah ditangani di tempat lain
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('load failed')) {
        // Network errors — jangan tampilkan toast generik, biarkan auth handler yang tangani
        console.warn('[GlobalError] Network error (suppressed toast):', reason);
        event.preventDefault();
        return;
      }

      console.error('[GlobalError] Unhandled rejection:', reason);
      if (shouldShowToast()) {
        toast.error('Terjadi error yang tidak terduga. Silakan refresh halaman.');
      }
    };

    // Handle global error
    const handleError = (event: ErrorEvent) => {
      const msg = (event.error?.message || event.message || '').toLowerCase();

      // Abaikan ResizeObserver loop errors (umum dan tidak berbahaya)
      if (msg.includes('resizeobserver')) return;

      // Abaikan chunk loading errors (lazy import gagal)
      if (msg.includes('loading chunk') || msg.includes('dynamically imported module')) {
        console.warn('[GlobalError] Chunk load failed, suggesting refresh...');
        if (shouldShowToast()) {
          toast.warning('Terjadi pembaruan. Halaman akan dimuat ulang...');
          setTimeout(() => window.location.reload(), 2000);
        }
        return;
      }

      console.error('[GlobalError] Error:', event.error);
      if (shouldShowToast()) {
        toast.error('Terjadi error yang tidak terduga. Silakan refresh halaman.');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
};
