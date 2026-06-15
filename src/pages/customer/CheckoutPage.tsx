import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { formatRupiah } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import PageTransition from '@/components/ui/PageTransition';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import QRISDisplay from '@/components/QRISDisplay';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { items, umkmId, umkmName, getSubtotal, clearCart } = useCartStore();

  const [wallet, setWallet] = useState<any>(null);
  const [deliverySettings, setDeliverySettings] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const subtotal = getSubtotal();
  const ADMIN_FEE = 500;

  useEffect(() => {
    if (!user || !umkmId) return;

    const fetchData = async () => {
      try {
        // 1. Fetch User Wallet
        const { data: walletData } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setWallet(walletData as any);

        // 2. Fetch UMKM Delivery Settings
        const { data: deliveryData } = await supabase
          .from('delivery_settings')
          .select('*')
          .eq('umkm_id', umkmId)
          .maybeSingle();
        setDeliverySettings(deliveryData as any);
      } catch (err) {
        console.error('Error fetching checkout data:', err);
      }
    };

    fetchData();
  }, [user, umkmId]);

  // Hitung Ongkir
  let deliveryFee = 0;
  if (deliverySettings?.is_active) {
    if (deliverySettings.free_delivery_min_order > 0 && subtotal >= deliverySettings.free_delivery_min_order) {
      deliveryFee = 0;
    } else if (deliverySettings.fee_type === 'flat') {
      deliveryFee = deliverySettings.flat_fee;
    } else {
      // Untuk prototype, jika per_km, kita asumsikan 2km
      deliveryFee = deliverySettings.per_km_fee * 2;
    }
  }

  // Hitung Potongan Dompet
  const walletBalance = (wallet as any)?.balance || 0;
  const totalBeforeWallet = subtotal + deliveryFee + ADMIN_FEE;
  const walletDeduction = useWallet ? Math.min(walletBalance, totalBeforeWallet) : 0;
  const finalTotal = totalBeforeWallet - walletDeduction;

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setAddress(`Lokasi Terdeteksi: ${pos.coords.latitude}, ${pos.coords.longitude} (Harap lengkapi alamat detail)`);
        },
        () => toast.error('Gagal mendapatkan lokasi.')
      );
    }
  };

  const handleConfirmPayment = async () => {
    if (!user) {
      toast.error('Sesi tidak valid. Silakan login kembali.');
      navigate('/login');
      return;
    }

    if (!umkmId) {
      toast.error('Keranjang belanja kosong atau tidak valid.');
      navigate('/keranjang');
      return;
    }

    if (deliverySettings?.is_active && !address.trim()) {
      toast.warning('Alamat pengiriman wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id,
          umkm_id: umkmId,
          subtotal,
          delivery_fee: deliveryFee,
          admin_fee: ADMIN_FEE,
          wallet_deduction: walletDeduction,
          total: finalTotal,
          status: 'pending',
          delivery_address: address || null,
          notes: notes || null,
        } as any)
        .select()
        .maybeSingle();

      if (orderError) {
        console.error('Order insert error:', orderError);
        throw new Error(`Gagal membuat pesanan: ${orderError.message}`);
      }

      // 2. Create Order Items
      const orderItems = items.map(item => ({
        order_id: (order as any).id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems as any);

      if (itemsError) {
        console.error('Order items insert error:', itemsError);
        throw new Error(`Gagal menyimpan item pesanan: ${itemsError.message}`);
      }

      // 3. Handle Wallet Deduction
      if (walletDeduction > 0 && wallet) {
        try {
          const { error: walletUpdateError } = await supabase
            .from('wallets')
            .update({ balance: walletBalance - walletDeduction } as any)
            .eq('id', (wallet as any).id);

          if (!walletUpdateError) {
            await supabase.from('wallet_transactions').insert({
              wallet_id: (wallet as any).id,
              type: 'debit',
              amount: walletDeduction,
              description: `Pembayaran pesanan #${(order as any).id.slice(0, 8)}`,
            } as any);
          }
        } catch (walletErr) {
          console.warn('Wallet deduction failed (non-critical):', walletErr);
        }
      }

      // 4. Success
      setIsSuccess(true);
      clearCart();
      toast.success('Pesanan berhasil dibuat!');
      navigate(`/pesanan/${(order as any).id}`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      const message = err?.message || 'Terjadi kesalahan tidak diketahui';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    navigate('/keranjang');
    return null;
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-8">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Checkout</h1>
          <p className="text-sm text-content-secondary mt-1">Konfirmasi detail pesanan Anda dari <span className="font-bold text-content-primary">{umkmName}</span>.</p>
        </div>

        {/* Ringkasan Item */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-content-placeholder mb-3">Item Pesanan</h2>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-surface-secondary p-3 rounded-card text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary-500 w-6">{item.quantity}x</span>
                  <span className="text-content-primary font-medium">{item.name}</span>
                </div>
                <span className="text-content-secondary font-medium">{formatRupiah(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Alamat Pengiriman */}
        {deliverySettings?.is_active && (
          <section>
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-content-placeholder">Alamat Pengiriman</h2>
              <button
                onClick={handleGeolocation}
                className="text-[11px] text-primary-500 font-bold hover:underline flex items-center gap-1"
              >
                <MapPin size={12} /> Gunakan Lokasi Saat Ini
              </button>
            </div>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Masukkan alamat lengkap pengiriman..."
              className="w-full p-4 rounded-card bg-surface-card border border-border text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none min-h-[100px] transition-all placeholder:text-content-placeholder"
            />
          </section>
        )}

        {/* Catatan */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-content-placeholder mb-3">Catatan Tambahan (Opsional)</h2>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Sambalnya dipisah ya..."
          />
        </section>

        {/* Wallet Split Payment */}
        <Card className="p-4 bg-primary-500/5 border border-primary-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-500/10">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-content-primary">Saldo Dompet DigiDO</p>
                <p className="text-xs text-content-secondary">Saldo: {formatRupiah(walletBalance)}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useWallet}
                onChange={() => setUseWallet(!useWallet)}
                disabled={walletBalance <= 0}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </Card>

        {/* Payment Summary */}
        <section className="pt-4 border-t border-border">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-content-secondary">Subtotal</span>
              <span className="font-medium text-content-primary">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-secondary">Ongkos Kirim</span>
              <span className="font-medium text-content-primary">{deliveryFee === 0 ? 'Gratis' : formatRupiah(deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-secondary">Biaya Admin DigiDO</span>
              <span className="font-medium text-content-primary">{formatRupiah(ADMIN_FEE)}</span>
            </div>
            {walletDeduction > 0 && (
              <div className="flex justify-between text-green-600 font-bold dark:text-green-400">
                <span>Potongan Dompet</span>
                <span>-{formatRupiah(walletDeduction)}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-between items-center border-t border-border/50 pt-4">
            <span className="font-bold text-content-primary text-base">Total Pembayaran</span>
            <span className="font-extrabold text-primary-500 text-2xl">{formatRupiah(finalTotal)}</span>
          </div>
        </section>

        {/* QRIS Display */}
        {finalTotal > 0 && (
          <div className="py-4">
            <QRISDisplay total={finalTotal} />
          </div>
        )}

        {/* Confirm Button */}
        <div className="pt-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            onClick={handleConfirmPayment}
            className="shadow-lg shadow-primary-500/20 font-bold py-4"
          >
            Konfirmasi Pembayaran
          </Button>
          <p className="text-[10px] text-content-placeholder text-center mt-3 uppercase tracking-widest font-medium">
            Aman • Terverifikasi • DigiDO Pay
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
