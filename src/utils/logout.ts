import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';

export async function handleLogout(navigate: (path: string) => void) {
  // 1. Bersihkan state lokal (Zustand) terlebih dahulu
  // Ini memastikan isAuthenticated menjadi false
  useAuthStore.getState().logout();
  useCartStore.getState().clearCart();

  // 2. Arahkan ke halaman login
  // Karena isAuthenticated sudah false, GuestRoute tidak akan melempar kita ke beranda (/)
  navigate('/login', { replace: true });

  // 3. Hapus session dari Supabase
  await supabase.auth.signOut();
}
