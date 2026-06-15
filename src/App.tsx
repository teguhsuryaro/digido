import { Suspense, useEffect, useCallback, useRef } from 'react';
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
  SuperadminDashboard, SuperadminMitraApproval, SuperadminReports, SuperadminUsers, SuperadminRevenuePage,
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

/** Helper: cek apakah error bersifat sementara (network/fetch) */
function isTransientError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || err.toString() || '').toLowerCase();
  return msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')
    || msg.includes('load failed') || msg.includes('networkerror') || msg.includes('aborterror')
    || msg.includes('timeout');
}

/** Helper: ambil profile dari DB, dengan retry untuk network error */
async function fetchProfile(userId: string, retries = 2): Promise<any | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (isTransientError(error) && i < retries) {
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
          continue;
        }
        throw error;
      }
      return data;
    } catch (err) {
      if (isTransientError(err) && i < retries) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  return null;
}

export default function App() {
  useGlobalErrorHandler();
  const { setAuth, setProfile, setInitialized, setLoading } = useAuthStore();
  const isRecoveringRef = useRef(false);

  /**
   * Fungsi utama untuk memuat/memvalidasi sesi.
   * Digunakan saat init, visibility change, dan heartbeat.
   */
  const loadSession = useCallback(async (opts?: { silent?: boolean; isRetry?: boolean }) => {
    const { silent = false, isRetry = false } = opts || {};

    // Cegah multiple concurrent recovery
    if (isRecoveringRef.current && !isRetry) {
      console.log('[Auth] loadSession sudah berjalan, skip duplikat.');
      return;
    }
    isRecoveringRef.current = true;

    try {
      if (!silent) setLoading(true);

      // Coba ambil session dari Supabase dengan Timeout 4 detik (Mencegah bug Web Locks)
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('GET_SESSION_TIMEOUT')), 4000)
      );

      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]);

      if (sessionError) {
        // Jika network error, jangan langsung logout — biarkan user lihat data lama
        if (isTransientError(sessionError)) {
          console.warn('[Auth] Network error saat getSession, menunggu koneksi pulih...');
          if (!silent) {
            toast.warning('Koneksi terputus. Mencoba menyambung kembali...');
          }
          // Tetap set initialized agar UI tidak stuck di "Memuat..."
          setInitialized(true);
          return;
        }
        // Error non-network (misal: refresh token invalid) → logout graceful
        console.error('[Auth] Session error (non-network):', sessionError.message);
        throw sessionError;
      }

      if (session?.user) {
        // Session valid, ambil/refresh profile
        try {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setAuth(session.user, session);
            setProfile(profile);
            
            if (silent) {
              useAuthStore.getState().bumpAuthVersion();
            }
          } else {
            // Profile tidak ditemukan — kemungkinan RLS menyembunyikan karena token kedaluwarsa atau invalid
            console.warn('[Auth] Profile tidak ditemukan untuk user:', session.user.id, '— Melakukan force logout untuk membersihkan sesi.');
            useAuthStore.getState().logout();
            await supabase.auth.signOut().catch(() => {});
          }
        } catch (profileErr) {
          if (isTransientError(profileErr)) {
            console.warn('[Auth] Network error saat fetch profile, pertahankan sesi saat ini...');
            // Jika sudah punya data auth sebelumnya, jangan hapus
            const current = useAuthStore.getState();
            if (!current.user) {
              // Belum pernah login, set minimal auth dari session
              setAuth(session.user, session);
            }
            setInitialized(true);
            return;
          }
          throw profileErr;
        }
      } else {
        // Tidak ada session (belum login atau sudah expired)
        if (!silent) {
          useAuthStore.getState().logout();
        } else {
          console.warn('[Auth] Silent check: session null, mempertahankan state saat ini.');
        }
      }
    } catch (err: any) {
      console.error('[Auth] Initialization error:', err);
      
      // Jika terjadi timeout pada Web Lock, hapus localStorage secara paksa
      if (err.message === 'GET_SESSION_TIMEOUT') {
        console.warn('[Auth] Web Lock stuck. Memaksa hapus session dari localStorage...');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
        useAuthStore.getState().logout();
      } else if (!isTransientError(err)) {
        useAuthStore.getState().logout();
        await supabase.auth.signOut().catch(() => {});
      }
    } finally {
      setInitialized(true);
      if (!silent) setLoading(false);
      isRecoveringRef.current = false;
    }
  }, [setAuth, setProfile, setInitialized, setLoading]);

  useEffect(() => {
    // 1. Inisialisasi awal
    loadSession();

    // 2. Listen perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip INITIAL_SESSION — sudah ditangani oleh loadSession di atas
        if (event === 'INITIAL_SESSION') return;

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setAuth(session.user, session);

            try {
              const profile = await fetchProfile(session.user.id);
              if (profile) {
                setProfile(profile);
              } else {
                console.warn('[Auth] Profile belum ada untuk user:', session.user.id,
                  '— Pastikan trigger on_auth_user_created sudah aktif di Supabase.');
              }
            } catch (profileErr) {
              if (!isTransientError(profileErr)) {
                console.error('[Auth] Profile fetch error on SIGNED_IN:', profileErr);
                useAuthStore.getState().logout();
                await supabase.auth.signOut().catch(() => {});
              }
            }

            setInitialized(true);
          }

          if (event === 'SIGNED_OUT') {
            useAuthStore.getState().logout();
            
            // Hard redirect ke login untuk mereset seluruh state React
            // Hanya jika pengguna tidak sedang di halaman publik
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/' && path !== '/register' && !path.startsWith('/katalog') && !path.startsWith('/umkm/')) {
              window.location.href = '/login';
            }
          }

          if (event === 'TOKEN_REFRESHED' && session) {
            useAuthStore.getState().refreshSession(session);
          }
        } catch (err) {
          console.error('[Auth] Auth state change error:', err);
          // Pastikan loading berhenti meski ada error
          setInitialized(true);
        }
      },
    );

    // 3. Visibility change — re-validasi sesi saat user kembali ke tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Saat tab kembali aktif, validasi sesi secara silent hanya jika sudah login
        const currentState = useAuthStore.getState();
        if (currentState.isAuthenticated()) {
          loadSession({ silent: true });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Online event — re-validasi sesi saat koneksi internet kembali
    const handleOnline = () => {
      console.log('[Auth] Koneksi internet kembali. Menyambung ulang...');
      toast.info('Koneksi kembali. Menyinkronkan data...');
      loadSession({ silent: true });
    };
    window.addEventListener('online', handleOnline);

    // 5. Heartbeat (keep session alive & validate connection) — setiap 10 menit
    const heartbeatInterval = setInterval(() => {
      if (!useAuthStore.getState().isAuthenticated()) return;
      // Heartbeat hanya silent-check, tidak force logout
      loadSession({ silent: true });
    }, 10 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadSession]);

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
                <Route path="pengaturan/langganan" element={<SubscriptionPage />} />
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
                <Route path="pengguna" element={<SuperadminUsers />} />
                <Route path="pendapatan" element={<SuperadminRevenuePage />} />
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
