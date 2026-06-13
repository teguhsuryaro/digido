import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Truck, Gift, Flag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProductCard from '@/components/ProductCard';
import MapView from '@/components/MapView';
import ChatWidget from '@/components/customer/ChatWidget';
import ProductDetailModal from '@/components/ProductDetailModal';
import ReportModal from '@/components/ReportModal';
import { useLocationStore } from '@/store/useLocationStore';
import { calculateDistance, formatDistance } from '@/utils/distance';

interface UMKM {
  id: string;
  name: string;
  business_type: string;
  description: string;
  is_open: boolean;
  latitude: number;
  longitude: number;
  delivery_settings?: any;
  reviews?: any[];
  whatsapp_number?: string | null;
}

export default function UMKMDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const user = useAuthStore((s) => s.user);
  const [umkm, setUmkm] = useState<UMKM | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productRatings, setProductRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const userLocation = useLocationStore((s) => s.userLocation);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // Fetch UMKM + Delivery Settings + Reviews
        const { data: umkmData, error: umkmError } = await supabase
          .from('umkm')
          .select('*, delivery_settings(*), reviews(rating)')
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (umkmError) throw umkmError;
        setUmkm(umkmData as any);

        // Fetch Products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('umkm_id', id)
          .order('name');

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch accumulated ratings per product
        if (productsData && productsData.length > 0) {
          const { data: ratingsData } = await supabase
            .from('order_items')
            .select('product_id, rating')
            .in('product_id', productsData.map((p: any) => p.id))
            .not('rating', 'is', null);

          const ratingMap: Record<string, { sum: number; count: number }> = {};
          ((ratingsData as any) || []).forEach((item: any) => {
            if (!ratingMap[item.product_id]) {
              ratingMap[item.product_id] = { sum: 0, count: 0 };
            }
            ratingMap[item.product_id].sum += item.rating;
            ratingMap[item.product_id].count += 1;
          });

          const processed: Record<string, { avg: number; count: number }> = {};
          for (const [productId, data] of Object.entries(ratingMap)) {
            processed[productId] = {
              avg: data.sum / data.count,
              count: data.count,
            };
          }
          setProductRatings(processed);
        }
      } catch (err) {
        console.error('Error fetching UMKM detail:', err);
        toast.error('Gagal memuat detail toko.');
        navigate('/katalog');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-card" />)}
        </div>
      </div>
    );
  }

  if (!umkm) return null;

  const ratings = umkm.reviews?.map((r: any) => r.rating) || [];
  const avgRating = ratings.length > 0 ? ratings.reduce((a: any, b: any) => a + b, 0) / ratings.length : 0;
  const deliverySettings = Array.isArray(umkm.delivery_settings) 
    ? umkm.delivery_settings[0] 
    : umkm.delivery_settings;
  const isDeliveryActive = deliverySettings?.is_active;
  let distanceText = null;
  if (userLocation && umkm.latitude && umkm.longitude) {
    const dist = calculateDistance(umkm.latitude, umkm.longitude, userLocation.lat, userLocation.lng);
    distanceText = formatDistance(dist);
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-20 md:pb-8">
        {/* Header Section — Full-Width */}
        <section className="bg-surface-card rounded-card p-4 sm:p-6 border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-start justify-between sm:block gap-2 w-full">
                <h1 className="text-xl sm:text-3xl font-extrabold text-content-primary leading-tight">{umkm.name}</h1>
                <span className={`sm:hidden shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  umkm.is_open 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {umkm.is_open ? 'Buka' : 'Tutup'}
                </span>
              </div>
              <p className="text-content-secondary mt-1 text-sm font-medium">{umkm.business_type}</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
              <span className={`hidden sm:inline-block shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                umkm.is_open 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {umkm.is_open ? 'Buka' : 'Tutup'}
              </span>
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-900/30 text-xs text-content-secondary transition-colors flex items-center gap-1.5 font-medium ml-auto sm:ml-0"
              >
                <Flag size={14} />
                <span>Laporkan Toko</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5 flex-wrap">
            {/* Rating — Clickable ke halaman ulasan */}
            <button
              onClick={() => navigate(`/umkm/${id}/ulasan`)}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary hover:bg-surface-secondary/80 border border-border hover:border-primary-500/30 rounded-full transition-all cursor-pointer group"
              title="Lihat semua ulasan"
            >
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-content-primary text-sm">{avgRating.toFixed(1)}</span>
              </div>
              <div className="w-1 h-1 bg-border rounded-full" />
              <span className="text-xs text-content-secondary font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {ratings.length} Ulasan
              </span>
            </button>
            
            {distanceText && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border border-border rounded-full">
                <MapPin size={14} className="text-primary-500" />
                <span className="text-xs text-content-secondary font-medium">{distanceText}</span>
              </div>
            )}
          </div>

          <div className="mt-5 text-content-secondary leading-relaxed text-sm bg-surface-secondary/50 p-4 rounded-xl border border-border/50">
            {umkm.description}
          </div>
        </section>

        {/* Responsive Layout — Desktop 2-column, Mobile stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Left Column — Info, Maps, Delivery (1/3 weight) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Location & Navigation Section */}
            <section className="bg-surface-card rounded-card p-4 border border-border shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-content-primary">Lokasi & Navigasi</h2>
              
              {umkm.latitude && umkm.longitude ? (
                <>
                  <MapView 
                    lat={umkm.latitude} 
                    lng={umkm.longitude} 
                    label={umkm.name}
                    className="h-64 rounded-card overflow-hidden shadow-sm border border-border"
                  />
                  <Button 
                    variant="secondary" 
                    fullWidth 
                    className="flex items-center justify-center gap-2"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${umkm.latitude},${umkm.longitude}`, '_blank')}
                  >
                    <MapPin size={14} /> Buka di Google Maps
                  </Button>
                </>
              ) : (
                <div className="h-48 bg-surface-secondary rounded-card border border-dashed border-border flex flex-col items-center justify-center text-center p-4">
                  <MapPin size={32} className="text-content-placeholder mb-2 opacity-50" />
                  <p className="text-content-secondary text-sm font-medium">Lokasi Belum Diatur</p>
                  <p className="text-content-placeholder text-xs mt-1">Toko ini belum menyematkan titik lokasi di peta.</p>
                </div>
              )}
            </section>

            {/* Delivery Info Card */}
            <Card className="p-4">
              <h2 className="text-md font-bold text-content-primary mb-4 flex items-center gap-2">
                <Truck size={16} className="text-primary-500" /> Info Pengiriman
              </h2>
              {isDeliveryActive ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-content-secondary">Jangkauan Max:</span>
                    <span className="font-bold text-content-primary">{deliverySettings.max_radius_km} KM</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-content-secondary">Tarif:</span>
                    <span className="font-extrabold text-primary-500">
                      {deliverySettings.fee_type === 'free' 
                        ? 'Gratis' 
                        : deliverySettings.fee_type === 'flat'
                        ? formatRupiah(deliverySettings.flat_fee)
                        : `${formatRupiah(deliverySettings.per_km_fee)} / KM`}
                    </span>
                  </div>
                  {deliverySettings.free_delivery_min_order > 0 && (
                    <div className="mt-3 p-2 bg-primary-500/10 rounded-badge border border-primary-500/20 text-primary-600 text-[11px] font-bold flex items-center gap-1.5 justify-center">
                      <Gift size={12} /> Gratis ongkir minimal belanja {formatRupiah(deliverySettings.free_delivery_min_order)}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-content-secondary italic">
                  Saat ini hanya tersedia opsi ambil di tempat (Self-Pickup).
                </p>
              )}
            </Card>

          </div>

          {/* Right Column — Product Showcase (2/3 weight) */}
          <div className="lg:col-span-2 space-y-4">
            <section className="bg-surface-card rounded-card p-4 sm:p-6 border border-border shadow-sm">
              <h2 className="text-lg font-bold text-content-primary mb-4">Daftar Produk</h2>
              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="cursor-pointer"
                    >
                      <ProductCard 
                        product={product} 
                        umkmName={umkm.name} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center bg-surface-secondary rounded-card border border-dashed border-border flex flex-col items-center justify-center">
                  <p className="text-content-placeholder text-sm">Belum ada produk yang ditambahkan.</p>
                </div>
              )}
            </section>
          </div>

        </div>

        {/* Chatbot overlay remains at the very bottom */}
        {umkm && <ChatWidget umkm={umkm} />}
      </div>

      {/* Modal Detail Produk */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          avgRating={productRatings[selectedProduct.id]?.avg || 0}
          ratingCount={productRatings[selectedProduct.id]?.count || 0}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Modal Laporan UMKM */}
      {isReportModalOpen && (
        <ReportModal
          targetType="umkm"
          targetId={umkm.id}
          targetName={umkm.name}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </PageTransition>
  );
}
