import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';

interface RoleGuardProps {
  allowedRoles: Array<'pelanggan' | 'mitra'>;
  redirectTo?: string;
}

/**
 * RoleGuard — Membatasi akses berdasarkan role user.
 * Jika role tidak sesuai, redirect ke halaman yang ditentukan.
 */
export default function RoleGuard({
  allowedRoles,
  redirectTo = '/',
}: RoleGuardProps) {
  const userRole = useAuthStore((s) => s.getUserRole());

  if (!allowedRoles.includes(userRole as 'pelanggan' | 'mitra')) {
    toast.warning('Anda tidak memiliki akses ke halaman ini.');
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
