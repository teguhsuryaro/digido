import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, Truck, CreditCard, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';

export default function DeliverySettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [umkm, setUmkm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [isActive, setIsActive] = useState(false);
  const [radius, setRadius] = useState(5.0);
  const [feeType, setFeeType] = useState<'free' | 'flat' | 'per_km'>('free');
  const [flatFee, setFlatFee] = useState(0);
  const [perKmFee, setPerKmFee] = useState(0);
  const [minOrder, setMinOrder] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // 1. Get UMKM
        const { data: umkmData, error: umkmError } = await supabase
          .from('umkm')
          .select('id, latitude, longitude, has_delivery')
          .eq('owner_id', user.id)
          .single();

        if (umkmError) throw umkmError;
        setUmkm(umkmData as any);

        // 2. Get Delivery Settings
        const { data: dsData, error: dsError } = await supabase
          .from('delivery_settings')
          .select('*')
          .eq('umkm_id', (umkmData as any).id)
          .single();

        if (dsError && dsError.code !== 'PGRST116') throw dsError; // PGRST116 is not found

        if (dsData) {
          const ds = dsData as any;
          setIsActive(ds.is_active);
          setRadius(ds.max_radius_km);
          setFeeType(ds.fee_type);
          setFlatFee(ds.flat_fee || 0);
          setPerKmFee(ds.per_km_fee || 0);
          setMinOrder(ds.free_delivery_min_order || 0);
        }
      } catch (err) {
        console.error('Error fetching delivery settings:', err);
        toast.error('Gagal memuat pengaturan pengiriman.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleToggle = (checked: boolean) => {
    if (checked && (!umkm?.latitude || !umkm?.longitude)) {
      toast.warning('Anda harus mengatur lokasi toko di halaman Operasional sebelum mengaktifkan Delivery.');
      return;
    }
    setIsActive(checked);
  };

  const handleSave = async () => {
    if (!umkm) return;
    setIsSaving(true);

    try {
      // 1. Upsert delivery_settings
      const payload = {
        umkm_id: umkm.id,
        is_active: isActive,
        max_radius_km: radius,
        fee_type: feeType,
        flat_fee: feeType === 'flat' ? flatFee : 0,
        per_km_fee: feeType === 'per_km' ? perKmFee : 0,
        free_delivery_min_order: minOrder,
        updated_at: new Date().toISOString()
      };

      const { error: dsError } = await supabase
        .from('delivery_settings')
        .upsert(payload as any, { onConflict: 'umkm_id' });

      if (dsError) throw dsError;

      // 2. Update umkm.has_delivery
      const { error: umkmError } = await supabase
        .from('umkm')
        .update({ has_delivery: isActive } as any)
        .eq('id', umkm.id);

      if (umkmError) throw umkmError;

      toast.success('Pengaturan pengiriman berhasil disimpan.');
    } catch (err) {
      console.error('Error saving delivery settings:', err);
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  }

  const noLocation = !umkm?.latitude || !umkm?.longitude;

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <button onClick={() => navigate('/mitra/pengaturan')} className="flex items-center gap-2 text-content-secondary hover:text-content-primary font-medium w-fit transition-colors">
            <ChevronLeft size={20} />
            Kembali ke Pengaturan
          </button>
          <div>
            <h1 className="text-2xl font-black text-content-primary">Pengaturan Pengiriman</h1>
            <p className="text-sm text-content-secondary mt-1">Atur radius maksimal dan tarif per kilometer.</p>
          </div>
        </div>

        {noLocation && (
          <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 p-4 rounded-card flex items-start gap-3">
            <AlertTriangle size={24} className="text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Lokasi Toko Belum Diatur</p>
              <p className="text-xs text-amber-800 dark:text-amber-500 mt-1 leading-relaxed">
                Anda harus menentukan lokasi koordinat toko di peta sebelum bisa mengaktifkan layanan pesan antar.
              </p>
              <Button 
                variant="secondary" 
                size="sm" 
                className="mt-3 bg-white border-amber-200 text-amber-900 hover:bg-amber-100 dark:bg-surface-card dark:border-amber-900/50 dark:text-amber-400"
                onClick={() => navigate('/mitra/operasional')}
              >
                Atur Lokasi Sekarang
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Main Toggle */}
          <Card className={`p-6 border-border transition-colors ${isActive ? 'bg-primary-50/30 dark:bg-primary-950/10 border-primary-100 dark:border-primary-900/30' : 'bg-surface-secondary'}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-bold text-content-primary text-base">Aktifkan Pesan Antar</p>
                <p className="text-xs text-content-secondary max-w-[200px] sm:max-w-none">Izinkan pelanggan memesan produk untuk diantar.</p>
              </div>
              <button 
                onClick={() => handleToggle(!isActive)}
                disabled={noLocation}
                className={`
                  w-12 h-6 rounded-full p-1 transition-colors relative shrink-0
                  ${isActive ? 'bg-primary-500' : 'bg-content-placeholder'}
                  ${noLocation ? 'opacity-30 cursor-not-allowed' : ''}
                `}
                aria-label="Toggle active delivery settings"
              >
                <div className={`
                  w-4 h-4 bg-white rounded-full shadow-sm transition-transform
                  ${isActive ? 'translate-x-6' : ''}
                `} />
              </button>
            </div>
          </Card>

          <div className={`space-y-6 transition-all duration-300 ${!isActive ? 'opacity-40 pointer-events-none grayscale-[50%]' : ''}`}>
            {/* Radius */}
            <Card className="p-6 border-border">
              <h2 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
                <Truck size={18} className="text-primary-500" />
                Radius & Jangkauan
              </h2>
              <div className="space-y-2">
                <Input 
                  label="Radius Maksimal (KM)" 
                  type="number" 
                  step="0.1"
                  value={radius}
                  onChange={(e) => setRadius(parseFloat(e.target.value))}
                  placeholder="Contoh: 5.0"
                />
                <p className="text-[10px] text-content-secondary italic px-1">
                  Hanya pesanan dalam radius ini yang akan Anda terima.
                </p>
              </div>
            </Card>

            {/* Fee Scheme */}
            <Card className="p-6 border-border">
              <h2 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-primary-500" />
                Skema Tarif Ongkir
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {['free', 'flat', 'per_km'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFeeType(type as any)}
                    className={`
                      p-4 rounded-card border-2 transition-all text-left flex flex-col justify-center min-h-[80px]
                      ${feeType === type ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-border hover:border-primary-500/30'}
                    `}
                  >
                    <p className={`text-xs font-black uppercase tracking-wider ${feeType === type ? 'text-primary-600 dark:text-primary-400' : 'text-content-placeholder'}`}>
                      {type === 'free' ? 'Gratis' : type === 'flat' ? 'Flat' : 'Per KM'}
                    </p>
                    <p className="text-[10px] text-content-secondary mt-1">
                      {type === 'free' ? 'Tanpa biaya ongkir' : type === 'flat' ? 'Biaya tetap sekali jalan' : 'Biaya dihitung sesuai jarak tempuh'}
                    </p>
                  </button>
                ))}
              </div>

              {feeType === 'flat' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input 
                    label="Biaya Flat (Rp)" 
                    type="number" 
                    value={flatFee}
                    onChange={(e) => setFlatFee(parseInt(e.target.value))}
                    placeholder="Contoh: 10000"
                  />
                  <p className="text-[10px] text-content-secondary mt-1 px-1">Biaya ongkir tetap ke semua lokasi (dalam jangkauan radius).</p>
                </div>
              )}

              {feeType === 'per_km' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input 
                    label="Biaya per KM (Rp)" 
                    type="number" 
                    value={perKmFee}
                    onChange={(e) => setPerKmFee(parseInt(e.target.value))}
                    placeholder="Contoh: 2000"
                  />
                  <p className="text-[10px] text-content-secondary mt-1 px-1">Biaya ongkir akan dikalikan dengan jarak (KM) antara toko dan pembeli.</p>
                </div>
              )}
            </Card>

            {/* Free Delivery Threshold */}
            <Card className="p-6 border-border">
              <h2 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
                <Gift size={18} className="text-primary-500" />
                Promo Gratis Ongkir
              </h2>
              <Input 
                label="Minimal Belanja (Rp)" 
                placeholder="0 = tidak ada minimal belanja"
                type="number" 
                value={minOrder}
                onChange={(e) => setMinOrder(parseInt(e.target.value))}
              />
              <p className="text-[10px] text-content-placeholder italic px-1 mt-2">
                * Pelanggan akan otomatis mendapatkan gratis ongkir jika total belanja produk melebihi nominal di atas.
              </p>
            </Card>
          </div>

          <div className="pt-4 pb-2">
            <Button 
              variant="primary" 
              fullWidth 
              size="lg"
              isLoading={isSaving}
              onClick={handleSave}
              className="shadow-lg shadow-primary-500/20"
            >
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
