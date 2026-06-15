import { useEffect, useState, useCallback } from 'react';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { formatRupiah } from '@/utils/format';

export default function MitraDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const authVersion = useAuthStore((s) => s.authVersion);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Get UMKM ID
      const { data: umkm } = (await supabase
        .from('umkm')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()) as any;

      if (!umkm) return;

      // 2. Get Products Count
      const { data: products } = (await supabase
        .from('products')
        .select('id, daily_stock, is_available')
        .eq('umkm_id', umkm.id)) as any;

      const totalProducts = products?.length || 0;
      const lowStockProducts = products?.filter((p: any) => p.is_available && p.daily_stock !== null && p.daily_stock <= 5).length || 0;

      // 3. Get Today's Orders (only completed, to match FinansialPage)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: orders } = (await supabase
        .from('orders')
        .select('id, total, admin_fee, status')
        .eq('umkm_id', umkm.id)
        .eq('status', 'completed')
        .gte('created_at', today.toISOString())) as any;

      const todayOrders = orders?.length || 0;
      const todayRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total - (o.admin_fee || 500)), 0) || 0;

      setStats({
        todayOrders,
        todayRevenue,
        totalProducts,
        lowStockProducts,
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useRefetchOnFocus(fetchStats, { enabled: !!user });

  useEffect(() => {
    fetchStats();
  }, [fetchStats, authVersion]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-20 md:pb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary">Dashboard Toko</h1>
          <p className="text-sm text-content-secondary mt-1">Ringkasan performa tokomu hari ini.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-primary-500">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-500">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-xs text-content-secondary font-medium">Pesanan Hari Ini</p>
              <h3 className="text-2xl font-bold text-content-primary">{stats.todayOrders}</h3>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-green-500">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-content-secondary font-medium">Pendapatan Hari Ini</p>
              <h3 className="text-xl font-bold text-content-primary truncate max-w-[120px]" title={formatRupiah(stats.todayRevenue)}>
                {formatRupiah(stats.todayRevenue)}
              </h3>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs text-content-secondary font-medium">Total Produk</p>
              <h3 className="text-2xl font-bold text-content-primary">{stats.totalProducts}</h3>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-orange-500">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs text-content-secondary font-medium">Stok Menipis</p>
              <h3 className="text-2xl font-bold text-content-primary">{stats.lowStockProducts}</h3>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
