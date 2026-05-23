import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import StarRating from '@/components/StarRating';

interface ReviewEntry {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name: string;       // akan disamarkan
  order_items: Array<{ product_name: string; quantity: number }>;
  photos: string[];
  reply: { reply: string; created_at: string } | null;
}

// Fungsi untuk menyamarkan nama: "Jefri Nichol" → "J**** N*****"
function maskName(name: string): string {
  return name
    .split(' ')
    .map(word => {
      if (word.length <= 1) return word;
      return word[0] + '*'.repeat(word.length - 1);
    })
    .join(' ');
}

export default function UMKMReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [umkmName, setUmkmName] = useState('');
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      try {
        // 1. Fetch UMKM name
        const { data: umkm } = await supabase
          .from('umkm')
          .select('name')
          .eq('id', id)
          .single();
        if (umkm) setUmkmName((umkm as any).name);

        // 2. Fetch all reviews for this UMKM
        const { data: reviewsData, error } = await supabase
          .from('reviews')
          .select(`
            id, rating, comment, created_at,
            profiles:customer_id(full_name),
            orders:order_id(
              order_items(product_name, quantity)
            ),
            review_photos(photo_url, sort_order),
            review_replies(reply, created_at)
          `)
          .eq('umkm_id', id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const processed = ((reviewsData as any) || []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          customer_name: r.profiles?.full_name || 'Pelanggan',
          order_items: (r.orders?.order_items || []).map((item: any) => ({
            product_name: item.product_name,
            quantity: item.quantity,
          })),
          photos: (r.review_photos || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((p: any) => p.photo_url),
          reply: r.review_replies?.[0] || null,
        }));

        setReviews(processed);
        setTotalReviews(processed.length);

        if (processed.length > 0) {
          const avg = processed.reduce((sum: number, r: any) => sum + r.rating, 0) / processed.length;
          setAvgRating(avg);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-20 w-full rounded-card" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-card" />)}
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-2xl font-bold text-content-primary">Ulasan — {umkmName}</h1>
        </div>

        {/* Summary Card */}
        <Card className="p-6 flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-content-primary">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} readonly size="sm" />
            <p className="text-xs text-content-placeholder mt-1">{totalReviews} ulasan</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews.filter(r => Math.round(r.rating) === star).length;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-content-secondary">{star}</span>
                  <Star size={10} className="text-yellow-500 fill-yellow-500 shrink-0" />
                  <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-content-placeholder">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Daftar Ulasan */}
        {reviews.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-content-placeholder">Belum ada ulasan untuk UMKM ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-4 space-y-3">
                {/* Header: Nama (disamarkan) + Rating + Tanggal */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-content-primary">{maskName(review.customer_name)}</p>
                    <p className="text-[10px] text-content-placeholder">
                      {new Date(review.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <StarRating rating={Math.round(review.rating)} readonly size="sm" />
                </div>

                {/* Daftar Produk yang Dipesan */}
                <div className="flex flex-wrap gap-1">
                  {review.order_items.map((item, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-surface-secondary px-2 py-0.5 rounded-full text-content-secondary"
                    >
                      {item.product_name} ({item.quantity})
                    </span>
                  ))}
                </div>

                {/* Komentar */}
                {review.comment && (
                  <p className="text-sm text-content-secondary leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {/* Foto-foto */}
                {review.photos.length > 0 && (
                  <div className="flex gap-2">
                    {review.photos.map((url, i) => (
                      <div key={i} className="w-20 h-20 rounded-card overflow-hidden border border-border">
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Balasan Mitra */}
                {review.reply && (
                  <div className="ml-4 pl-4 border-l-2 border-primary-500/30 bg-primary-500/5 rounded-r-card p-3">
                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Balasan Penjual</p>
                    <p className="text-sm text-content-secondary mt-1">{review.reply.reply}</p>
                    <p className="text-[10px] text-content-placeholder mt-1">
                      {new Date(review.reply.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
