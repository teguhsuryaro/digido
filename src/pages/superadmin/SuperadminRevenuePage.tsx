import { useEffect, useState } from 'react';
import { Banknote, ArrowLeft, Filter, TrendingUp, Calendar, ArrowDownLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { formatRupiah, formatDate } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

interface RevenueItem {
  id: string;
  date: string;
  source: 'transaksi' | 'penarikan' | 'paket';
  description: string;
  amount: number;
}

export default function SuperadminRevenuePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'transaksi' | 'penarikan' | 'paket'>('all');
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      const items: RevenueItem[] = [];

      // 1. Ambil data Admin Fee dari Transaksi
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, admin_fee, order_id')
        .eq('status', 'completed');
      
      if (!ordersError && ordersData) {
        (ordersData as any[]).forEach(o => {
          if (o.admin_fee && o.admin_fee > 0) {
            items.push({
              id: `ord-${o.id}`,
              date: o.created_at,
              source: 'transaksi',
              description: `Admin Fee Transaksi #${o.order_id}`,
              amount: o.admin_fee,
            });
          }
        });
      }

      // 2. Ambil data Admin Fee dari Penarikan Dana
      const { data: withdrawalsData, error: wdError } = await supabase
        .from('withdrawals')
        .select('id, created_at, amount, status, admin_fee, method')
        .eq('status', 'completed');

      if (!wdError && withdrawalsData) {
        (withdrawalsData as any[]).forEach(w => {
          if (w.admin_fee && w.admin_fee > 0) {
            items.push({
              id: `wd-${w.id}`,
              date: w.created_at,
              source: 'penarikan',
              description: `Admin Fee Penarikan (${(w.method || '').toUpperCase()})`,
              amount: w.admin_fee,
            });
          }
        });
      }

      // 3. Ambil data Pembelian Paket (Subscriptions)
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('id, started_at, subscription_plans(name, price)')
        .neq('status', 'failed');

      if (!subsError && subsData) {
        (subsData as any[]).forEach(s => {
          const price = s.subscription_plans?.price || 0;
          if (price > 0) {
            items.push({
              id: `sub-${s.id}`,
              date: s.started_at,
              source: 'paket',
              description: `Pembelian Paket ${s.subscription_plans?.name}`,
              amount: price,
            });
          }
        });
      }

      // Urutkan dari yang terbaru
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRevenueItems(items);
    } catch (err) {
      toast.error('Gagal memuat data pendapatan.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Logic
  const filteredItems = revenueItems.filter(item => {
    // Kategori
    if (filter !== 'all' && item.source !== filter) return false;
    
    // Periode
    if (period !== 'all') {
      const itemDate = new Date(item.date);
      const now = new Date();
      if (period === 'today') {
        if (itemDate.toDateString() !== now.toDateString()) return false;
      } else if (period === 'week') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < lastWeek) return false;
      } else if (period === 'month') {
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (itemDate < lastMonth) return false;
      }
    }
    return true;
  });

  const totalRevenue = filteredItems.reduce((sum, item) => sum + item.amount, 0);

  const getSourceIcon = (source: string) => {
    if (source === 'transaksi') return <CheckCircle size={16} className="text-purple-500" />;
    if (source === 'penarikan') return <ArrowDownLeft size={16} className="text-blue-500" />;
    return <TrendingUp size={16} className="text-yellow-500" />;
  };

  const getSourceColor = (source: string) => {
    if (source === 'transaksi') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (source === 'penarikan') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/superadmin')}
          className="p-2 hover:bg-surface-secondary rounded-full transition-colors text-content-secondary"
        >
          <ArrowLeft size={24} />
        </button>
        <Banknote className="text-yellow-500" size={28} />
        <h1 className="text-2xl font-bold text-content-primary">Detail Pendapatan</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 col-span-1 md:col-span-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <p className="text-sm font-medium text-white/80 uppercase tracking-widest">Total Pendapatan (Filtered)</p>
          <p className="text-4xl sm:text-5xl font-black mt-2">{isLoading ? '...' : formatRupiah(totalRevenue)}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
          <Filter size={18} className="text-content-secondary shrink-0" />
          {['all', 'transaksi', 'penarikan', 'paket'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap capitalize transition-colors ${filter === f ? 'bg-primary-500 text-white' : 'bg-surface-secondary text-content-secondary hover:bg-surface-hover'}`}
            >
              {f === 'all' ? 'Semua Kategori' : f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
          <Calendar size={18} className="text-content-secondary shrink-0" />
          {[
            { id: 'all', label: 'Semua Waktu' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: '7 Hari' },
            { id: 'month', label: '30 Hari' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${period === p.id ? 'bg-content-primary text-surface-primary' : 'bg-surface-secondary text-content-secondary hover:bg-surface-hover'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-card" />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-content-secondary">
            <Banknote size={48} className="mx-auto mb-4 opacity-20" />
            <p>Belum ada riwayat pendapatan untuk filter ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredItems.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-surface-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getSourceColor(item.source)}`}>
                    {getSourceIcon(item.source)}
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base text-content-primary">{item.description}</p>
                    <p className="text-xs text-content-secondary">{formatDate(item.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-500">+{formatRupiah(item.amount)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-content-placeholder capitalize">{item.source}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
