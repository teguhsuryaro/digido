import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';

/**
 * PrivateRoute — Melindungi route yang membutuhkan autentikasi.
 * Jika user belum login, redirect ke halaman login.
 * Memiliki timeout safety agar tidak stuck di "Memuat..." selamanya.
 */
export default function PrivateRoute() {
  const { isInitialized, isLoading } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  // Safety timeout: jika setelah 10 detik masih loading, tampilkan fallback
  useEffect(() => {
    if (!isInitialized || isLoading) {
      const timer = setTimeout(() => setTimedOut(true), 10000);
      return () => clearTimeout(timer);
    }
    setTimedOut(false);
  }, [isInitialized, isLoading]);

  // Masih loading auth state → tampilkan loading
  if (!isInitialized || isLoading) {
    if (timedOut) {
      // Setelah 10 detik, beri opsi refresh/redirect
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface-primary gap-4 px-4">
          <div className="text-center max-w-sm">
            <p className="text-content-primary font-semibold text-lg mb-2">Koneksi lambat?</p>
            <p className="text-content-secondary text-sm mb-6">
              Memuat sesi membutuhkan waktu lebih lama dari biasanya. Periksa koneksi internet Anda.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                Coba Lagi
              </button>
              <a
                href="/login"
                className="px-6 py-3 bg-surface-secondary text-content-primary border border-border rounded-xl font-semibold hover:bg-surface-hover transition-colors text-center"
              >
                Kembali ke Login
              </a>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="animate-pulse-soft text-primary-500 text-sm font-semibold">
            Memuat...
          </p>
        </div>
      </div>
    );
  }

  // Belum login → redirect ke login dengan menyimpan intended URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
