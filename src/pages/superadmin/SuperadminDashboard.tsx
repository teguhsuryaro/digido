import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Store, AlertTriangle, CheckCircle, Banknote } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/utils/format';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMitra: 0,
    openReports: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'pelanggan');

        const { count: totalMitra } = await supabase
          .from('umkm')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        const { count: openReports } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .in('status', ['open', 'reviewed']);

        // 1. Revenue dari transaksi
        const { data: completedData, count: completedOrders } = await supabase
          .from('orders')
          .select('admin_fee', { count: 'exact' })
          .eq('status', 'completed');
          
        const ordersRevenue = ((completedData as any[]) || []).reduce((sum, order) => {
          // Fallback ke 500 jika admin_fee null/0 untuk sinkron dengan RevenuePage
          return sum + ((order.admin_fee && order.admin_fee > 0) ? order.admin_fee : 500);
        }, 0);

        // 2. Revenue dari penarikan dana
        const { data: withdrawalsData } = await supabase
          .from('withdrawals')
          .select('admin_fee')
          .eq('status', 'completed');
          
        const wdRevenue = ((withdrawalsData as any[]) || []).reduce((sum, wd) => {
          return sum + (wd.admin_fee || 0);
        }, 0);

        // 3. Revenue dari pembelian paket
        const { data: subsData } = await supabase
          .from('subscriptions')
          .select('subscription_plans(price)')
          .neq('status', 'failed');
          
        const subsRevenue = ((subsData as any[]) || []).reduce((sum, sub) => {
          return sum + (sub.subscription_plans?.price || 0);
        }, 0);

        const totalRevenue = ordersRevenue + wdRevenue + subsRevenue;

        setStats({
          totalUsers: totalUsers || 0,
          totalMitra: totalMitra || 0,
          openReports: openReports || 0,
          completedOrders: completedOrders || 0,
          totalRevenue: totalRevenue,
        });
      } catch (err) {
        console.error('Error fetching superadmin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();

    const channel = supabase.channel('superadmin_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-content-primary">Dashboard Utama</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-card" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 flex flex-col gap-2 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-content-secondary">Total Pelanggan</p>
              <Users size={20} className="text-blue-500" />
            </div>
            <p className="text-3xl font-extrabold text-content-primary">{stats.totalUsers}</p>
          </Card>
          <Card className="p-6 flex flex-col gap-2 border-l-4 border-l-green-500">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-content-secondary">Mitra Aktif</p>
              <Store size={20} className="text-green-500" />
            </div>
            <p className="text-3xl font-extrabold text-content-primary">{stats.totalMitra}</p>
          </Card>
          <Card className="p-6 flex flex-col gap-2 border-l-4 border-l-red-500">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-content-secondary">Laporan Belum Selesai</p>
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <p className="text-3xl font-extrabold text-red-500">{stats.openReports}</p>
          </Card>
          <Card className="p-6 flex flex-col gap-2 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-content-secondary">Transaksi Selesai</p>
              <CheckCircle size={20} className="text-purple-500" />
            </div>
            <p className="text-3xl font-extrabold text-content-primary">{stats.completedOrders}</p>
          </Card>
          <Card 
            className="p-6 flex flex-col gap-2 border-l-4 border-l-yellow-500 cursor-pointer hover:bg-surface-secondary transition-colors"
            onClick={() => navigate('/superadmin/pendapatan')}
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-content-secondary">Pendapatan Platform</p>
              <Banknote size={20} className="text-yellow-500" />
            </div>
            <p className="text-2xl font-extrabold text-yellow-500">{formatRupiah(stats.totalRevenue)}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
