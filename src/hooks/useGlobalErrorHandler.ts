import { useEffect } from 'react';
import { toast } from '@/components/ui/Toast';

/**
 * Hook untuk handle error global yang tidak tertangani
 * Ini membantu catch error yang terlewat di component
 */
export const useGlobalErrorHandler = () => {
  useEffect(() => {
    // Handle unhandled promise rejection
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      toast.error('Terjadi error yang tidak terduga. Silakan refresh halaman.');
    };

    // Handle global error
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      toast.error('Terjadi error yang tidak terduga. Silakan refresh halaman.');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
};
