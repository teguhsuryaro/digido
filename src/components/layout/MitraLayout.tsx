import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import PageErrorBoundary from '@/components/PageErrorBoundary';
import { LayoutDashboard, Store, ClipboardList, Settings, LogOut, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useMitraChatStore } from '@/store/useMitraChatStore';
import { handleLogout } from '@/utils/logout';
import Button from '@/components/ui/Button';
import ConfirmLogoutModal from '@/components/ui/ConfirmLogoutModal';

const sidenavItems = [
  { to: '/mitra', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mitra/pesanan', icon: ClipboardList, label: 'Pesanan' },
  { to: '/mitra/chat', icon: MessageCircle, label: 'Live Chat' },
  { to: '/mitra/pengaturan', icon: Settings, label: 'Pengaturan' },
];

export default function MitraLayout() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const [umkmId, setUmkmId] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const addSession = useMitraChatStore(s => s.addSession);
  const unreadCount = useMitraChatStore(s => 
    Object.values(s.sessions).filter(sess => sess.status === 'active' && sess.hasUnread).length
  );

  useEffect(() => {
    if (!profile) return;
    const fetchUmkmId = async () => {
      const { data } = await supabase.from('umkm').select('id').eq('owner_id', profile.id).single();
      if (data) setUmkmId((data as any).id);
    };
    fetchUmkmId();
  }, [profile]);

  useEffect(() => {
    if (!umkmId) return;
    const channel = supabase.channel(`chat_inbox:${umkmId}`);
    channel.on('broadcast', { event: 'new_chat' }, ({ payload }) => {
      addSession(payload.session);
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [umkmId, addSession]);

  const onLogout = async () => {
    await handleLogout(navigate);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-surface-primary text-content-primary flex pb-20 md:pb-0">
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
                end={item.to === '/mitra'}
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
                    <div className="relative">
                      <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                      {item.to === '/mitra/chat' && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Extra Links */}
        <div className="border-t border-border pt-2 space-y-1 mt-auto">

          <Button variant="ghost" size="sm" onClick={() => setIsLogoutModalOpen(true)} className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
            <LogOut size={16} className="mr-2" /> Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full max-w-5xl mx-auto px-4 py-6 md:px-8">
        <PageErrorBoundary>
          <Outlet />
        </PageErrorBoundary>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-border z-40">
        <div className="flex items-center justify-around h-16 pb-safe-bottom px-4 w-full">
          {sidenavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/mitra'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 w-16 shrink-0 transition-colors ${
                    isActive ? 'text-primary-500' : 'text-content-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                      {item.to === '/mitra/chat' && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-in zoom-in border-2 border-surface-card">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] font-bold">{item.label}</span>
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
