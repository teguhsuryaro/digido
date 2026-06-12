import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { ToastContainer, toast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Guards
import PrivateRoute from '@/components/guards/PrivateRoute';
import RoleGuard from '@/components/guards/RoleGuard';
import GuestRoute from '@/components/guards/GuestRoute';

// Layouts
import CustomerLayout from '@/components/layout/CustomerLayout';
import MitraLayout from '@/components/layout/MitraLayout';
import SuperadminLayout from '@/components/layout/SuperadminLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Pages (lazy loaded)
import {
  LoginPage, RegisterPage, MitraRegisterPage,
  HomePage, UMKMListPage, UMKMDetailPage, SearchResultsPage,
  CartPage, CheckoutPage, WalletPage,
  OrdersPage, OrderDetailPage, ProfilePage,
  MitraDashboardPage, InventarisPage, OrderManagementPage, DeliverySettingsPage,
  OperasionalPage, FinansialPage, LiveChatPage, MitraProfilePage, MitraSettingsPage,
  SubscriptionPage, UMKMReviewsPage,
  SuperadminDashboard, SuperadminMitraApproval, SuperadminReports,
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
    const initAuth = async (retryCount = 0) => {
      try {
        if (retryCount === 0) setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // Deteksi network error
          const isNetworkError = error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network');
          if (isNetworkError && retryCount < 3) {
            console.warn(`Koneksi database gagal. Mencoba ulang... (${retryCount + 1}/3)`);
            toast.warning(`Koneksi terputus. Mencoba ulang... (${retryCount + 1}/3)`);
            setTimeout(() => initAuth(retryCount + 1), 2000 * Math.pow(2, retryCount));
            return; // Tunggu eksekusi berikutnya
          }
          throw error;
        }

        if (session?.user) {
          // Ambil profile dari database
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
             const isNetworkError = profileError.message.toLowerCase().includes('fetch') || profileError.message.toLowerCase().includes('network');
             if (isNetworkError && retryCount < 3) {
               console.warn(`Gagal memuat profil. Mencoba ulang... (${retryCount + 1}/3)`);
               setTimeout(() => initAuth(retryCount + 1), 2000 * Math.pow(2, retryCount));
               return;
             }
             throw profileError;
          }

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
      } catch (err: any) {
        // Jika ada error apapun (misal token expired/invalid), bersihkan session
        console.error('Auth initialization error:', err);
        if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
           toast.error('Gagal terhubung ke database. Periksa koneksi internet Anda.');
        }
        useAuthStore.getState().logout();
        await supabase.auth.signOut().catch(() => {});
      } 
      
      // Dipanggil jika sukses atau gagal sepenuhnya (bukan sedang retry)
      setInitialized(true);
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

    // 3. Heartbeat (keep session alive & validate connection)
    const heartbeatInterval = setInterval(async () => {
      if (!useAuthStore.getState().isAuthenticated()) return;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Heartbeat session error:', error.message);
          const isNetworkError = error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network');
          if (!isNetworkError) {
             // Jika bukan error network (misal token expired), sign out
             useAuthStore.getState().logout();
          }
        } else if (!session) {
          useAuthStore.getState().logout();
        }
      } catch (e) {
        console.error('Heartbeat failed', e);
      }
    }, 5 * 60 * 1000); // 5 menit

    return () => {
      subscription.unsubscribe();
      clearInterval(heartbeatInterval);
    };
  }, [setAuth, setProfile, setInitialized, setLoading]);

  return (
    <ErrorBoundary>
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
                <Route index element={<MitraDashboardPage />} />
                <Route path="inventaris" element={<InventarisPage />} />
                <Route path="pesanan" element={<OrderManagementPage />} />
                <Route path="pengaturan" element={<MitraSettingsPage />} />
                <Route path="pengaturan/operasional" element={<OperasionalPage />} />
                <Route path="pengaturan/profil" element={<MitraProfilePage />} />
                <Route path="pengaturan/paket" element={<SubscriptionPage />} />
                <Route path="pengaturan/pengiriman" element={<DeliverySettingsPage />} />
                <Route path="pengaturan/finansial" element={<FinansialPage />} />
                <Route path="pengaturan/katalog" element={<InventarisPage />} />
                <Route path="chat" element={<LiveChatPage />} />
              </Route>
            </Route>

            {/* ===== SUPERADMIN ROUTES (Role: superadmin only) ===== */}
            <Route element={<RoleGuard allowedRoles={['superadmin']} redirectTo="/" />}>
              <Route path="/superadmin" element={<SuperadminLayout />}>
                <Route index element={<SuperadminDashboard />} />
                <Route path="mitra" element={<SuperadminMitraApproval />} />
                <Route path="laporan" element={<SuperadminReports />} />
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
    </ErrorBoundary>
  );
}
