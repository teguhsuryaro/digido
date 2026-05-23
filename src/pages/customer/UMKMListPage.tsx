import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import { Search } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import UMKMCard from '@/components/UMKMCard';
import { useLocationStore } from '@/store/useLocationStore';
import { calculateDistance } from '@/utils/distance';

interface UMKMData {
  id: string;
  name: string;
  business_type: string;
  description: string;
  is_open: boolean;
  latitude: number;
  longitude: number;
  reviews: { rating: number }[];
  delivery_settings: { is_active: boolean; free_delivery_min_order: number } | null;
}

type SortOption = 'name_asc' | 'name_desc' | 'rating' | 'distance';

export default function UMKMListPage() {
  const [umkms, setUmkms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters & Sort
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDelivery, setFilterDelivery] = useState(false);
  const [filterFreeOngkir, setFilterFreeOngkir] = useState(false);
  const userLocation = useLocationStore((s) => s.userLocation);
  const setUserLocation = useLocationStore((s) => s.setUserLocation);

  const PAGE_SIZE = 10;

  // Get user location
  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          console.warn('Geolocation denied by user.');
        }
      );
    }
  }, []);

  const fetchUmkms = useCallback(async (pageNum: number, isNew: boolean = false) => {
    if (isNew) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      let query = supabase
        .from('umkm')
        .select(`
          *,
          reviews(rating),
          delivery_settings(*),
          subscriptions(id, status, expires_at)
        `)
        .eq('is_active', true);

      if (filterOpen) query = query.eq('is_open', true);

      // Pagination
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const { data, error } = await query.range(from, to).order('name', { ascending: sortBy === 'name_asc' });

      if (error) throw error;

      // Process Data
      let processed = ((data as any) || []).map((u: UMKMData) => {
        const ratings = u.reviews.map(r => r.rating);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        
        return {
          ...u,
          avg_rating: avgRating,
          review_count: ratings.length,
          has_delivery: u.delivery_settings?.is_active || false,
          is_free_delivery: (u.delivery_settings?.free_delivery_min_order || 0) > 0,
          is_unggulan: ((u as any).subscriptions || []).some(
            (s: any) => s.status === 'active' && new Date(s.expires_at) > new Date()
          ),
        };
      });

      // Filter by Delivery/FreeOngkir (JS side)
      if (filterDelivery) processed = processed.filter((u: any) => u.has_delivery);
      if (filterFreeOngkir) processed = processed.filter((u: any) => u.is_free_delivery);

      // Sort by Rating or Distance if needed (JS side)
      if (sortBy === 'rating') {
        processed.sort((a: any, b: any) => b.avg_rating - a.avg_rating);
      } else if (sortBy === 'distance' && userLocation) {
        processed.sort((a: any, b: any) => {
          const distA = calculateDistance(a.latitude, a.longitude, userLocation.lat, userLocation.lng);
          const distB = calculateDistance(b.latitude, b.longitude, userLocation.lat, userLocation.lng);
          return distA - distB;
        });
      }

      if (isNew) {
        setUmkms(processed);
      } else {
        setUmkms(prev => [...prev, ...processed]);
      }

      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching UMKM:', err);
      toast.error('Gagal memuat daftar UMKM.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filterOpen, filterDelivery, filterFreeOngkir, sortBy, userLocation]);

  useEffect(() => {
    setPage(0);
    fetchUmkms(0, true);
  }, [fetchUmkms]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUmkms(nextPage);
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-content-primary">Katalog UMKM</h1>
          <p className="text-sm sm:text-base text-content-secondary mt-1">
            Temukan produk terbaik dari mitra UMKM kami.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2 py-3 overflow-x-auto no-scrollbar border-b border-border sticky top-16 bg-surface-primary/80 backdrop-blur-md z-20">
          <select 
            className="bg-surface-card border border-border rounded-full px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500/20"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="name_asc">Nama A-Z</option>
            <option value="name_desc">Nama Z-A</option>
            <option value="rating">Rating Tertinggi</option>
            {userLocation && <option value="distance">Jarak Terdekat</option>}
          </select>

          <FilterButton 
            active={filterOpen} 
            onClick={() => setFilterOpen(!filterOpen)}
            label="Buka Saja"
          />
          <FilterButton 
            active={filterDelivery} 
            onClick={() => setFilterDelivery(!filterDelivery)}
            label="Delivery"
          />
          <FilterButton 
            active={filterFreeOngkir} 
            onClick={() => setFilterFreeOngkir(!filterFreeOngkir)}
            label="Gratis Ongkir"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid-umkm">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-card" />
            ))}
          </div>
        ) : umkms.length > 0 ? (
          <div className="flex flex-col gap-6">
            <div className="grid-umkm">
              {umkms.map((u) => (
                <UMKMCard key={u.id} umkm={u} />
              ))}
            </div>

            {hasMore && (
              <div className="max-w-xs mx-auto w-full pt-4">
                <Button 
                  variant="secondary" 
                  fullWidth 
                  onClick={loadMore}
                  isLoading={isLoadingMore}
                >
                  Muat Lebih Banyak
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card className="py-20 text-center flex flex-col items-center justify-center">
            <div className="text-5xl mb-4 text-content-placeholder opacity-40">
              <Search size={48} className="mx-auto" />
            </div>
            <p className="text-content-primary font-bold">Tidak ada UMKM ditemukan</p>
            <p className="text-content-secondary text-sm mt-1">Coba ubah filter atau pencarian Anda.</p>
            <Button 
              variant="primary" 
              className="mt-6"
              onClick={() => {
                setFilterOpen(false);
                setFilterDelivery(false);
                setFilterFreeOngkir(false);
                setSortBy('name_asc');
              }}
            >
              Reset Filter
            </Button>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-base whitespace-nowrap ${
        active 
          ? 'bg-primary-500 border-primary-500 text-white' 
          : 'bg-surface-card border-border text-content-secondary hover:border-primary-500/50'
      }`}
    >
      {label}
    </button>
  );
}
