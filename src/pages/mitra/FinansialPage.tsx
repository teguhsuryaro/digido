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
import Button from '@/components/ui/Button';
import { Wallet, Calendar, ChevronLeft, CreditCard, Building2, QrCode, ArrowRight } from 'lucide-react';
import WithdrawalModal from '@/components/mitra/WithdrawalModal';
import WithdrawalMethodModal from '@/components/mitra/WithdrawalMethodModal';
import { useNavigate } from 'react-router-dom';

type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function FinansialPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [umkm, setUmkm] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('weekly');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      // 1. Get UMKM owned by user
      const { data: umkmData } = await supabase
        .from('umkm')
        .select('id, name, withdrawal_method, withdrawal_provider, withdrawal_account')
        .eq('owner_id', user.id)
        .maybeSingle();
      
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

      // 3. Get Withdrawals
      const { data: withdrawalData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('umkm_id', (umkmData as any).id)
        .order('created_at', { ascending: false });
      
      setWithdrawals(withdrawalData || []);

    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Global All-Time Stats
  const globalStats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total - (o.admin_fee || 500)), 0);
    const totalWithdrawn = withdrawals.filter(w => w.status !== 'failed').reduce((sum, w) => sum + w.amount + (w.admin_fee || 0), 0);
    const balance = totalRevenue - totalWithdrawn;
    
    return { totalRevenue, totalWithdrawn, balance };
  }, [orders, withdrawals]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const orderDate = new Date(o.created_at);
      if (periodFilter === 'daily') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(); 
        weekAgo.setDate(now.getDate() - 7);
        return orderDate >= weekAgo;
      }
      if (periodFilter === 'monthly') {
        const monthAgo = new Date(); 
        monthAgo.setDate(now.getDate() - 30);
        return orderDate >= monthAgo;
      }
      if (periodFilter === 'yearly') {
        const yearAgo = new Date(); 
        yearAgo.setFullYear(now.getFullYear() - 1);
        return orderDate >= yearAgo;
      }
      return true;
    });
  }, [orders, periodFilter]);

  const filteredStats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total - (o.admin_fee || 500)), 0);
    const orderCount = filteredOrders.length;
    const avgValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    
    return { totalRevenue, orderCount, avgValue };
  }, [filteredOrders]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    if (periodFilter === 'daily') {
      const todayTotal = filteredOrders.reduce((sum, o) => sum + (o.total - (o.admin_fee || 500)), 0);
      return [{ date: 'Hari Ini', revenue: todayTotal }];
    }
    
    if (periodFilter === 'weekly' || periodFilter === 'monthly') {
      const days = periodFilter === 'weekly' ? 7 : 30;
      const lastDays = [...Array(days)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      return lastDays.map(date => {
        const dayTotal = orders
          .filter(o => o.created_at.split('T')[0] === date)
          .reduce((sum, o) => sum + (o.total - (o.admin_fee || 500)), 0);
        
        return {
          date: formatDate(date).split(',')[0],
          revenue: dayTotal
        };
      });
    }

    if (periodFilter === 'yearly') {
      const months = [...Array(12)].map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleString('id-ID', { month: 'short' }) };
      }).reverse();

      return months.map(m => {
        const monthTotal = orders
          .filter(o => {
            const d = new Date(o.created_at);
            return d.getMonth() === m.month && d.getFullYear() === m.year;
          })
          .reduce((sum, o) => sum + (o.total - (o.admin_fee || 500)), 0);
        
        return {
          date: m.label,
          revenue: monthTotal
        };
      });
    }
    
    return [];
  }, [orders, periodFilter, filteredOrders]);

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
        <div className="flex flex-col gap-4">
          <button onClick={() => navigate('/mitra/pengaturan')} className="flex items-center gap-2 text-content-secondary hover:text-content-primary font-medium w-fit transition-colors">
            <ChevronLeft size={20} />
            Kembali ke Pengaturan
          </button>
          <div>
            <h1 className="text-2xl font-black text-content-primary">Keuangan Toko</h1>
            <p className="text-sm text-content-secondary mt-1">Kelola pendapatan dan penarikan dana.</p>
          </div>
        </div>

        {/* Global Wallet Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 col-span-1 md:col-span-2 border-none bg-primary-500 text-white shadow-lg shadow-primary-500/20 relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs uppercase font-bold opacity-80 mb-1 flex items-center gap-1"><Wallet size={14} /> Saldo di DigiDO</p>
                <h2 className="text-4xl font-black">{formatRupiah(globalStats.balance)}</h2>
                <p className="text-sm mt-2 opacity-90">Total Pendapatan: <span className="font-bold">{formatRupiah(globalStats.totalRevenue)}</span></p>
              </div>
              <Button 
                variant="outline" 
                className="bg-white text-primary-500 hover:bg-surface-secondary border-none shadow-md whitespace-nowrap"
                onClick={() => setIsWithdrawModalOpen(true)}
              >
                Cairkan Dana
              </Button>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-10 -top-10 text-white/10">
              <Wallet size={150} />
            </div>
          </Card>
          
          <div className="flex flex-col gap-4">
            <Card className="p-6 bg-surface-card border-border flex flex-col justify-center relative overflow-hidden flex-1">
              <p className="text-[10px] uppercase font-bold text-content-placeholder mb-1">Total Dana Ditarik</p>
              <h2 className="text-2xl font-black text-content-primary">{formatRupiah(globalStats.totalWithdrawn)}</h2>
            </Card>

            <Card className="p-4 bg-surface-card border-border flex-1 flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-content-placeholder mb-2">Metode Pencairan</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                    {umkm.withdrawal_method === 'qris' ? <QrCode size={16} /> : umkm.withdrawal_method === 'bank' ? <Building2 size={16} /> : <CreditCard size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-content-primary capitalize">
                      {umkm.withdrawal_provider || 'Belum Diatur'}
                    </p>
                    {umkm.withdrawal_method !== 'qris' && umkm.withdrawal_account && (
                      <p className="text-xs text-content-secondary font-mono">{umkm.withdrawal_account}</p>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsMethodModalOpen(true)}
                className="mt-3 text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1 w-fit"
              >
                Ubah Metode <ArrowRight size={12} />
              </button>
            </Card>
          </div>
        </div>

        <hr className="border-border" />

        {/* Period Filter Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
              <Calendar size={20} className="text-primary-500" />
              Statistik Pendapatan
            </h2>
            
            <div className="flex bg-surface-secondary p-1 rounded-xl">
              {[
                { id: 'daily', label: 'Hari Ini' },
                { id: 'weekly', label: '7 Hari' },
                { id: 'monthly', label: '30 Hari' },
                { id: 'yearly', label: '1 Tahun' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPeriodFilter(f.id as PeriodFilter)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    periodFilter === f.id 
                      ? 'bg-surface-primary text-primary-500 shadow-sm' 
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-surface-card border-border">
              <p className="text-[10px] uppercase font-bold text-content-placeholder">Pendapatan Periode</p>
              <h2 className="text-2xl font-black text-content-primary mt-1">{formatRupiah(filteredStats.totalRevenue)}</h2>
            </Card>
            <Card className="p-4 bg-surface-card border-border">
              <p className="text-[10px] uppercase font-bold text-content-placeholder">Pesanan Selesai</p>
              <h2 className="text-2xl font-black text-content-primary mt-1">{filteredStats.orderCount}</h2>
            </Card>
            <Card className="p-4 bg-surface-card border-border">
              <p className="text-[10px] uppercase font-bold text-content-placeholder">Rata-rata Order</p>
              <h2 className="text-2xl font-black text-content-primary mt-1">{formatRupiah(filteredStats.avgValue)}</h2>
            </Card>
          </div>

          {/* Chart Section */}
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

        {/* Recent Transactions & Withdrawals Table */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden border-border flex flex-col">
            <div className="p-4 border-b border-border bg-surface-secondary">
              <h2 className="font-bold text-content-primary">Riwayat Pesanan</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-secondary text-content-placeholder font-bold uppercase text-[10px] tracking-widest border-b border-border">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-right">Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="hover:bg-surface-secondary transition-colors">
                        <td className="px-4 py-3 text-content-secondary">{formatDate(order.created_at).split(',')[0]}</td>
                        <td className="px-4 py-3 text-right font-black text-primary-500">{formatRupiah(order.total - (order.admin_fee || 500))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-content-placeholder italic">
                        Belum ada pesanan selesai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden border-border flex flex-col">
            <div className="p-4 border-b border-border bg-surface-secondary">
              <h2 className="font-bold text-content-primary">Riwayat Penarikan Dana</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-secondary text-content-placeholder font-bold uppercase text-[10px] tracking-widest border-b border-border">
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Tujuan</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">Admin</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {withdrawals.length > 0 ? (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-surface-secondary transition-colors">
                        <td className="px-4 py-3 text-content-secondary whitespace-nowrap">{formatDate(w.created_at).split(',')[0]}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="font-bold text-content-primary capitalize">{w.provider || '-'}</p>
                          {w.destination && <p className="text-[10px] text-content-secondary font-mono">{w.destination}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-black text-primary-500">{formatRupiah(w.amount)}</p>
                          <p className="text-[10px] text-content-secondary sm:hidden">Admin: {formatRupiah(w.admin_fee || 0)}</p>
                          <p className="text-[10px] text-content-secondary sm:hidden font-mono mt-0.5 capitalize">
                            {w.provider || '-'}{w.destination ? ` - ${w.destination}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell text-content-secondary font-medium">
                          {formatRupiah(w.admin_fee || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                            w.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                            w.status === 'pending' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                            'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                          }`}>
                            {w.status === 'completed' ? 'Selesai' : w.status === 'pending' ? 'Selesai' : 'Gagal'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-content-placeholder italic">
                        Belum ada riwayat penarikan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>

      <WithdrawalModal 
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        umkmId={umkm.id}
        maxBalance={globalStats.balance}
        onSuccess={fetchData}
        umkm={umkm}
      />

      <WithdrawalMethodModal 
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        umkm={umkm}
        onSuccess={fetchData}
      />
    </PageTransition>
  );
}
