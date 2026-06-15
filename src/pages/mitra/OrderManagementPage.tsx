import { useState, useEffect } from 'react';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRupiah, formatDate } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import { Bell } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import StarRating from '@/components/StarRating';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'delivering' | 'completed' | 'cancelled' | 'rejected';

const TABS = [
  { label: 'Baru', statuses: ['pending'] },
  { label: 'Diproses', statuses: ['confirmed', 'processing'] },
  { label: 'Siap Kirim', statuses: ['delivering'] },
  { label: 'Selesai', statuses: ['completed'] },
  { label: 'Batal/Ditolak', statuses: ['cancelled', 'rejected'] },
];

export default function OrderManagementPage() {
  const user = useAuthStore((s) => s.user);
  const authVersion = useAuthStore((s) => s.authVersion);
  const [umkm, setUmkm] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // State ulasan
  const [orderReview, setOrderReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Fetch review saat order dipilih
  const fetchOrderReview = async (orderId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        profiles:customer_id(full_name),
        review_photos(photo_url, sort_order),
        review_replies(id, reply, created_at)
      `)
      .eq('order_id', orderId)
      .maybeSingle();

    setOrderReview(data);
  };

  const fetchData = async () => {
    try {
      if (!user) return;
      
      // 1. Get UMKM
      const { data: umkmData } = await supabase
        .from('umkm')
        .select('id, name')
        .eq('owner_id', user.id)
        .maybeSingle();
      
        if (!umkmData) return;
        setUmkm(umkmData as any);

        // 2. Get Orders with relations
        const { data: orderData, error } = await supabase
          .from('orders')
          .select('*, customer:profiles(full_name), items:order_items(*)')
          .eq('umkm_id', (umkmData as any).id)
          .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(orderData || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useRefetchOnFocus(fetchData, { enabled: !!user });

  useEffect(() => {
    fetchData();
  }, [user?.id, authVersion]);

  useEffect(() => {
    // Subscribe to real-time order updates
    if (!umkm?.id) return;

    const channel = supabase
      .channel(`mitra-orders-${umkm.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `umkm_id=eq.${umkm.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success('Ada pesanan baru masuk! 🔔');
            fetchData();
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [umkm?.id, authVersion]);

  const handleReplyReview = async () => {
    if (!orderReview || !user) return;
    if (!replyText.trim()) {
      toast.warning('Tulis balasan terlebih dahulu.');
      return;
    }
    if (replyText.length > 500) {
      toast.warning('Balasan maksimal 500 karakter.');
      return;
    }

    setIsReplying(true);
    try {
      const { error } = await supabase
        .from('review_replies')
        .insert({
          review_id: orderReview.id,
          mitra_id: user.id,
          reply: replyText.trim(),
        } as any);

      if (error) {
        if (error.code === '23505') {
          // UNIQUE constraint violation
          toast.warning('Anda sudah membalas ulasan ini sebelumnya.');
        } else {
          throw error;
        }
      } else {
        toast.success('Balasan berhasil dikirim!');
        setReplyText('');
        // Refresh review data
        if (expandedOrder) fetchOrderReview(expandedOrder);
      }
    } catch (err) {
      toast.error('Gagal mengirim balasan.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus } as any)
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success(`Status pesanan berhasil diupdate ke ${newStatus}.`);
      fetchData(); // Refresh to ensure data sync
    } catch (err) {
      toast.error('Gagal mengupdate status pesanan.');
    }
  };

  const filteredOrders = orders.filter(o => TABS[activeTab].statuses.includes(o.status));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="flex gap-2 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-card" />)}
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-content-primary">Manajemen Pesanan</h1>
            <p className="text-sm text-content-secondary mt-1">
              Pantau dan proses pesanan pelanggan Toko <span className="font-bold">{umkm?.name}</span>.
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-content-secondary shrink-0">
            <Bell size={20} />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {TABS.map((tab, idx) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className={`
                px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap border transition-all
                ${activeTab === idx 
                  ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20' 
                  : 'bg-surface-card text-content-placeholder border-border hover:border-primary-500/50'}
              `}
            >
              {tab.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === idx ? 'bg-white/20 text-white' : 'bg-surface-secondary text-content-placeholder'}`}>
                {orders.filter(o => tab.statuses.includes(o.status)).length}
              </span>
            </button>
          ))}
        </div>

        {/* Order List Grid */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden border-border transition-all hover:shadow-lg">
                {/* Header Card */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    const isExpanding = expandedOrder !== order.id;
                    setExpandedOrder(isExpanding ? order.id : null);
                    if (isExpanding && order.status === 'completed') {
                      fetchOrderReview(order.id);
                    } else {
                      setOrderReview(null);
                      setReplyText('');
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black text-content-placeholder uppercase tracking-tighter">#{order.id.slice(0, 8)}</p>
                    <Badge variant={
                      order.status === 'pending' ? 'warning' :
                      ['confirmed', 'processing', 'delivering'].includes(order.status) ? 'info' :
                      order.status === 'completed' ? 'success' : 'error'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end gap-2">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-bold text-content-primary line-clamp-1">{order.customer?.full_name}</h3>
                      <p className="text-[10px] text-content-secondary mt-1">{formatDate(order.created_at)}</p>
                    </div>
                    <p className="font-black text-primary-500 whitespace-nowrap shrink-0">{formatRupiah(order.total)}</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="p-4 border-t border-border bg-surface-secondary/50 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-4">
                      {/* Items */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-content-placeholder">Item Pesanan</p>
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm gap-2">
                            <span className="text-content-secondary line-clamp-2 flex-1">
                              <span className="font-bold whitespace-nowrap">{item.quantity}x</span> {item.product_name}
                            </span>
                            <span className="font-medium text-content-primary whitespace-nowrap shrink-0">
                              {formatRupiah(item.product_price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-content-placeholder">Alamat</p>
                          <p className="text-xs text-content-secondary mt-1">{order.delivery_address || 'Ambil di Tempat'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-content-placeholder">Catatan</p>
                          <p className="text-xs text-content-secondary mt-1 italic">{order.notes || '-'}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        {order.status === 'pending' && (
                          <>
                            <Button 
                              variant="primary" 
                              fullWidth 
                              size="sm" 
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                            >
                              Terima Pesanan
                            </Button>
                            <Button 
                              variant="danger" 
                              fullWidth 
                              size="sm" 
                              onClick={() => handleUpdateStatus(order.id, 'rejected')}
                            >
                              Tolak
                            </Button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <Button 
                            variant="primary" 
                            fullWidth 
                            size="sm" 
                            onClick={() => handleUpdateStatus(order.id, 'processing')}
                          >
                            Mulai Proses
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button 
                            variant="primary" 
                            fullWidth 
                            size="sm" 
                            onClick={() => handleUpdateStatus(order.id, 'delivering')}
                          >
                            Siap Kirim
                          </Button>
                        )}
                        {['delivering', 'completed', 'cancelled', 'rejected'].includes(order.status) && (
                          <p className="text-[10px] text-center w-full text-content-placeholder font-medium py-2 bg-surface-card rounded border border-border/50">
                            Pesanan sedang dalam status akhir atau pengiriman.
                          </p>
                        )}
                      </div>

                      {/* Section Ulasan Pelanggan (hanya untuk pesanan completed) */}
                      {order.status === 'completed' && orderReview && (
                        <Card className="p-4 space-y-4 mt-6 border-2 border-yellow-500/20 bg-yellow-500/5">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-content-placeholder">
                            Ulasan Pelanggan
                          </h3>

                          {/* Rating & Komentar */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <StarRating rating={orderReview.rating} readonly size="sm" />
                              <span className="text-sm font-bold text-content-primary">{orderReview.rating.toFixed(1)}</span>
                            </div>
                            {orderReview.comment && (
                              <p className="text-sm text-content-secondary italic">"{orderReview.comment}"</p>
                            )}
                          </div>

                          {/* Foto Ulasan */}
                          {orderReview.review_photos?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {orderReview.review_photos
                                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                                .map((photo: any, i: number) => (
                                  <div key={i} className="w-16 h-16 rounded-card overflow-hidden border border-border">
                                    <img src={photo.photo_url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                            </div>
                          )}

                          {/* Balasan Existing */}
                          {orderReview.review_replies?.length > 0 ? (
                            <div className="ml-4 pl-4 border-l-2 border-primary-500/30 bg-primary-500/5 rounded-r-card p-3">
                              <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Balasan Anda</p>
                              <p className="text-sm text-content-secondary mt-1">{orderReview.review_replies[0].reply}</p>
                              <p className="text-[10px] text-content-placeholder mt-1">
                                {new Date(orderReview.review_replies[0].created_at).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          ) : (
                            /* Form Balas */
                            <div className="space-y-3 pt-3 border-t border-border">
                              <p className="text-xs font-bold text-content-secondary">Balas ulasan ini:</p>
                              <textarea
                                value={replyText}
                                onChange={(e) => {
                                  if (e.target.value.length <= 500) setReplyText(e.target.value);
                                }}
                                placeholder="Tulis balasan untuk pelanggan..."
                                className="w-full p-3 rounded-card bg-surface-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[80px]"
                              />
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] text-content-placeholder">{replyText.length}/500</p>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={handleReplyReview}
                                  isLoading={isReplying}
                                  disabled={!replyText.trim()}
                                >
                                  Kirim Balasan
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      )}

                      {/* Belum ada review */}
                      {order.status === 'completed' && !orderReview && (
                        <div className="mt-6 py-6 text-center bg-surface-secondary rounded-card border border-dashed border-border">
                          <p className="text-xs text-content-placeholder">Pelanggan belum memberikan ulasan untuk pesanan ini.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-surface-secondary rounded-card border border-dashed border-border">
            <p className="text-content-placeholder font-medium">Tidak ada pesanan di kategori ini.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
