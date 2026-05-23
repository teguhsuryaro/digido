import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import UMKMCard from '@/components/UMKMCard';

interface UMKM {
  id: string;
  name: string;
  business_type: string;
  description: string;
  is_open: boolean;
  avg_rating: number;
  review_count: number;
  has_delivery: boolean;
  is_free_delivery: boolean;
  photo_url?: string | null;  // BARU
  is_unggulan?: boolean;      // BARU
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredUMKM, setFeaturedUMKM] = useState<UMKM[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('umkm')
        .select(`
          id, name, business_type, description, is_open, photo_url, latitude, longitude,
          reviews(rating),
          delivery_settings(is_active, free_delivery_min_order),
          subscriptions!inner(id, status, expires_at)
        `)
        .eq('is_active', true)
        .eq('subscriptions.status', 'active')
        .gte('subscriptions.expires_at', now)
        .limit(6);
      
      const processed = ((data as any) || []).map((u: any) => {
        const ratings = u.reviews?.map((r: any) => r.rating) || [];
        const avgRating = ratings.length > 0 
          ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
          : 0;

        const settings = Array.isArray(u.delivery_settings)
          ? u.delivery_settings[0]
          : u.delivery_settings;

        return {
          id: u.id,
          name: u.name,
          business_type: u.business_type,
          description: u.description || '',
          is_open: u.is_open,
          avg_rating: avgRating,
          review_count: ratings.length,
          has_delivery: settings?.is_active || false,
          is_free_delivery: (settings?.free_delivery_min_order || 0) > 0,
          photo_url: u.photo_url || null,  // BARU
          is_unggulan: true,
          latitude: u.latitude,
          longitude: u.longitude,
        };
      });

      setFeaturedUMKM(processed);
      setIsLoading(false);
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <PageTransition>
      <div className="section-gap pb-20 md:pb-8">
        {/* Hero Section — full-width, responsive */}
        <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-card p-6 sm:p-8 lg:p-12 text-white overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-2xl animate-fade-in duration-300">
            <h1 className="text-hero-sm lg:text-hero mb-3 font-extrabold tracking-tight leading-tight">
              Selamat Datang di DigiDO! 👋
            </h1>
            <p className="text-primary-100 text-sm sm:text-base mb-6 max-w-lg leading-relaxed">
              Temukan UMKM terbaik di sekitarmu dan pesan langsung dari rumah.
              Dukung produk lokal, nikmati kemudahan belanja digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="accent" size="lg" onClick={() => navigate('/katalog')}>
                Jelajahi Katalog
              </Button>
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10" onClick={() => navigate('/cari')}>
                Cari Produk
              </Button>
            </div>
          </div>
          {/* Decorative floating balls */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute left-1/2 -bottom-12 w-32 h-32 bg-accent-500/20 rounded-full blur-2xl" />
        </section>



        {/* Mobile Search Bar (hidden on desktop karena sudah ada di navbar) */}
        <form onSubmit={handleSearch} className="md:hidden">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-placeholder" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk atau UMKM..."
              className="w-full px-4 py-3 pl-10 rounded-card bg-surface-card border border-border text-content-primary placeholder:text-content-placeholder focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-border-focus transition-colors"
            />
          </div>
        </form>

        {/* UMKM Premium — Grid responsif */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold">UMKM Premium</h2>
            <button 
              onClick={() => navigate('/katalog')} 
              className="text-sm text-primary-500 font-semibold hover:underline flex items-center gap-1"
            >
              Lihat Semua →
            </button>
          </div>

          {isLoading ? (
            <div className="grid-umkm">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : featuredUMKM.length > 0 ? (
            <div className="grid-umkm">
              {featuredUMKM.map((umkm) => (
                <UMKMCard key={umkm.id} umkm={umkm} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-surface-secondary rounded-card border border-dashed border-border">
              <p className="text-content-placeholder text-sm">Belum ada UMKM yang berlangganan paket premium.</p>
              <p className="text-content-placeholder text-xs mt-1">UMKM dengan paket Bronze, Silver, atau Gold akan tampil di sini.</p>
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
