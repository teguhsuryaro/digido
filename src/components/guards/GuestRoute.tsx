import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * GuestRoute — Halaman yang hanya bisa diakses saat BELUM login.
 * Jika sudah login, redirect ke beranda.
 * Contoh: Login page, Register page.
 */
export default function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="animate-pulse-soft text-primary-500 text-lg font-semibold">
          Memuat...
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const role = useAuthStore.getState().profile?.role;
    if (role === 'superadmin') return <Navigate to="/superadmin" replace />;
    if (role === 'mitra') return <Navigate to="/mitra" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
