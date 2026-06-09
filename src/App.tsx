import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { ToastContainer } from '@/components/ui/Toast';

// Guards
import PrivateRoute from '@/components/guards/PrivateRoute';
import RoleGuard from '@/components/guards/RoleGuard';
import GuestRoute from '@/components/guards/GuestRoute';

// Layouts
import CustomerLayout from '@/components/layout/CustomerLayout';
import MitraLayout from '@/components/layout/MitraLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Pages (lazy loaded)
import {
  LoginPage, RegisterPage, MitraRegisterPage,
  HomePage, UMKMListPage, UMKMDetailPage, SearchResultsPage,
  CartPage, CheckoutPage, WalletPage,
  OrdersPage, OrderDetailPage, ProfilePage,
  InventarisPage, OrderManagementPage, DeliverySettingsPage,
  OperasionalPage, FinansialPage, LiveChatPage, MitraProfilePage,
  SubscriptionPage, UMKMReviewsPage,
} from '@/pages';

import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler';

// Fallback saat lazy loading
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="animate-pulse-soft text-primary-500 font-semibold text-sm">
        Memuat halaman...
      </p>
    </div>
  );
}

export default function App() {
  useGlobalErrorHandler();
  const { setAuth, setProfile, setInitialized, setLoading } = useAuthStore();

  useEffect(() => {
    // 1. Cek session yang sudah ada
    const initAuth = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          // Ambil profile dari database
          // Gunakan maybeSingle() agar tidak throw error jika profile belum ada
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) throw profileError;

          if (profile) {
            setAuth(session.user, session);
            setProfile(profile as any);
          } else {
            console.warn('Profile tidak ditemukan untuk session berjalan. Membersihkan session...');
            throw new Error('Profile not found');
          }
        } else {
          useAuthStore.getState().logout();
        }
      } catch (err) {
        // Jika ada error apapun (misal token expired/invalid), bersihkan session
        console.error('Auth initialization error:', err);
        useAuthStore.getState().logout();
        await supabase.auth.signOut().catch(() => {});
      } finally {
        // Pastikan loading SELALU selesai, apapun yang terjadi
        setInitialized(true);
      }
    };

    initAuth();

    // 2. Listen perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip INITIAL_SESSION — sudah ditangani oleh initAuth di atas
        if (event === 'INITIAL_SESSION') return;

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setAuth(session.user, session);

            // maybeSingle() tidak throw error jika profil belum ada
            const { data: profile, error: profileErr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileErr) {
              console.error('Profile fetch error on SIGNED_IN:', profileErr.message);
              useAuthStore.getState().logout();
              await supabase.auth.signOut().catch(() => {});
            } else if (profile) {
              setProfile(profile as any);
            } else {
              // Profil belum ada (trigger DB belum berjalan).
              // Tetap set initialized agar app tidak stuck "Memuat"
              console.warn('Profile tidak ditemukan untuk user:', session.user.id,
                '— Pastikan trigger on_auth_user_created sudah aktif di Supabase.');
            }

            // Pastikan loading selalu berhenti setelah SIGNED_IN selesai diproses
            setInitialized(true);
          }

          if (event === 'SIGNED_OUT') {
            useAuthStore.getState().logout();
            
            // Gunakan optional chaining/dynamic import untuk store lain jika diperlukan, 
            // atau panggil fungsi pembersihan spesifik.
            
            // Hard redirect ke login untuk mereset seluruh state React (mencegah abu-abu)
            // Hanya jika pengguna tidak sedang di halaman publik
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/' && path !== '/register' && !path.startsWith('/katalog') && !path.startsWith('/umkm/')) {
              window.location.href = '/login';
            }
          }

          if (event === 'TOKEN_REFRESHED' && session) {
            setAuth(session.user, session);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          // Pastikan loading berhenti meski ada error
          setInitialized(true);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [setAuth, setProfile, setInitialized, setLoading]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ===== AUTH ROUTES (Guest Only) ===== */}
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          {/* ===== PUBLIC ROUTES (Semua user termasuk Guest) ===== */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/katalog" element={<UMKMListPage />} />
            <Route path="/umkm/:id" element={<UMKMDetailPage />} />
            <Route path="/umkm/:id/ulasan" element={<UMKMReviewsPage />} />
            <Route path="/cari" element={<SearchResultsPage />} />
          </Route>

          {/* ===== PROTECTED ROUTES (Pelanggan & Mitra) ===== */}
          <Route element={<PrivateRoute />}>
            <Route element={<CustomerLayout />}>
              <Route path="/keranjang" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/dompet" element={<WalletPage />} />
              <Route path="/pesanan" element={<OrdersPage />} />
              <Route path="/pesanan/:id" element={<OrderDetailPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/daftar-mitra" element={<MitraRegisterPage />} />
            </Route>

            {/* ===== MITRA ROUTES (Role: mitra only) ===== */}
            <Route element={<RoleGuard allowedRoles={['mitra']} redirectTo="/" />}>
              <Route path="/mitra" element={<MitraLayout />}>
                <Route index element={<InventarisPage />} />
                <Route path="inventaris" element={<InventarisPage />} />
                <Route path="profil" element={<MitraProfilePage />} />
                <Route path="paket" element={<SubscriptionPage />} />
                <Route path="pesanan" element={<OrderManagementPage />} />
                <Route path="pengiriman" element={<DeliverySettingsPage />} />
                <Route path="operasional" element={<OperasionalPage />} />
                <Route path="finansial" element={<FinansialPage />} />
                <Route path="chat" element={<LiveChatPage />} />
              </Route>
            </Route>
          </Route>

          {/* ===== 404 ===== */}
          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-surface-primary px-4">
              <div className="text-center max-w-md">
                <h1 className="text-8xl sm:text-9xl font-extrabold text-gradient mb-4">404</h1>
                <h2 className="text-xl sm:text-2xl font-bold text-content-primary mb-2">Halaman Tidak Ditemukan</h2>
                <p className="text-content-secondary mb-8">
                  Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-button font-semibold hover:bg-primary-600 transition-colors">
                    Kembali ke Beranda
                  </a>
                  <button onClick={() => window.history.back()} className="inline-flex items-center justify-center px-6 py-3 bg-surface-secondary text-content-primary border border-border rounded-button font-semibold hover:bg-surface-secondary/80 transition-colors">
                    Halaman Sebelumnya
                  </button>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  );
}
