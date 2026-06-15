import { useEffect } from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { Home, ShoppingBag, ClipboardList, User } from 'lucide-react';
import Navbar from './Navbar';
import PageErrorBoundary from '@/components/PageErrorBoundary';
import { useLocationStore } from '@/store/useLocationStore';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { to: '/', icon: Home, label: 'Beranda' },
  { to: '/katalog', icon: ShoppingBag, label: 'Katalog' },
  { to: '/pesanan', icon: ClipboardList, label: 'Pesanan' },
  { to: '/profil', icon: User, label: 'Profil' },
];

export default function CustomerLayout() {
  const userLocation = useLocationStore((s) => s.userLocation);
  const setUserLocation = useLocationStore((s) => s.setUserLocation);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          console.warn('Geolocation denied or unavailable.');
        }
      );
    }
  }, [userLocation, setUserLocation]);

  if (profile?.role === 'superadmin') {
    return <Navigate to="/superadmin" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-primary text-content-primary pb-20 md:pb-0">
      <Navbar />
      
      {/* Konten Halaman — full-width di desktop */}
      <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageErrorBoundary>
          <Outlet />
        </PageErrorBoundary>
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-border z-40">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 pb-safe-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-1 transition-base ${
                    isActive
                      ? 'text-primary-500'
                      : 'text-content-secondary hover:text-content-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
