import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRupiah, formatDate } from '@/utils/format';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

export default function FinansialPage() {
  const user = useAuthStore((s) => s.user);
  const [umkm, setUmkm] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // 1. Get UMKM owned by user
        const { data: umkmData } = await supabase
          .from('umkm')
          .select('id, name')
          .eq('owner_id', user.id)
          .single();
        
        if (!umkmData) return;
        setUmkm(umkmData as any);

        // 2. Get Completed Orders
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, customer:profiles(full_name)')
          .eq('umkm_id', (umkmData as any).id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        setOrders(orderData || []);
      } catch (err) {
        console.error('Error fetching financial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const orderCount = orders.length;
    const avgValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    
    return {
      totalRevenue,
      orderCount,
      avgValue
    };
  }, [orders]);

  // Chart Data Preparation (last 7 days)
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTotal = orders
        .filter(o => o.created_at.split('T')[0] === date)
        .reduce((sum, o) => sum + o.total, 0);
      
      return {
        date: formatDate(date).split(',')[0], // "13 Mei"
        revenue: dayTotal
      };
    });
  }, [orders]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  }

  if (!umkm) {
    return (
      <div className="py-20 text-center">
        <p className="text-content-placeholder">Data toko tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-20 md:pb-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-content-primary">Laporan Finansial</h1>
            <span className="px-3 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary-500/20">
              Prototype Mode
            </span>
          </div>
          <p className="text-sm text-content-secondary mt-1">
            Pantau pertumbuhan pendapatan toko <span className="font-bold">{umkm.name}</span>.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-none bg-primary-500 text-white shadow-lg shadow-primary-500/20">
            <p className="text-[10px] uppercase font-bold opacity-80">Total Pendapatan</p>
            <h2 className="text-2xl font-black mt-1">{formatRupiah(stats.totalRevenue)}</h2>
          </Card>
          <Card className="p-4 bg-surface-card border-border">
            <p className="text-[10px] uppercase font-bold text-content-placeholder">Pesanan Selesai</p>
            <h2 className="text-2xl font-black text-content-primary mt-1">{stats.orderCount}</h2>
          </Card>
          <Card className="p-4 bg-surface-card border-border">
            <p className="text-[10px] uppercase font-bold text-content-placeholder">Rata-rata Order</p>
            <h2 className="text-2xl font-black text-content-primary mt-1">{formatRupiah(stats.avgValue)}</h2>
          </Card>
        </div>

        {/* Chart Section */}
        <section>
          <h2 className="text-lg font-bold text-content-primary mb-4">Grafik Pendapatan (7 Hari Terakhir)</h2>
          <Card className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border opacity-50" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickFormatter={(val) => `Rp ${val / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--color-surface-card, #ffffff)',
                    color: 'var(--color-content-primary, #0f172a)'
                  }}
                  formatter={(value: any) => [formatRupiah(value), 'Pendapatan']}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? '#3B82F6' : 'var(--color-border, #E2E8F0)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* Recent Transactions Table */}
        <section>
          <h2 className="text-lg font-bold text-content-primary mb-4">Riwayat Pesanan Selesai</h2>
          <Card className="overflow-hidden border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-secondary text-content-placeholder font-bold uppercase text-[10px] tracking-widest border-b border-border">
                    <th className="px-4 py-4">Tanggal</th>
                    <th className="px-4 py-4">Pelanggan</th>
                    <th className="px-4 py-4 text-right">Total</th>
                    <th className="px-4 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface-secondary transition-colors">
                        <td className="px-4 py-4 text-content-secondary">{formatDate(order.created_at).split(',')[0]}</td>
                        <td className="px-4 py-4 font-bold text-content-primary">{(order.customer as any)?.full_name}</td>
                        <td className="px-4 py-4 text-right font-black text-primary-500">{formatRupiah(order.total)}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase rounded-full">
                            Selesai
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-content-placeholder italic">
                        Belum ada pesanan yang selesai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>
    </PageTransition>
  );
}
