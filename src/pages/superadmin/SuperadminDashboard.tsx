import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Store, AlertTriangle, CheckCircle, Banknote } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/utils/format';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';

export default function SuperadminDashboard() {
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

        const { data: completedData, count: completedOrders } = await supabase
          .from('orders')
          .select('admin_fee', { count: 'exact' })
          .eq('status', 'completed');
          
        const totalRevenue = (completedData || []).reduce((sum, order) => {
          // Fallback to 0 if admin_fee is null/undefined
          return sum + (order.admin_fee || 0);
        }, 0);

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
          <Card className="p-6 flex flex-col gap-2 border-l-4 border-l-yellow-500">
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
