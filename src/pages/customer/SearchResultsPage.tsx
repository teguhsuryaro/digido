import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, Store, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import UMKMCard from '@/components/UMKMCard';
import ProductCard from '@/components/ProductCard';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [inputValue, setInputValue] = useState(query);
  const debouncedQuery = useDebounce(inputValue, 500);

  const [umkms, setUmkms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Update URL saat debounced query berubah
  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
    } else {
      setSearchParams({});
    }
  }, [debouncedQuery, setSearchParams]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setUmkms([]);
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 1. Search UMKM
        const { data: umkmData } = await supabase
          .from('umkm')
          .select('*, reviews(rating), delivery_settings(*), subscriptions(id, status, expires_at)')
          .ilike('name', `%${query}%`)
          .limit(10);

        // 2. Search Products (with UMKM name for ProductCard)
        const { data: productData } = await supabase
          .from('products')
          .select('*, umkm(name)')
          .ilike('name', `%${query}%`)
          .limit(20);

        // Process UMKM Data (Rating calculation)
        const processedUmkms = ((umkmData as any) || []).map((u: any) => {
          const ratings = u.reviews?.map((r: any) => r.rating) || [];
          const avgRating = ratings.length > 0 ? ratings.reduce((a: any, b: any) => a + b, 0) / ratings.length : 0;
          
          const settings = Array.isArray(u.delivery_settings)
            ? u.delivery_settings[0]
            : u.delivery_settings;

          return {
            ...u,
            avg_rating: avgRating,
            review_count: ratings.length,
            has_delivery: settings?.is_active || false,
            is_free_delivery: (settings?.free_delivery_min_order || 0) > 0,
            is_unggulan: (u.subscriptions || []).some(
              (s: any) => s.status === 'active' && new Date(s.expires_at) > new Date()
            ),
          };
        });

        setUmkms(processedUmkms);
        setProducts((productData as any) || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const hasResults = umkms.length > 0 || products.length > 0;

  return (
    <PageTransition>
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Search Header */}
        <div className="sticky top-16 bg-surface-primary/80 backdrop-blur-md z-20 py-3 -mx-4 px-4 border-b border-border">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Cari produk atau UMKM..."
              className="w-full px-4 py-3 pl-10 rounded-full bg-surface-card border border-border text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all placeholder:text-content-placeholder"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-placeholder">
              <Search size={16} />
            </span>
            {inputValue && (
              <button 
                onClick={() => setInputValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-secondary text-content-secondary hover:bg-surface-tertiary transition-colors"
                aria-label="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="grid-umkm">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-28 w-full rounded-card" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-48 w-full rounded-card" />
                ))}
              </div>
            </div>
          </div>
        ) : hasResults ? (
          <>
            {/* UMKM Results */}
            {umkms.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-content-primary">
                  <Store size={18} className="text-primary-500" /> Toko Ditemukan <span className="text-xs font-normal text-content-secondary">({umkms.length})</span>
                </h2>
                <div className="grid-umkm">
                  {umkms.map((u) => (
                    <UMKMCard key={u.id} umkm={u} />
                  ))}
                </div>
              </section>
            )}

            {/* Product Results */}
            {products.length > 0 && (
              <section className="pt-4">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-content-primary">
                  <Package size={18} className="text-primary-500" /> Produk Ditemukan <span className="text-xs font-normal text-content-secondary">({products.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <div key={p.id} className="relative group">
                      <ProductCard product={p} umkmName={p.umkm?.name || 'Toko'} />
                      <button 
                        onClick={() => navigate(`/umkm/${p.umkm_id}`)}
                        className="absolute top-2 left-2 bg-white/90 dark:bg-black/80 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-full border border-border shadow-sm hover:bg-primary-500 hover:text-white transition-all flex items-center gap-1 text-content-primary"
                      >
                        <Store size={10} /> {p.umkm?.name}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : query ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="text-6xl mb-6 text-content-placeholder opacity-40">
              <Search size={54} className="mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-content-primary">Hasil Tidak Ditemukan</h2>
            <p className="text-content-secondary mt-2">
              Tidak ditemukan hasil untuk <span className="italic text-primary-500">"{query}"</span>.
            </p>
            <p className="text-sm text-content-placeholder mt-1">
              Coba kata kunci lain atau periksa ejaan Anda.
            </p>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="text-6xl mb-6 text-content-placeholder opacity-40">
              <Search size={54} className="mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-content-primary">Mulailah Mencari</h2>
            <p className="text-content-secondary mt-2">
              Masukkan nama toko atau produk yang Anda inginkan.
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
