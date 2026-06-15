import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/useCartStore';
import { formatRupiah } from '@/utils/format';
import PageTransition from '@/components/ui/PageTransition';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CartItem from '@/components/CartItem';

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    items, 
    umkmId, 
    umkmName, 
    updateQuantity, 
    removeItem, 
    getSubtotal, 
    getItemCount 
  } = useCartStore();

  const [deliverySettings, setDeliverySettings] = useState<any>(null);

  useEffect(() => {
    if (!umkmId) return;

    const fetchDeliverySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('*')
          .eq('umkm_id', umkmId)
          .maybeSingle();

        if (error) throw error;
        setDeliverySettings(data);
      } catch (err) {
        console.error('Error fetching delivery settings:', err);
      }
    };

    fetchDeliverySettings();
  }, [umkmId]);

  const subtotal = getSubtotal();
  const itemCount = getItemCount();
  const ADMIN_FEE = 500;

  // Estimasi ongkir (hanya jika flat atau free promo terpenuhi)
  let estimatedOngkir = 0;
  let isOngkirEstimated = false;

  if (deliverySettings) {
    if (deliverySettings.free_delivery_min_order > 0 && subtotal >= deliverySettings.free_delivery_min_order) {
      estimatedOngkir = 0;
      isOngkirEstimated = true;
    } else if (deliverySettings.fee_type === 'flat') {
      estimatedOngkir = deliverySettings.flat_fee;
      isOngkirEstimated = true;
    }
  }

  if (itemCount === 0) {
    return (
      <PageTransition>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
          <div className="text-content-placeholder opacity-40 mb-6 animate-bounce-soft">
            <ShoppingCart size={80} />
          </div>
          <h2 className="text-2xl font-bold text-content-primary">Keranjang Kosong</h2>
          <p className="text-content-secondary mt-2 max-w-xs">
            Wah, keranjangmu masih sepi nih. Yuk, cari makanan atau produk favoritmu sekarang!
          </p>
          <Button 
            variant="primary" 
            className="mt-8 px-8"
            onClick={() => navigate('/katalog')}
          >
            Mulai Belanja
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-32 md:pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Keranjang Belanja</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">
              {itemCount} Produk
            </span>
            <span className="text-sm text-content-secondary">
              dari <span className="font-bold text-content-primary">{umkmName}</span>
            </span>
          </div>
        </div>

        {/* Desktop: 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Item List (2/3) */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <CartItem 
                key={item.id} 
                item={item} 
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Right: Order Summary sticky sidebar (1/3) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              <Card className="p-4 bg-surface-secondary border-none">
                <h3 className="font-bold text-content-primary mb-3">Ringkasan Pesanan</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-content-secondary">Subtotal</span>
                    <span className="font-medium text-content-primary">{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">Ongkos Kirim</span>
                    <span className="font-medium text-primary-500">
                      {isOngkirEstimated ? (
                        estimatedOngkir === 0 ? 'Gratis' : formatRupiah(estimatedOngkir)
                      ) : (
                        'Dihitung di Checkout'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">Biaya Admin DigiDO</span>
                    <span className="font-medium text-content-primary">{formatRupiah(ADMIN_FEE)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <span className="font-bold text-content-primary text-base">Total Estimasi</span>
                  <span className="font-extrabold text-primary-500 text-xl">
                    {formatRupiah(subtotal + estimatedOngkir + ADMIN_FEE)}
                  </span>
                </div>

                {deliverySettings?.free_delivery_min_order > 0 && subtotal < deliverySettings.free_delivery_min_order && (
                  <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-card border border-primary-500/10 text-[11px] text-content-secondary">
                    <span className="text-primary-500 font-bold">Tips:</span> Tambah belanja{' '}
                    <span className="font-bold text-content-primary">
                      {formatRupiah(deliverySettings.free_delivery_min_order - subtotal)}
                    </span>{' '}
                    lagi untuk dapat <span className="text-primary-500 font-bold uppercase tracking-wider">Gratis Ongkir!</span>
                  </div>
                )}
              </Card>

              {/* Desktop Only Action Button */}
              <div className="hidden lg:block">
                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth 
                  className="shadow-lg shadow-primary-500/20 py-4 font-bold"
                  onClick={() => navigate('/checkout')}
                >
                  Lanjut ke Pembayaran
                </Button>
              </div>

            </div>
          </div>

        </div>

        {/* Mobile Only: Fixed Action Button at bottom */}
        <div className="lg:hidden fixed bottom-20 left-0 right-0 px-4 py-3 bg-surface-primary/80 backdrop-blur-md border-t border-border z-30">
          <div className="max-w-lg mx-auto">
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              className="shadow-lg shadow-primary-500/20 font-bold"
              onClick={() => navigate('/checkout')}
            >
              Lanjut ke Pembayaran
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
