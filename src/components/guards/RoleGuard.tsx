import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';

interface RoleGuardProps {
  allowedRoles: Array<'pelanggan' | 'mitra' | 'superadmin'>;
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
  const profile = useAuthStore((s) => s.profile);
  const userRole = useAuthStore((s) => s.getUserRole());
  const logout = useAuthStore((s) => s.logout);

  if (profile?.ban_status === 'banned_permanent') {
    toast.error('Akun Anda telah dinonaktifkan secara permanen. Hubungi admin untuk informasi lebih lanjut.');
    // Force logout in background, user will be redirected
    setTimeout(() => logout(), 100);
    return <Navigate to="/login" replace />;
  }

  // Jika yang diminta HANYA pelanggan, dan user di-banned sebagai pelanggan
  if (profile?.ban_status === 'banned_pelanggan' && allowedRoles.length === 1 && allowedRoles.includes('pelanggan')) {
    toast.error('Akun Anda sedang dibatasi untuk mode pelanggan.');
    return <Navigate to="/mitra" replace />; // fallback to mitra if they have it, or login
  }

  // Jika yang diminta HANYA mitra, dan user di-banned sebagai mitra
  if (profile?.ban_status === 'banned_mitra' && allowedRoles.length === 1 && allowedRoles.includes('mitra')) {
    toast.error('Akun Anda sedang dibatasi untuk mode mitra.');
    return <Navigate to="/" replace />; // fallback to pelanggan
  }

  if (!allowedRoles.includes(userRole as 'pelanggan' | 'mitra' | 'superadmin')) {
    toast.warning('Anda tidak memiliki akses ke halaman ini.');
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
