import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, LogOut, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { handleLogout } from '@/utils/logout';
import Button from '@/components/ui/Button';
import ConfirmLogoutModal from '@/components/ui/ConfirmLogoutModal';
import { useState } from 'react';

const sidenavItems = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/mitra', icon: Users, label: 'Validasi Mitra' },
  { to: '/superadmin/laporan', icon: AlertTriangle, label: 'Laporan Masuk' },
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
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-red-500">Superadmin</h2>
          </div>
          <p className="text-xs text-content-secondary mt-1 pl-7">
            {profile?.full_name || 'Admin'}
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
      <main className="flex-1 min-w-0 w-full max-w-6xl mx-auto px-4 py-6 md:px-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-border z-40">
        <div className="flex items-center h-16 pb-safe-bottom px-2 overflow-x-auto scrollbar-hide justify-around">
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
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="text-[10px] font-bold">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex flex-col items-center justify-center gap-1 w-16 shrink-0 transition-colors text-content-secondary hover:text-red-500"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Keluar</span>
          </button>
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
