import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Camera, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/supabase-helpers';
import { formatRupiah, formatDate } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StarRating from '@/components/StarRating';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'delivering' | 'completed' | 'cancelled' | 'rejected';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [review, setReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Review State
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});  // { itemId: rating }
  const [comment, setComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const reviewPhotoInputRef = useRef<HTMLInputElement>(null);
  const [reviewPhotos_existing, setReviewPhotos_existing] = useState<string[]>([]);

  const fetchData = async () => {
    if (!id) return;
    
    try {
      // 1. Order + UMKM Info
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*, umkm(name)')
        .eq('id', id)
        .maybeSingle();
      
      if (orderErr) throw orderErr;
      if (!orderData) throw new Error('Order not found');
      setOrder(orderData);

      // 2. Items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);
      setItems(itemsData || []);

      // 3. Existing Review
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('order_id', id)
        .maybeSingle();
      
      if (reviewData) {
        setReview(reviewData);
        // Fetch review photos
        const { data: photos } = await supabase
          .from('review_photos')
          .select('photo_url')
          .eq('review_id', (reviewData as any).id)
          .order('sort_order');
        setReviewPhotos_existing((photos || []).map((p: any) => p.photo_url));
      } else {
        setReview(null);
      }

    } catch (err) {
      console.error('Error fetching order detail:', err);
      toast.error('Gagal memuat detail pesanan.');
      navigate('/pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel(`order-detail-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleConfirmReceived = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' } as any)
        .eq('id', id);

      if (error) throw error;
      toast.success('Pesanan telah selesai! Terima kasih sudah belanja.');
      fetchData();
    } catch (err) {
      toast.error('Gagal mengonfirmasi pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files);

    // Validasi total foto
    if (reviewPhotos.length + newPhotos.length > 3) {
      toast.warning('Maksimal 3 foto per ulasan.');
      return;
    }

    // Validasi ukuran per file
    for (const file of newPhotos) {
      if (file.size > 2 * 1024 * 1024) {
        toast.warning(`File "${file.name}" terlalu besar. Maksimal 2MB per foto.`);
        return;
      }
    }

    setReviewPhotos(prev => [...prev, ...newPhotos]);
    // Reset input agar bisa upload file yang sama lagi
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    // Validasi: minimal 1 produk harus diberi rating
    const ratedItems = Object.entries(itemRatings).filter(([_, r]) => r > 0);
    if (ratedItems.length === 0) {
      toast.warning('Berikan rating bintang minimal untuk satu produk.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update rating di setiap order_item yang diberi bintang
      const updatePromises = ratedItems.map(([itemId, itemRating]) =>
        supabase
          .from('order_items')
          .update({ rating: itemRating } as any)
          .eq('id', itemId)
      );
      await Promise.all(updatePromises);

      // 2. Hitung rata-rata rating
      const avgRating = ratedItems.reduce((sum, [_, r]) => sum + r, 0) / ratedItems.length;
      const roundedRating = Math.round(avgRating * 10) / 10; // 1 desimal

      // 3. Insert review dengan rata-rata rating
      const { data: reviewResult, error } = await supabase
        .from('reviews')
        .insert({
          order_id: id,
          customer_id: order.customer_id,
          umkm_id: order.umkm_id,
          rating: roundedRating,
          comment: comment.trim() || null,
        } as any)
        .select('id')
        .maybeSingle();

      if (error) throw error;

      // 4. Upload foto ulasan (BARU)
      if (reviewPhotos.length > 0 && reviewResult) {
        const photoUploadPromises = reviewPhotos.map(async (photo, index) => {
          const url = await uploadFile(
            'review-photos',
            `${order.umkm_id}/${(reviewResult as any).id}/photo-${index + 1}-${Date.now()}`,
            photo
          );
          if (url) {
            await supabase.from('review_photos').insert({
              review_id: (reviewResult as any).id,
              photo_url: url,
              sort_order: index + 1,
            } as any);
          }
        });
        await Promise.all(photoUploadPromises);
      }

      toast.success('Ulasan berhasil dikirim!');
      fetchData();
    } catch (err) {
      toast.error('Gagal mengirim ulasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!order) return null;

  // Timeline Logic
  const steps: { status: OrderStatus; label: string }[] = [
    { status: 'pending', label: 'Masuk' },
    { status: 'confirmed', label: 'Dikonfirmasi' },
    { status: 'delivering', label: 'Dikirim' },
    { status: 'completed', label: 'Selesai' },
  ];

  const currentStatusIndex = steps.findIndex(s => s.status === order.status);
  const activeIndex = order.status === 'processing' ? 1 : currentStatusIndex;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-8 pb-20 md:pb-8">
        {/* Header */}
        <section>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-content-primary">{order.umkm.name}</h1>
              <p className="text-xs text-content-placeholder mt-1 uppercase tracking-widest font-medium">
                ID: {order.id.slice(0, 8)} • {formatDate(order.created_at)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              ['cancelled', 'rejected'].includes(order.status) 
                ? 'bg-red-100 text-red-700' 
                : 'bg-primary-100 text-primary-700'
            }`}>
              {order.status}
            </span>
          </div>
        </section>

        {/* Timeline Status */}
        {!['cancelled', 'rejected'].includes(order.status) && (
          <section className="bg-surface-secondary p-6 rounded-card border border-border">
            <h2 className="text-sm font-bold text-content-secondary mb-8 text-center uppercase tracking-widest">
              Status Pengiriman
            </h2>
            <div className="relative flex justify-between items-center px-4">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0 mx-8" />
              
              {steps.map((step, idx) => {
                const isCompleted = idx <= activeIndex;
                const isCurrent = idx === activeIndex;

                return (
                  <div key={step.status} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                      ${isCompleted 
                        ? 'bg-primary-500 border-primary-500 text-white' 
                        : 'bg-surface-card border-border text-content-placeholder'}
                      ${isCurrent ? 'ring-4 ring-primary-500/20 scale-110' : ''}
                    `}>
                      {isCompleted ? <Check size={14} /> : idx + 1}
                    </div>
                    <span className={`text-[10px] font-bold uppercase ${isCompleted ? 'text-primary-500' : 'text-content-placeholder'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Action Button: Konfirmasi Penerimaan */}
        {order.status === 'delivering' && (
          <Button 
            variant="primary" 
            fullWidth 
            size="lg" 
            className="animate-pulse shadow-lg shadow-primary-500/30"
            onClick={handleConfirmReceived}
            isLoading={isSubmitting}
          >
            Konfirmasi Pesanan Diterima
          </Button>
        )}

        {/* Review Form / Existing Review */}
        {order.status === 'completed' && (
          <Card className="p-6 border-2 border-primary-500/20 bg-primary-500/5">
            <h2 className="text-lg font-bold text-content-primary mb-4">Ulasan Anda</h2>
            
            {review ? (
              <div className="space-y-4">
                <StarRating rating={review.rating} readonly />
                {review.comment && (
                  <p className="text-sm text-content-secondary italic">"{review.comment}"</p>
                )}
                <p className="text-[10px] text-content-placeholder">Dikirim pada {formatDate(review.created_at)}</p>

                {/* Foto Ulasan */}
                {reviewPhotos_existing.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {reviewPhotos_existing.map((url, i) => (
                      <div key={i} className="w-20 h-20 rounded-card overflow-hidden border border-border">
                        <img src={url} alt={`Foto ulasan ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Tampilkan rating per produk (dari order_items) */}
                <div className="space-y-2 mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-bold text-content-placeholder uppercase">Rating per Produk:</p>
                  {items.filter((item: any) => item.rating).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-content-secondary">{item.product_name}</span>
                      <StarRating rating={item.rating} readonly size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Rating Per Produk */}
                <div className="space-y-4">
                  <p className="text-sm font-bold text-content-primary">Rating per Produk:</p>
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-3 bg-surface-secondary rounded-card">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-content-primary truncate">{item.product_name}</p>
                        <p className="text-xs text-content-secondary">{item.quantity}x @ {formatRupiah(item.product_price)}</p>
                      </div>
                      <div className="shrink-0">
                        <StarRating
                          rating={itemRatings[item.id] || 0}
                          onRatingChange={(r) => setItemRatings(prev => ({ ...prev, [item.id]: r }))}
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rata-rata Rating */}
                {Object.values(itemRatings).some(r => r > 0) && (
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-card border border-yellow-100 dark:border-yellow-900/30">
                    <p className="text-xs text-content-secondary">Rating Keseluruhan Pesanan</p>
                    <p className="text-2xl font-extrabold text-yellow-600 dark:text-yellow-400">
                      {(Object.values(itemRatings).filter(r => r > 0).reduce((a, b) => a + b, 0) /
                        Object.values(itemRatings).filter(r => r > 0).length).toFixed(1)}
                    </p>
                    <p className="text-[10px] text-content-placeholder">(rata-rata dari {Object.values(itemRatings).filter(r => r > 0).length} produk yang diberi rating)</p>
                  </div>
                )}

                {/* Komentar — hanya bisa diisi jika sudah ada rating */}
                <div className="space-y-2">
                  <p className="text-sm text-content-secondary">
                    Ceritakan pengalaman Anda: <span className="text-[10px] text-content-placeholder">(opsional, maks 500 karakter)</span>
                  </p>
                  <textarea
                    value={comment}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) setComment(e.target.value);
                    }}
                    placeholder={Object.values(itemRatings).some(r => r > 0) ? 'Contoh: Makanannya enak, porsinya pas!' : 'Berikan rating bintang terlebih dahulu...'}
                    disabled={!Object.values(itemRatings).some(r => r > 0)}
                    className="w-full p-4 rounded-card bg-surface-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-[10px] text-content-placeholder text-right">{comment.length}/500</p>
                </div>

                {/* Upload Foto Ulasan */}
                <div className="space-y-2">
                  <p className="text-sm text-content-secondary">
                    Lampirkan foto: <span className="text-[10px] text-content-placeholder">(opsional, maks 3 foto, 2MB/foto)</span>
                  </p>

                  {/* Preview Foto */}
                  {reviewPhotos.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {reviewPhotos.map((photo, index) => (
                        <div key={index} className="relative w-20 h-20 rounded-card overflow-hidden border border-border group">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tombol Tambah Foto */}
                  {reviewPhotos.length < 3 && (
                    <button
                      type="button"
                      onClick={() => reviewPhotoInputRef.current?.click()}
                      disabled={!Object.values(itemRatings).some(r => r > 0)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary-500 border border-dashed border-primary-500/30 rounded-card hover:bg-primary-500/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera size={16} /> Tambah Foto ({reviewPhotos.length}/3)
                    </button>
                  )}

                  <input
                    type="file"
                    ref={reviewPhotoInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleAddPhoto}
                  />
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSubmitReview}
                  isLoading={isSubmitting}
                  disabled={!Object.values(itemRatings).some(r => r > 0)}
                >
                  Kirim Ulasan
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Desktop: 2-column layout for details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Detail Items */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-content-placeholder">Rincian Item</h2>
            <Card className="divide-y divide-border overflow-hidden">
              {items.map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-content-primary">{item.product_name}</p>
                    <p className="text-xs text-content-secondary">{item.quantity}x @ {formatRupiah(item.product_price)}</p>
                  </div>
                  <span className="font-medium text-content-primary">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
            </Card>
          </section>

          {/* Right Column: Ringkasan Pembayaran & Alamat */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-content-placeholder">Ringkasan Pembayaran</h2>
              <Card className="p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-content-secondary">Subtotal</span>
                  <span className="font-medium text-content-primary">{formatRupiah(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-secondary">Ongkos Kirim</span>
                  <span className="font-medium text-content-primary">{formatRupiah(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-secondary">Biaya Admin DigiDO</span>
                  <span className="font-medium text-content-primary">{formatRupiah(order.admin_fee || 500)}</span>
                </div>
                {order.wallet_deduction > 0 && (
                  <div className="flex justify-between text-green-600 font-bold dark:text-green-400">
                    <span>Potongan Dompet</span>
                    <span>-{formatRupiah(order.wallet_deduction)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-border/50 flex justify-between items-center">
                  <span className="font-bold text-content-primary text-base">Total</span>
                  <span className="font-extrabold text-primary-500 text-xl">{formatRupiah(order.total)}</span>
                </div>
              </Card>
            </section>

            {/* Delivery Address */}
            {order.delivery_address && (
              <section className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-content-placeholder">Alamat Pengiriman</h2>
                <Card className="p-4 bg-surface-secondary border-none">
                  <p className="text-sm text-content-secondary leading-relaxed">
                    {order.delivery_address}
                  </p>
                  {order.notes && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-[10px] font-bold text-content-placeholder uppercase">Catatan:</p>
                      <p className="text-xs text-content-secondary mt-1 italic">"{order.notes}"</p>
                    </div>
                  )}
                </Card>
              </section>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
