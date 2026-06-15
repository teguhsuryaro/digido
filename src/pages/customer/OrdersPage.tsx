import { useEffect, useState } from 'react';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { ClipboardList } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import OrderCard from '@/components/OrderCard';

type TabType = 'active' | 'history';

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const authVersion = useAuthStore((s) => s.authVersion);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('orders')
        .select('*, umkm(name)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useRefetchOnFocus(fetchOrders, { enabled: !!user });

  useEffect(() => {
    fetchOrders();
  }, [user?.id, authVersion]);

  useEffect(() => {
    // Subscribe to Real-time updates
    if (!user) return;

    const channel = supabase
      .channel(`public:orders:customer_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and UPDATE
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch orders when there is a change
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, authVersion]);

  const activeOrders = orders.filter(o => 
    !['completed', 'cancelled', 'rejected'].includes(o.status)
  );
  
  const historyOrders = orders.filter(o => 
    ['completed', 'cancelled', 'rejected'].includes(o.status)
  );

  const displayedOrders = activeTab === 'active' ? activeOrders : historyOrders;

  return (
    <PageTransition>
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Pesanan Saya</h1>
          <p className="text-sm text-content-secondary mt-1">Pantau status pesanan makanan Anda.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 text-sm font-bold transition-base border-b-2 ${
              activeTab === 'active' 
                ? 'border-primary-500 text-primary-500' 
                : 'border-transparent text-content-placeholder hover:text-content-secondary'
            }`}
          >
            Aktif ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-bold transition-base border-b-2 ${
              activeTab === 'history' 
                ? 'border-primary-500 text-primary-500' 
                : 'border-transparent text-content-placeholder hover:text-content-secondary'
            }`}
          >
            Riwayat ({historyOrders.length})
          </button>
        </div>

        {/* Order List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-card" />
            ))}
          </div>
        ) : displayedOrders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {displayedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="text-5xl mb-4 text-content-placeholder opacity-40">
              <ClipboardList size={48} />
            </div>
            <p className="text-content-primary font-bold">Belum ada pesanan {activeTab === 'active' ? 'aktif' : 'di riwayat'}</p>
            <p className="text-content-secondary text-sm mt-1">
              {activeTab === 'active' 
                ? 'Yuk, mulai pesan makanan favoritmu!' 
                : 'Pesanan yang sudah selesai atau dibatalkan akan muncul di sini.'}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
