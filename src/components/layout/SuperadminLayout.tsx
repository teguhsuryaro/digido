import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, LogOut, ShieldAlert, Banknote } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { handleLogout } from '@/utils/logout';
import Button from '@/components/ui/Button';
import ConfirmLogoutModal from '@/components/ui/ConfirmLogoutModal';
import ThemeToggle from '@/components/ui/ThemeToggle';
import PageErrorBoundary from '@/components/PageErrorBoundary';
import { useState } from 'react';

const sidenavItems = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Dasbor' },
  { to: '/superadmin/pengguna', icon: Users, label: 'Pengguna', shortLabel: 'Pengguna' },
  { to: '/superadmin/mitra', icon: Users, label: 'Validasi Mitra', shortLabel: 'Mitra' },
  { to: '/superadmin/laporan', icon: AlertTriangle, label: 'Laporan Masuk', shortLabel: 'Laporan' },
  { to: '/superadmin/pendapatan', icon: Banknote, label: 'Pendapatan', shortLabel: 'Pendapatan' },
];

export default function SuperadminLayout() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const onLogout = async () => {
    await handleLogout(navigate);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-surface-primary text-content-primary flex pb-20 md:pb-0">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-surface-card border-r border-border p-4 gap-2 shrink-0">
        
        {/* Sidebar Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-card border border-red-100 dark:border-red-900/50">
            <ShieldAlert size={24} className="text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <h2 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-none">Superadmin</h2>
              <p className="text-[10px] text-red-500/80 font-medium mt-1">Mode Manajemen</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-content-secondary font-medium truncate max-w-[140px]">
              {profile?.full_name || 'Administrator'}
            </p>
            <ThemeToggle />
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          {sidenavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/superadmin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
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
        <div className="border-t border-border pt-2 mt-auto">
          <Button variant="ghost" size="sm" onClick={() => setIsLogoutModalOpen(true)} className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
            <LogOut size={16} className="mr-2" /> Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        {/* Mobile Header (Sticky) */}
        <header className="md:hidden sticky top-0 z-30 bg-surface-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 px-3 py-1.5 rounded-full">
            <ShieldAlert size={16} className="text-red-600 dark:text-red-400" />
            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Superadmin Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="p-1.5 text-content-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="w-full max-w-5xl mx-auto px-4 py-6 md:px-8">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-border z-40">
        <div className="flex items-center justify-around h-16 pb-safe-bottom px-2 w-full">
          {sidenavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/superadmin'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 w-16 shrink-0 transition-colors ${
                    isActive ? 'text-red-500' : 'text-content-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="text-[9px] font-bold text-center leading-tight truncate w-full px-1">{item.shortLabel}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <ConfirmLogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
      />
    </div>
  );
}
