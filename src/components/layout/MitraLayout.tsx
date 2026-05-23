import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Package, ClipboardList, Truck, Settings, CreditCard, MessageCircle, ShoppingBag, LogOut, Store, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { handleLogout } from '@/utils/logout';
import Button from '@/components/ui/Button';

const sidenavItems = [
  { to: '/mitra/inventaris', icon: Package, label: 'Inventaris' },
  { to: '/mitra/pesanan', icon: ClipboardList, label: 'Pesanan' },
  { to: '/mitra/pengiriman', icon: Truck, label: 'Pengiriman' },
  { to: '/mitra/operasional', icon: Settings, label: 'Operasional' },
  { to: '/mitra/finansial', icon: CreditCard, label: 'Finansial' },
  { to: '/mitra/chat', icon: MessageCircle, label: 'Live Chat' },
  { to: '/mitra/profil', icon: User, label: 'Profil' },
];

export default function MitraLayout() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();

  const onLogout = async () => {
    await handleLogout(navigate);
  };

  return (
    <div className="min-h-screen bg-surface-primary text-content-primary flex pb-20 md:pb-0">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex md:flex-col md:w-60 bg-surface-card border-r border-border p-4 gap-2 shrink-0">
        
        {/* Sidebar Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Store size={20} className="text-primary-500" />
            <h2 className="text-lg font-bold text-primary-500">DigiDO Mitra</h2>
          </div>
          <p className="text-xs text-content-secondary mt-1 truncate pl-7">
            {profile?.full_name || 'Mitra UMKM'}
          </p>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          {sidenavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                      : 'text-content-secondary hover:bg-surface-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Extra Links */}
        <div className="border-t border-border pt-2 space-y-1 mt-auto">
          <NavLink
            to="/katalog"
            className="flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium text-content-secondary hover:bg-surface-secondary transition-colors"
          >
            <ShoppingBag size={18} className="shrink-0" />
            <span>Belanja</span>
          </NavLink>
          <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
            <LogOut size={16} className="mr-2" /> Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 md:px-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-border z-40">
        <div className="flex justify-around items-center h-16 pb-safe-bottom px-1">
          {sidenavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-1 py-1 transition-colors ${
                    isActive ? 'text-primary-500' : 'text-content-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="text-[8px] font-bold">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
          <NavLink
            to="/katalog"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-1 py-1 transition-colors ${
                isActive ? 'text-primary-500' : 'text-content-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <ShoppingBag size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[8px] font-bold">Belanja</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
