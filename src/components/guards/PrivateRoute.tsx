import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * PrivateRoute — Melindungi route yang membutuhkan autentikasi.
 * Jika user belum login, redirect ke halaman login.
 */
export default function PrivateRoute() {
  const { isInitialized, isLoading } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const location = useLocation();

  // Masih loading auth state → tampilkan loading
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="animate-pulse-soft text-primary-500 text-lg font-semibold">
          Memuat...
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
